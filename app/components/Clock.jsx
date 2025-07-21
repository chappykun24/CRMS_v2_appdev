import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const timerRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date());
    };

    // Set initial time
    updateTime();
    
    // Start timer
    timerRef.current = setInterval(updateTime, 1000);

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <Text style={styles.clockText}>
      {formatTime(currentTime)}
    </Text>
  );
};

const styles = StyleSheet.create({
  clockText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});

export default Clock; 