import { useCallback, useState } from 'react';

/**
 * Custom hook for managing modal state
 * @param {boolean} initialVisible - Initial visibility state
 * @returns {Object} Modal state and handlers
 */
export const useModal = (initialVisible = false) => {
  const [visible, setVisible] = useState(initialVisible);
  const [selectedItem, setSelectedItem] = useState(null);

  const openModal = useCallback((item = null) => {
    setSelectedItem(item);
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    setSelectedItem(null);
  }, []);

  const toggleModal = useCallback(() => {
    setVisible(prev => !prev);
  }, []);

  return {
    visible,
    selectedItem,
    openModal,
    closeModal,
    toggleModal,
    setSelectedItem
  };
};

/**
 * Custom hook for managing multiple modals
 * @param {Array} modalNames - Array of modal names
 * @returns {Object} Multiple modal states and handlers
 */
export const useMultipleModals = (modalNames = []) => {
  const [modalStates, setModalStates] = useState(
    modalNames.reduce((acc, name) => {
      acc[name] = { visible: false, selectedItem: null };
      return acc;
    }, {})
  );

  const openModal = useCallback((modalName, item = null) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: { visible: true, selectedItem: item }
    }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModalStates(prev => ({
      ...prev,
      [modalName]: { visible: false, selectedItem: null }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModalStates(prev => {
      const newStates = {};
      Object.keys(prev).forEach(name => {
        newStates[name] = { visible: false, selectedItem: null };
      });
      return newStates;
    });
  }, []);

  const getModalState = useCallback((modalName) => {
    return modalStates[modalName] || { visible: false, selectedItem: null };
  }, [modalStates]);

  return {
    modalStates,
    openModal,
    closeModal,
    closeAllModals,
    getModalState
  };
}; 