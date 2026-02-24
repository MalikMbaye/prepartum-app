import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';

export default function IndexScreen() {
  const { profile, isLoading } = useApp();

  useEffect(() => {
    if (!isLoading) {
      if (profile) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, profile]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.textPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.canvas,
  },
});
