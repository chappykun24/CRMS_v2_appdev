import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
import { useScrollContext } from '../../../contexts/ScrollContext';
import { useUser } from '../../../contexts/UserContext';
import { useModal } from '../../../utils/useModal';
import { userService } from '../../../utils/userService';
import UserManagementHeader from '../../components/UserManagementHeader';

const UserManagement = () => {
  const { currentUser } = useUser();
  const router = useRouter();
  const { scrollY, headerTranslateY } = useScrollContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterApproval, setFilterApproval] = useState('');
  const [stats, setStats] = useState({});
  const [approvingUser, setApprovingUser] = useState(null);
  const [showContainers, setShowContainers] = useState(true);
  const [isTableView, setIsTableView] = useState(false);
  const [isStickyFilter, setIsStickyFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { visible: modalVisible, selectedItem: selectedUser, openModal, closeModal } = useModal();
  const params = useLocalSearchParams();

  // Handle scroll to show/hide sticky filter
  React.useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      // Show sticky filter when scrolled past 150px
      setIsStickyFilter(value > 150);
    });

    return () => scrollY.removeListener(listener);
  }, [scrollY]);

  // On mount, just fetch users and stats in parallel
  useEffect(() => {
    // If redirected with a role param, set filterRole
    if (params?.role) {
      setFilterRole(params.role);
      setTimeout(() => {
        Promise.all([
          fetchUsers(params.role),
          fetchStats()
        ]);
      }, 0);
    } else {
      Promise.all([
        fetchUsers(),
        fetchStats()
      ]);
    }
  }, []);

  // Refetch users when filterRole or filterApproval changes
  useEffect(() => {
    if (filterRole !== '' || filterApproval !== '') {
      fetchUsers();
    }
  }, [filterRole, filterApproval]);

  const fetchUsers = async (roleOverride) => {
    try {
      setLoading(true);
      const options = {};
      // Only set options.role if roleOverride or filterRole is non-empty and not 'all'
      if (roleOverride && roleOverride !== 'all') {
        options.role = roleOverride;
      } else if (filterRole && filterRole !== 'all') {
        options.role = filterRole;
      }
      // Always maintain the current approval filter
      if (filterApproval !== '') options.is_approved = filterApproval === 'true';
      const response = await userService.getUsers(options);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const userStats = await userService.getUserStats();
      setStats(userStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    await fetchStats();
    setRefreshing(false);
  };

  const handleApprovalToggle = async (userId, currentStatus) => {
    try {
      setApprovingUser(userId);
      const newStatus = !currentStatus;
      const response = await userService.updateUserApproval(userId, newStatus, currentUser?.user_id);
      if (response && response.user && Boolean(response.user.is_approved) === Boolean(newStatus)) {
        // Refetch users and stats from backend to ensure UI is in sync
        // Pass the current filterRole to maintain the filter state
        await fetchUsers(filterRole);
        await fetchStats();
        Alert.alert('Success', `User ${newStatus ? 'approved' : 'disapproved'} successfully`);
      } else {
        Alert.alert('Error', 'Failed to update user approval on the server.');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      Alert.alert('Error', 'Failed to update user approval');
    } finally {
      setApprovingUser(null);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await fetchUsers();
      return;
    }

    try {
      setLoading(true);
      const response = await userService.searchUsers(searchTerm);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    Alert.alert('Add User', 'This will open the add user form.');
  };

  const openUserModal = (user) => {
    openModal(user);
  };

  const closeUserModal = () => {
    closeModal();
  };

  const handleModalApprovalToggle = async () => {
    if (!selectedUser) return;
    
    try {
      setApprovingUser(selectedUser.user_id);
      const newStatus = !selectedUser.is_approved;
      const response = await userService.updateUserApproval(selectedUser.user_id, newStatus, currentUser?.user_id);
      if (response && response.user && Boolean(response.user.is_approved) === Boolean(newStatus)) {
        // Update the selected user in the modal
        setSelectedUser({ ...selectedUser, is_approved: newStatus });
        // Refetch users and stats from backend to ensure UI is in sync
        await fetchUsers(filterRole);
        await fetchStats();
        Alert.alert('Success', `User ${newStatus ? 'approved' : 'disapproved'} successfully`);
      } else {
        Alert.alert('Error', 'Failed to update user approval on the server.');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      Alert.alert('Error', 'Failed to update user approval');
    } finally {
      setApprovingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (searchTerm) {
      return user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusBadgeColor = (role, is_approved) => {
    if (role === 'Faculty') {
      return is_approved ? '#22c55e' : '#facc15'; // green for approved, yellow for pending
    } else {
      return is_approved ? '#22c55e' : '#ef4444'; // green for active, red for inactive
    }
  };

  const getRoleColor = (role) => {
    // Use grey for all roles
    return '#6B7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderUserCard = (user) => {
    return (
      <ClickableContainer
        key={user.user_id}
        style={styles.userCard}
        onPress={() => openUserModal(user)}
      >
        {/* Large status dot at top right as a View */}
        <View style={[
          styles.statusDotCircle,
          { backgroundColor: getStatusBadgeColor(user.role_name, user.is_approved) }
        ]} />
        <View style={styles.userHeader}>
          {/* No avatar */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.roleTextBelow}>
              {user.role_name ? user.role_name.toUpperCase() : 'UNKNOWN ROLE'}
            </Text>
          </View>
        </View>
      </ClickableContainer>
    );
  };

  const renderUserModal = () => {
    if (!selectedUser) return null;

    const modalFooter = (
      <TouchableOpacity
        style={[
          styles.modalApprovalButton,
          { backgroundColor: selectedUser.is_approved ? '#f87171' : '#dc2626' }
        ]}
        onPress={handleModalApprovalToggle}
        disabled={approvingUser === selectedUser.user_id}
      >
        {approvingUser === selectedUser.user_id ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.modalApprovalButtonText}>
            {selectedUser.role_name === 'Faculty'
              ? (selectedUser.is_approved ? 'Disapprove' : 'Approve')
              : (selectedUser.is_approved ? 'Deactivate' : 'Activate')}
          </Text>
        )}
      </TouchableOpacity>
    );

    return (
      <ModalContainer
        visible={modalVisible}
        onClose={closeUserModal}
        title="User Details"
        footer={modalFooter}
      >
        <View style={styles.modalUserHeader}>
          <View style={styles.modalAvatar}>
            {selectedUser.profile_pic ? (
              <Image source={{ uri: selectedUser.profile_pic }} style={styles.modalAvatarImage} />
            ) : (
              <Text style={styles.modalAvatarText}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.modalUserInfo}>
            <Text style={styles.modalUserName}>{selectedUser.name}</Text>
            <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
            <View style={styles.modalBadgeContainer}>
              <View 
                style={[
                  styles.modalRoleBadge, 
                  { backgroundColor: getRoleColor(selectedUser.role_name) }
                ]}
              >
                <Text style={styles.modalRoleText}>
                  {selectedUser.role_name || 'Unknown Role'}
                </Text>
              </View>
              <View style={[
                styles.modalApprovalBadge,
                { backgroundColor: selectedUser.is_approved ? '#dc2626' : '#f87171' }
              ]}>
                <Text style={styles.modalApprovalText}>
                  {selectedUser.role_name === 'Faculty'
                    ? (selectedUser.is_approved ? 'Approved' : 'Pending')
                    : (selectedUser.is_approved ? 'Active' : 'Inactive')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.modalDetails}>
          {selectedUser.designation && (
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="briefcase-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.modalDetailLabel}>Designation:</Text>
                <Text style={styles.modalDetailValue}>{selectedUser.designation}</Text>
              </View>
            </View>
          )}
          
          {selectedUser.office_assigned && (
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="location" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.modalDetailLabel}>Office:</Text>
                <Text style={styles.modalDetailValue}>{selectedUser.office_assigned}</Text>
              </View>
            </View>
          )}
          
          {selectedUser.contact_email && (
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.modalDetailLabel}>Contact:</Text>
                <Text style={styles.modalDetailValue} numberOfLines={1}>{selectedUser.contact_email}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.modalDetailRow}>
            <View style={styles.modalDetailItem}>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
              <Text style={styles.modalDetailLabel}>Created:</Text>
              <Text style={styles.modalDetailValue}>{formatDate(selectedUser.created_at)}</Text>
            </View>
          </View>
          
          {selectedUser.updated_at !== selectedUser.created_at && (
            <View style={styles.modalDetailRow}>
              <View style={styles.modalDetailItem}>
                <Ionicons name="refresh" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.modalDetailLabel}>Updated:</Text>
                <Text style={styles.modalDetailValue}>{formatDate(selectedUser.updated_at)}</Text>
              </View>
            </View>
          )}
        </View>
      </ModalContainer>
    );
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
    </View>
  );

  const renderStickyRoleFilter = () => (
    <Animated.View 
      style={[
        styles.stickyRoleFilter,
        { 
          transform: [{ translateY: (isStickyFilter && showContainers) ? 0 : -60 }],
          opacity: (isStickyFilter && showContainers) ? 1 : 0
        }
      ]}
    >
      <View style={styles.stickyRoleFilterContent}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              (filterRole === 'all' || filterRole === '') && styles.filterChipActive
            ]}
            onPress={() => setFilterRole('all')}
          >
            <Text style={(filterRole === 'all' || filterRole === '') ? styles.filterChipTextActive : styles.filterChipText}>All</Text>
          </TouchableOpacity>
          {['admin', 'dean', 'program_chair', 'faculty', 'staff'].map(role => (
            <TouchableOpacity
              key={role}
              style={[
                styles.filterChip,
                filterRole === role && styles.filterChipActive
              ]}
              onPress={() => setFilterRole(role)}
            >
              <Text style={filterRole === role ? styles.filterChipTextActive : styles.filterChipText}>
                {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Role:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                (filterRole === 'all' || filterRole === '') && styles.filterChipActive
              ]}
              onPress={() => setFilterRole('all')}
            >
              <Text style={(filterRole === 'all' || filterRole === '') ? styles.filterChipTextActive : styles.filterChipText}>All</Text>
            </TouchableOpacity>
            {['admin', 'dean', 'program_chair', 'faculty', 'staff'].map(role => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterChip,
                  filterRole === role && styles.filterChipActive
                ]}
                onPress={() => setFilterRole(role)}
              >
                <Text style={filterRole === role ? styles.filterChipTextActive : styles.filterChipText}>
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterApproval === '' && styles.filterChipActive
              ]}
              onPress={() => setFilterApproval('')}
            >
              <Text style={filterApproval === '' ? styles.filterChipTextActive : styles.filterChipText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterApproval === 'true' && styles.filterChipActive
              ]}
              onPress={() => setFilterApproval('true')}
            >
              <Text style={filterApproval === 'true' ? styles.filterChipTextActive : styles.filterChipText}>Approved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterApproval === 'false' && styles.filterChipActive
              ]}
              onPress={() => setFilterApproval('false')}
            >
              <Text style={filterApproval === 'false' ? styles.filterChipTextActive : styles.filterChipText}>Pending</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </View>
  );
              
  // Increased max width and centered for table view
  const renderTableView = () => (
    <View style={styles.tableViewContainer}> 
      <View style={styles.scrollIndicator}>
        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
        <Text style={styles.scrollIndicatorText}>Scroll to see more</Text>
        <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
      </View>
      <ScrollView style={styles.tableView} horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { width: 200 }]}>Name</Text>
            <Text style={[styles.tableHeaderCell, { width: 220 }]}>Email</Text>
            <Text style={[styles.tableHeaderCell, { width: 120 }]}>Role</Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>Status</Text>
          </View>
          {filteredUsers.map(user => (
            <View key={user.user_id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={1}>{user.name}</Text>
              <Text style={[styles.tableCell, { width: 220 }]} numberOfLines={1}>{user.email}</Text>
              <Text style={[styles.tableCell, { width: 120 }]}>{user.role_name ? user.role_name.toUpperCase() : 'UNKNOWN'}</Text>
              <View style={[styles.tableCell, { width: 80, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }]}> 
                <View style={[
                  styles.statusDotCircle,
                  { backgroundColor: getStatusBadgeColor(user.role_name, user.is_approved), position: 'relative', top: 0, right: 0, marginLeft: 0 }
                ]} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <UserManagementHeader
        showContainers={showContainers}
        setShowContainers={setShowContainers}
        isTableView={isTableView}
        setIsTableView={setIsTableView}
        onAddUser={handleAddUser}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSearch={handleSearch}
      />
      
      {renderStickyRoleFilter()}
      
            <Animated.ScrollView
        style={styles.userList}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
          {showContainers && (
            <>
              {renderStats()}
              {renderFilters()}
            </>
          )}
          
          {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : isTableView ? (
          renderTableView()
        ) : (
          currentUsers.map(renderUserCard)
        )}
        
        {renderUserModal()}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  stickyRoleFilter: {
    position: 'absolute',
    top: 112, // Position below the search bar without blocking
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 999,
  },
  stickyRoleFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  stickyFilterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 2,
  },

  filterRow: {
    gap: 8,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#dc2626',
  },
  filterChipText: {
    fontSize: 12,
    color: '#374151',
  },
  filterChipTextActive: {
    fontSize: 12,
    color: 'white',
  },
  userList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 2, // Minimal space between search and filters
    paddingBottom: 100, // Add padding to the content area
    backgroundColor: '#FFFFFF',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative', // Needed for absolute positioning of status dot
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#6B7280', // grey
  },
  roleText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  approvalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    // backgroundColor set dynamically
  },
  approvalText: {
    fontSize: 10,
    color: '#fff', // always white for contrast
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  iconOnlyButton: {
    backgroundColor: 'transparent',
    padding: 4,
    marginLeft: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 6,
  },
  detailValue: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '500',
  },
  approvalSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  approvalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  approvalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  paginationNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paginationNumberActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  paginationDots: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  paginationNumberText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  paginationNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Add styles for table view
  tableViewContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    width: '100%',
  },
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
    fontStyle: 'italic',
  },
  tableView: {
    flex: 1,
    paddingHorizontal: 0,
    marginHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: '#353A40',
    fontSize: 14,
    paddingHorizontal: 12,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  tableCell: {
    fontSize: 13,
    color: '#353A40',
    paddingHorizontal: 12,
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
  },
  modalUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#353A40',
    marginBottom: 2,
  },
  modalUserEmail: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  modalRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalRoleText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalApprovalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalApprovalText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  modalDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#353A40',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalApprovalButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  modalApprovalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusDot: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  statusDotLarge: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  statusDotCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  roleTextBelow: {
    marginTop: 6,
    color: '#6366F1',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },


}); 

export default UserManagement; 