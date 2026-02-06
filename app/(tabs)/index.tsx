import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getTodayPrompt, getCategoryColor, getCategoryLabel, getTodayPromptFromDb } from '@/lib/prompts-data';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, promptResponses, getWeeklyProgress, getPregnancyWeek, tasks, journalEntries, memories, prompts } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const weeklyProgress = getWeeklyProgress();
  const pregnancyWeek = getPregnancyWeek();
  const completedPromptIds = promptResponses.map(r => r.promptId);
  const todayPrompt = prompts.length > 0
    ? getTodayPromptFromDb(prompts, completedPromptIds, profile?.focusAreas || ['mindset', 'relationships', 'physical'])
    : getTodayPrompt(completedPromptIds, profile?.focusAreas || ['mindset', 'relationships', 'physical']);
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  const greeting = getGreeting(profile?.name || 'Mama');

  function getGreeting(name: string) {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.greeting}>{greeting}</Text>
        {pregnancyWeek > 0 && (
          <Text style={styles.weekLabel}>Week {pregnancyWeek} of your journey</Text>
        )}
      </Animated.View>

      {todayPrompt && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/prompt-response', params: { promptId: todayPrompt.id, promptText: (todayPrompt as any).body || (todayPrompt as any).text, category: todayPrompt.category } });
            }}
            style={({ pressed }) => [styles.promptCard, { borderLeftColor: getCategoryColor(todayPrompt.category) }, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
          >
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(todayPrompt.category) }]}>
              <Text style={styles.categoryBadgeText}>{getCategoryLabel(todayPrompt.category)}</Text>
            </View>
            <Text style={styles.promptTitle}>Today's Reflection</Text>
            <Text style={styles.promptText} numberOfLines={3}>{(todayPrompt as any).body || (todayPrompt as any).text}</Text>
            <View style={styles.promptAction}>
              <Text style={styles.promptActionText}>Reflect on this</Text>
              <Feather name="arrow-right" size={16} color={Colors.textPrimary} />
            </View>
          </Pressable>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.progressSection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRingContainer}>
            <View style={styles.progressRingOuter}>
              <View style={[styles.progressRingFill, { transform: [{ rotate: `${weeklyProgress * 360}deg` }] }]} />
              <View style={styles.progressRingInner}>
                <Text style={styles.progressPercent}>{Math.round(weeklyProgress * 100)}%</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressLabel}>{promptResponses.filter(r => {
              const weekStart = new Date();
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              weekStart.setHours(0, 0, 0, 0);
              return new Date(r.completedAt || '') >= weekStart;
            }).length} prompts completed</Text>
            <Text style={styles.progressSub}>Keep showing up for yourself</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.quickAccess}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/memories'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.accentPink }]}>
              <Ionicons name="heart-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>Memory Bank</Text>
            <Text style={styles.quickCount}>{memories.length} saved</Text>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/tasks'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.accentBlue }]}>
              <Ionicons name="checkbox-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>Task Board</Text>
            <Text style={styles.quickCount}>{completedTasks}/{totalTasks} done</Text>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/journal'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: Colors.accentPeach }]}>
              <Feather name="book-open" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>Journal</Text>
            <Text style={styles.quickCount}>{journalEntries.length} entries</Text>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/prompts'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#E8E0EC' }]}>
              <Ionicons name="bulb-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickTitle}>All Prompts</Text>
            <Text style={styles.quickCount}>{promptResponses.length} answered</Text>
          </Pressable>
        </View>
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
  greeting: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  weekLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  promptCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
    borderLeftWidth: 4,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  promptTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  promptText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
    marginBottom: 16,
  },
  promptAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  promptActionText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  progressRingContainer: {
    marginRight: 18,
  },
  progressRingOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingFill: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentPink,
    opacity: 0.5,
  },
  progressRingInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  progressStats: {
    flex: 1,
  },
  progressLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  progressSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quickAccess: {
    marginBottom: 24,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '47%' as any,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  quickCount: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
