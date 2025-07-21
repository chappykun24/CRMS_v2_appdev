# Modal Pattern Guide

This guide explains how to use the reusable modal pattern for showing detailed information when clicking on containers instead of using dropdowns.

## Overview

The modal pattern consists of three main components:
1. **ModalContainer** - Reusable modal wrapper
2. **ClickableContainer** - Reusable clickable wrapper with press effects
3. **useModal** - Custom hook for modal state management

## Components

### 1. ModalContainer (`components/ModalContainer.jsx`)

A reusable modal component with consistent styling and behavior.

**Props:**
- `visible` - Boolean to control modal visibility
- `onClose` - Function called when modal should close
- `title` - Modal header title
- `children` - Modal content
- `showCloseButton` - Show/hide close button (default: true)
- `closeOnOverlayPress` - Close when tapping overlay (default: true)
- `animationType` - Modal animation type (default: 'slide')
- `footer` - Optional footer content
- `maxHeight` - Maximum height of modal (default: 80% of screen)

**Usage:**
```jsx
import ModalContainer from '../../../components/ModalContainer';

<ModalContainer
  visible={modalVisible}
  onClose={closeModal}
  title="Item Details"
  footer={<ActionButtons />}
>
  <View>
    <Text>Modal content goes here</Text>
  </View>
</ModalContainer>
```

### 2. ClickableContainer (`components/ClickableContainer.jsx`)

A reusable clickable wrapper with press effects and animations.

**Props:**
- `onPress` - Function called when pressed
- `children` - Content to wrap
- `activeOpacity` - Opacity when pressed (default: 0.9)
- `disabled` - Disable interactions (default: false)
- `showPressEffect` - Show scale animation (default: true)
- `pressScale` - Scale factor when pressed (default: 0.98)

**Usage:**
```jsx
import ClickableContainer from '../../../components/ClickableContainer';

<ClickableContainer
  onPress={() => openModal(item)}
  style={styles.card}
>
  <View>
    <Text>Clickable content</Text>
  </View>
</ClickableContainer>
```

### 3. useModal Hook (`utils/useModal.js`)

Custom hook for managing modal state.

**Returns:**
- `visible` - Modal visibility state
- `selectedItem` - Currently selected item
- `openModal(item)` - Open modal with item
- `closeModal()` - Close modal and clear selection
- `toggleModal()` - Toggle modal visibility
- `setSelectedItem(item)` - Set selected item without opening modal

**Usage:**
```jsx
import { useModal } from '../../../utils/useModal';

const { visible, selectedItem, openModal, closeModal } = useModal();

const handleItemPress = (item) => {
  openModal(item);
};
```

## Implementation Pattern

### Step 1: Import Components and Hook

```jsx
import { useModal } from '../../../utils/useModal';
import ClickableContainer from '../../../components/ClickableContainer';
import ModalContainer from '../../../components/ModalContainer';
```

### Step 2: Set Up Modal State

```jsx
const { visible, selectedItem, openModal, closeModal } = useModal();
```

### Step 3: Create Clickable Items

```jsx
const renderItem = (item) => (
  <ClickableContainer
    key={item.id}
    style={styles.itemCard}
    onPress={() => openModal(item)}
  >
    <View style={styles.itemContent}>
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
    </View>
  </ClickableContainer>
);
```

### Step 4: Create Modal Content

```jsx
const renderModal = () => {
  if (!selectedItem) return null;

  const modalFooter = (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={handleAction}
    >
      <Text style={styles.buttonText}>Action</Text>
    </TouchableOpacity>
  );

  return (
    <ModalContainer
      visible={visible}
      onClose={closeModal}
      title="Item Details"
      footer={modalFooter}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{selectedItem.title}</Text>
        <Text style={styles.modalDescription}>{selectedItem.description}</Text>
        {/* Add more details as needed */}
      </View>
    </ModalContainer>
  );
};
```

### Step 5: Render Everything

```jsx
return (
  <View style={styles.container}>
    <ScrollView>
      {items.map(renderItem)}
    </ScrollView>
    {renderModal()}
  </View>
);
```

## Advanced Usage

### Multiple Modals

Use `useMultipleModals` for pages with multiple modals:

```jsx
import { useMultipleModals } from '../../../utils/useModal';

const { openModal, closeModal, getModalState } = useMultipleModals([
  'details',
  'edit',
  'delete'
]);

const detailsState = getModalState('details');
const editState = getModalState('edit');

// Open specific modal
openModal('details', item);
openModal('edit', item);
```

### Custom Modal Styling

```jsx
<ModalContainer
  visible={visible}
  onClose={closeModal}
  title="Custom Modal"
  modalStyle={{ width: '95%' }}
  headerStyle={{ backgroundColor: '#f0f0f0' }}
  bodyStyle={{ padding: 20 }}
  maxHeight={400}
>
  {/* Content */}
</ModalContainer>
```

### Custom Clickable Effects

```jsx
<ClickableContainer
  onPress={handlePress}
  showPressEffect={true}
  pressScale={0.95}
  activeOpacity={0.8}
  style={styles.customCard}
>
  {/* Content */}
</ClickableContainer>
```

## Best Practices

1. **Consistent Naming**: Use descriptive names for modal state variables
2. **Error Handling**: Always check if selectedItem exists before rendering modal
3. **Performance**: Use React.memo for modal content if it's complex
4. **Accessibility**: Ensure modals can be closed with back button
5. **Loading States**: Show loading indicators in modals when fetching data

## Example Implementation

See `app/users/admin/user-management.jsx` for a complete implementation example.

## Migration from Dropdowns

To migrate from dropdown patterns:

1. Replace dropdown triggers with `ClickableContainer`
2. Replace dropdown content with `ModalContainer`
3. Use `useModal` hook for state management
4. Update any related styling and interactions

This pattern provides a more modern, mobile-friendly user experience compared to traditional dropdowns. 