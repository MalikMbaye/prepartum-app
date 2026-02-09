import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.4, 0.8]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: Colors.border,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={skStyles.card}>
      <SkeletonBlock width="40%" height={12} />
      <SkeletonBlock width="80%" height={18} style={{ marginTop: 10 }} />
      <SkeletonBlock width="60%" height={14} style={{ marginTop: 8 }} />
    </View>
  );
}

export function StatGridSkeleton() {
  return (
    <View style={skStyles.statGrid}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={skStyles.statCard}>
          <SkeletonBlock width={40} height={40} borderRadius={12} />
          <SkeletonBlock width={30} height={20} style={{ marginTop: 10 }} />
          <SkeletonBlock width={60} height={12} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={skStyles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={skStyles.listItem}>
          <SkeletonBlock width={40} height={40} borderRadius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBlock width="70%" height={14} />
            <SkeletonBlock width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PromptSkeleton() {
  return (
    <View style={skStyles.promptCard}>
      <SkeletonBlock width={60} height={22} borderRadius={11} />
      <SkeletonBlock width="90%" height={18} style={{ marginTop: 14 }} />
      <SkeletonBlock width="70%" height={14} style={{ marginTop: 8 }} />
      <SkeletonBlock width="100%" height={48} borderRadius={14} style={{ marginTop: 16 }} />
    </View>
  );
}

export default SkeletonBlock;

const skStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  promptCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
  },
});
