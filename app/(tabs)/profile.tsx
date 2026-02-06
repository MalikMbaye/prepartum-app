import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryLabel, getCategoryColor } from '@/lib/prompts-data';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, promptResponses, memories, tasks, journalEntries, getPregnancyWeek } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const pregnancyWeek = getPregnancyWeek();
  const completedTasks = tasks.filter(t => t.completed).length;

  function formatDueDate(dateStr: string) {
    if (!dateStr) return 'Not set';
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[0], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return `${months[monthIdx]} ${parts[1]}, ${parts[2]}`;
      }
    }
    return dateStr;
  }

  async function handleReset() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const doReset = async () => {
      await AsyncStorage.clear();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      doReset();
    } else {
      Alert.alert(
        'Reset App',
        'This will erase all your data and start fresh. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  }

  const stats = [
    { label: 'Prompts Answered', value: promptResponses.length, icon: 'bulb-outline' as const, color: Colors.accentPink },
    { label: 'Memories Saved', value: memories.length, icon: 'heart-outline' as const, color: Colors.accentPeach },
    { label: 'Tasks Completed', value: completedTasks, icon: 'checkbox-outline' as const, color: Colors.accentBlue },
    { label: 'Journal Entries', value: journalEntries.length, icon: 'book-outline' as const, color: '#E8E0EC' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="flower-outline" size={32} color={Colors.textPrimary} />
        </View>
        <Text style={styles.name}>{profile?.name || 'Mama'}</Text>
        {pregnancyWeek > 0 && (
          <Text style={styles.weekText}>Week {pregnancyWeek}</Text>
        )}
        {profile?.dueDate && (
          <Text style={styles.dueText}>Due {formatDueDate(profile.dueDate)}</Text>
        )}
      </Animated.View>

      {profile?.focusAreas && profile.focusAreas.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.focusSection}>
          <Text style={styles.sectionLabel}>Your Focus Areas</Text>
          <View style={styles.focusRow}>
            {profile.focusAreas.map(area => (
              <View key={area} style={[styles.focusBadge, { backgroundColor: getCategoryColor(area) }]}>
                <Text style={styles.focusBadgeText}>{getCategoryLabel(area)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={styles.sectionLabel}>Your Journey</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={20} color={Colors.textPrimary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.actionsSection}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/journal'); }}
          style={({ pressed }) => [styles.actionRow, pressed && { opacity: 0.8 }]}
        >
          <Feather name="book-open" size={20} color={Colors.textPrimary} />
          <Text style={styles.actionText}>View Journal</Text>
          <Feather name="chevron-right" size={18} color={Colors.textLight} />
        </Pressable>

        <Pressable
          onPress={handleReset}
          style={({ pressed }) => [styles.actionRow, styles.actionRowDanger, pressed && { opacity: 0.8 }]}
        >
          <Feather name="refresh-cw" size={20} color={Colors.error} />
          <Text style={[styles.actionText, { color: Colors.error }]}>Reset App Data</Text>
          <Feather name="chevron-right" size={18} color={Colors.error} />
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  weekText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  dueText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textLight,
  },
  focusSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  focusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  focusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  focusBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  statsGrid: {
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
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionsSection: {
    gap: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 8,
    gap: 14,
  },
  actionRowDanger: {},
  actionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
});
