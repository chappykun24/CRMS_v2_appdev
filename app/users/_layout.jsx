import { Slot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

console.log('UsersLayout rendered');

export default function UsersLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
} 