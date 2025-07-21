import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import LogoutDebugger from './LogoutDebugger';

const DebugTrigger = () => {
  const [showDebugger, setShowDebugger] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setShowDebugger(true)}
      >
        <Text style={styles.debugButtonText}>🐛 Debug Logout</Text>
      </TouchableOpacity>

      <LogoutDebugger
        visible={showDebugger}
        onClose={() => setShowDebugger(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 1000,
  },
  debugButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default DebugTrigger; 