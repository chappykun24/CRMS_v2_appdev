# Navigation Guide for CRMS Faculty Pages

## 🧪 **Testing Pages**

### 1. API Integration Test
**Path:** `/users/faculty/TestAssessmentIntegration`
**Purpose:** Test individual API endpoints
**How to Access:**
- Navigate to faculty dashboard
- Add this route to your navigation or access directly via URL

### 2. Dashboard Integration Test
**Path:** `/users/faculty/DashboardIntegrationTest`
**Purpose:** Comprehensive system testing with 8 API categories
**How to Access:**
- Navigate to faculty dashboard
- Add this route to your navigation or access directly via URL

## 📚 **Main Faculty Pages**

### 3. Assessment Management
**Path:** `/users/faculty/AssessmentManagement`
**Parameters:** `section_course_id` and `syllabus_id`
**Example:** `/users/faculty/AssessmentManagement?section_course_id=1&syllabus_id=1`

### 4. Grade Management
**Path:** `/users/faculty/GradeManagement`
**Parameters:** `section_course_id` and `syllabus_id`
**Example:** `/users/faculty/GradeManagement?section_course_id=1&syllabus_id=1`

## 🚀 **Quick Navigation Methods**

### Method 1: Direct URL Access
```javascript
// In your React Native app, you can navigate directly:
import { router } from 'expo-router';

// Navigate to test page
router.push('/users/faculty/TestAssessmentIntegration');

// Navigate to dashboard test
router.push('/users/faculty/DashboardIntegrationTest');

// Navigate to assessment management with parameters
router.push({
  pathname: '/users/faculty/AssessmentManagement',
  params: { section_course_id: 1, syllabus_id: 1 }
});

// Navigate to grade management with parameters
router.push({
  pathname: '/users/faculty/GradeManagement',
  params: { section_course_id: 1, syllabus_id: 1 }
});
```

### Method 2: Add Navigation Buttons
You can add navigation buttons to your existing pages:

```javascript
// Add this to any existing faculty page
<TouchableOpacity 
  style={styles.navButton}
  onPress={() => router.push('/users/faculty/TestAssessmentIntegration')}
>
  <Text style={styles.navButtonText}>Test API Integration</Text>
</TouchableOpacity>

<TouchableOpacity 
  style={styles.navButton}
  onPress={() => router.push('/users/faculty/DashboardIntegrationTest')}
>
  <Text style={styles.navButtonText}>Dashboard Test</Text>
</TouchableOpacity>
```

### Method 3: Add to Faculty Dashboard
Add navigation cards to your faculty dashboard:

```javascript
// In your faculty dashboard component
const navigationCards = [
  {
    title: 'Assessment Management',
    description: 'Manage course assessments and sub-tasks',
    icon: 'document-text-outline',
    onPress: () => router.push({
      pathname: '/users/faculty/AssessmentManagement',
      params: { section_course_id: 1, syllabus_id: 1 }
    })
  },
  {
    title: 'Grade Management',
    description: 'Grade students and track performance',
    icon: 'school-outline',
    onPress: () => router.push({
      pathname: '/users/faculty/GradeManagement',
      params: { section_course_id: 1, syllabus_id: 1 }
    })
  },
  {
    title: 'API Integration Test',
    description: 'Test API endpoints and connectivity',
    icon: 'bug-outline',
    onPress: () => router.push('/users/faculty/TestAssessmentIntegration')
  },
  {
    title: 'Dashboard Integration Test',
    description: 'Comprehensive system testing',
    icon: 'analytics-outline',
    onPress: () => router.push('/users/faculty/DashboardIntegrationTest')
  }
];
```

## 📱 **Navigation from MyClasses Page**

If you want to add navigation from the MyClasses page, you can modify the class cards:

```javascript
// In MyClasses.jsx, add navigation buttons to each class card
const renderClassCard = (cls) => (
  <View style={styles.classCard}>
    <Text style={styles.classTitle}>{cls.courseCode}</Text>
    <Text style={styles.classSubtitle}>{cls.courseTitle}</Text>
    
    <View style={styles.classActions}>
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => router.push({
          pathname: '/users/faculty/AssessmentManagement',
          params: { 
            section_course_id: cls.section_course_id, 
            syllabus_id: cls.syllabus_id 
          }
        })}
      >
        <Ionicons name="document-text-outline" size={16} color="#DC2626" />
        <Text style={styles.actionButtonText}>Assessments</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => router.push({
          pathname: '/users/faculty/GradeManagement',
          params: { 
            section_course_id: cls.section_course_id, 
            syllabus_id: cls.syllabus_id 
          }
        })}
      >
        <Ionicons name="school-outline" size={16} color="#DC2626" />
        <Text style={styles.actionButtonText}>Grades</Text>
      </TouchableOpacity>
    </View>
  </View>
);
```

## 🔧 **Quick Setup Instructions**

### Step 1: Add Test Navigation to Dashboard
Add these buttons to your faculty dashboard for easy access:

```javascript
// Add to your faculty dashboard
<View style={styles.testSection}>
  <Text style={styles.sectionTitle}>Testing & Development</Text>
  
  <TouchableOpacity 
    style={styles.testCard}
    onPress={() => router.push('/users/faculty/TestAssessmentIntegration')}
  >
    <Ionicons name="bug-outline" size={24} color="#DC2626" />
    <Text style={styles.testCardTitle}>API Integration Test</Text>
    <Text style={styles.testCardSubtitle}>Test individual endpoints</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.testCard}
    onPress={() => router.push('/users/faculty/DashboardIntegrationTest')}
  >
    <Ionicons name="analytics-outline" size={24} color="#DC2626" />
    <Text style={styles.testCardTitle}>Dashboard Integration Test</Text>
    <Text style={styles.testCardSubtitle}>Comprehensive system test</Text>
  </TouchableOpacity>
</View>
```

### Step 2: Add Navigation from MyClasses
Modify your MyClasses page to include navigation to the new pages:

```javascript
// In MyClasses.jsx, add navigation options
const handleClassSelect = (cls) => {
  Alert.alert(
    'Class Options',
    'What would you like to do with this class?',
    [
      {
        text: 'Manage Assessments',
        onPress: () => router.push({
          pathname: '/users/faculty/AssessmentManagement',
          params: { 
            section_course_id: cls.section_course_id, 
            syllabus_id: cls.syllabus_id 
          }
        })
      },
      {
        text: 'Manage Grades',
        onPress: () => router.push({
          pathname: '/users/faculty/GradeManagement',
          params: { 
            section_course_id: cls.section_course_id, 
            syllabus_id: cls.syllabus_id 
          }
        })
      },
      {
        text: 'Cancel',
        style: 'cancel'
      }
    ]
  );
};
```

## 🎯 **Recommended Navigation Flow**

1. **Start at Faculty Dashboard**
2. **Click "My Classes"** to see your courses
3. **Select a class** to see options
4. **Choose "Manage Assessments"** or "Manage Grades"
5. **Use test pages** to verify API functionality

## 📋 **Quick Reference**

| Page | Path | Purpose |
|------|------|---------|
| API Test | `/users/faculty/TestAssessmentIntegration` | Test individual endpoints |
| Dashboard Test | `/users/faculty/DashboardIntegrationTest` | Comprehensive testing |
| Assessment Management | `/users/faculty/AssessmentManagement` | Manage assessments |
| Grade Management | `/users/faculty/GradeManagement` | Manage grades |

## 🔍 **Troubleshooting**

If you can't navigate to a page:

1. **Check the route exists** in your app structure
2. **Verify parameters** are being passed correctly
3. **Check console for errors** in development
4. **Use the test pages** to verify API connectivity first

---

**Need Help?** Use the test pages first to verify everything is working, then navigate to the main functionality pages. 