import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getTodayPrompt, getCategoryColor, getCategoryLabel, getTodayPromptFromDb } from '@/lib/prompts-data';

function ProgressRing({ progress, size, strokeWidth, color }: { progress: number; size: number; strokeWidth: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const segmentCount = 7;
  const gapAngle = 6;
  const totalGap = segmentCount * gapAngle;
  const totalArc = 360 - totalGap;
  const segmentArc = totalArc / segmentCount;
  const filledSegments = Math.round(progress * segmentCount);

  const segments = [];
  for (let i = 0; i < segmentCount; i++) {
    const startAngle = i * (segmentArc + gapAngle) - 90;
    const isFilled = i < filledSegments;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + segmentArc) * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    segments.push(
      <View
        key={i}
        style={{
          position: 'absolute',
          width: size,
          height: size,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: Math.min(x1, x2) - strokeWidth / 2,
            top: Math.min(y1, y2) - strokeWidth / 2,
            width: Math.abs(x2 - x1) + strokeWidth,
            height: Math.abs(y2 - y1) + strokeWidth,
          }}
        />
      </View>
    );
  }

  const trackSegments = Array.from({ length: segmentCount }, (_, i) => {
    const startAngle = i * (segmentArc + gapAngle) - 90;
    return { startAngle, isFilled: i < filledSegments };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {trackSegments.map((seg, i) => {
        const midAngle = seg.startAngle + segmentArc / 2;
        const midRad = (midAngle * Math.PI) / 180;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: strokeWidth + 14,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: seg.isFilled ? color : Colors.border,
              transform: [
                { translateX: radius * Math.cos(midRad) },
                { translateY: radius * Math.sin(midRad) },
                { rotate: `${midAngle + 90}deg` },
              ],
            }}
          />
        );
      })}
      <View style={{
        width: size - strokeWidth * 2 - 16,
        height: size - strokeWidth * 2 - 16,
        borderRadius: (size - strokeWidth * 2 - 16) / 2,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 18,
          color: Colors.textPrimary,
        }}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, promptResponses, getWeeklyProgress, getPregnancyWeek, getWeeklyCompletedCount,
    tasks, journalEntries, memories, prompts, refreshing, refreshData
  } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const weeklyProgress = getWeeklyProgress();
  const weeklyCount = getWeeklyCompletedCount();
  const pregnancyWeek = getPregnancyWeek();
  const completedPromptIds = promptResponses.map(r => r.promptId);
  const todayPrompt = useMemo(() => {
    if (prompts.length > 0) {
      return getTodayPromptFromDb(prompts, completedPromptIds, profile?.focusAreas || ['mindset', 'relationships', 'physical']);
    }
    return getTodayPrompt(completedPromptIds, profile?.focusAreas || ['mindset', 'relationships', 'physical']);
  }, [prompts, completedPromptIds, profile?.focusAreas]);

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  const greeting = useMemo(() => {
    const name = profile?.name || 'Mama';
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [profile?.name]);

  const promptCategoryLabel = todayPrompt
    ? `Today's ${getCategoryLabel(todayPrompt.category)} Prompt`
    : "Today's Prompt";

  const promptPreview = todayPrompt
    ? ((todayPrompt as any).body || (todayPrompt as any).text || '').slice(0, 100) + (((todayPrompt as any).body || (todayPrompt as any).text || '').length > 100 ? '...' : '')
    : '';

  const categoryColor = todayPrompt ? getCategoryColor(todayPrompt.category) : Colors.accentPink;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 20, paddingBottom: 110 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshData}
          tintColor={Colors.textSecondary}
          colors={[Colors.accentPink]}
        />
      }
    >
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View>
          <Text style={styles.greeting} testID="home-greeting">{greeting}</Text>
          {pregnancyWeek > 0 && (
            <Text style={styles.weekLabel}>Week {pregnancyWeek} of your pregnancy journey</Text>
          )}
          {pregnancyWeek === 0 && (
            <Text style={styles.weekLabel}>Your pregnancy journey</Text>
          )}
        </View>
      </Animated.View>

      {!profile?.intakeCompleted && (
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Pressable
            onPress={() => router.push('/intake')}
            style={styles.intakeBanner}
            testID="resume-intake"
          >
            <View style={styles.intakeBannerIcon}>
              <Ionicons name="sparkles" size={18} color="#4A2F4B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.intakeBannerTitle}>Personalise your experience</Text>
              <Text style={styles.intakeBannerSubtitle}>Complete a quick questionnaire to get tailored content</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </Pressable>
        </Animated.View>
      )}

      {todayPrompt && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: '/prompt-response',
                params: {
                  promptId: todayPrompt.id,
                  promptText: (todayPrompt as any).body || (todayPrompt as any).text,
                  category: todayPrompt.category
                }
              });
            }}
            style={({ pressed }) => [
              styles.promptCard,
              pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] }
            ]}
            testID="today-prompt-card"
          >
            <View style={styles.promptHeader}>
              <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
              <Text style={styles.categoryLabel}>{promptCategoryLabel}</Text>
            </View>

            <Text style={styles.promptPreview} numberOfLines={3}>{promptPreview}</Text>

            <View style={[styles.startButton, { backgroundColor: categoryColor }]}>
              <Text style={styles.startButtonText}>Start</Text>
              <Feather name="arrow-right" size={16} color={Colors.textPrimary} />
            </View>
          </Pressable>
        </Animated.View>
      )}

      {!todayPrompt && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.allDoneCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color={Colors.success} />
          <Text style={styles.allDoneTitle}>All caught up!</Text>
          <Text style={styles.allDoneBody}>You've reflected on all available prompts. New ones will appear soon.</Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.progressCard}>
          <ProgressRing
            progress={weeklyProgress}
            size={80}
            strokeWidth={6}
            color={categoryColor}
          />
          <View style={styles.progressInfo}>
            <Text style={styles.progressCount}>
              {weeklyCount} of 7
            </Text>
            <Text style={styles.progressLabel}>prompts completed this week</Text>
            <Text style={styles.progressEncouragement}>
              {weeklyCount === 0 ? 'Start your week with a reflection' :
               weeklyCount < 4 ? 'Keep showing up for yourself' :
               weeklyCount < 7 ? 'You\'re doing wonderfully' :
               'A perfect week!'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.quickSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/memories'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            testID="quick-memories"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentPink }]}>
              <Ionicons name="heart-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickLabel}>Memories</Text>
            <Text style={styles.quickMeta}>{memories.length}</Text>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/tasks'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            testID="quick-tasks"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentBlue }]}>
              <Ionicons name="checkbox-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickLabel}>Tasks</Text>
            <Text style={styles.quickMeta}>{completedTasks}/{totalTasks}</Text>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/journal'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            testID="quick-journal"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentPeach }]}>
              <Feather name="book-open" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickLabel}>Journal</Text>
            <Text style={styles.quickMeta}>{journalEntries.length}</Text>
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
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  weekLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  promptCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 24,
    marginBottom: 28,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  promptPreview: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 19,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 22,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  startButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },

  allDoneCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 28,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  allDoneTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  allDoneBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  progressSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressCount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  progressLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressEncouragement: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },

  quickSection: {
    marginBottom: 24,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 8,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  quickMeta: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  intakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  intakeBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5D6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intakeBannerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: '#4A2F4B',
    marginBottom: 2,
  },
  intakeBannerSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
