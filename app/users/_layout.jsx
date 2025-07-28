import { Slot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';



export default function UsersLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
} 