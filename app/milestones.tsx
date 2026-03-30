import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getApiUrl } from '@/lib/query-client';

type Milestone = {
  id: string;
  title: string;
  weekNumber: number;
  trimester: number;
  description: string | null;
  icon: string | null;
  orderIndex: number | null;
  isCompleted: boolean;
};

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

function getPregnancyWeek(dueDateStr: string | null | undefined): number {
  if (!dueDateStr) return 0;
  const today = new Date();
  const dueDate = new Date(dueDateStr);
  const conceptionDate = new Date(dueDate.getTime() - 280 * 24 * 60 * 60 * 1000);
  const diffMs = today.getTime() - conceptionDate.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, Math.min(42, diffWeeks));
}

const TRIMESTER_LABELS: Record<number, string> = {
  1: 'First Trimester',
  2: 'Second Trimester',
  3: 'Third Trimester',
};

const TRIMESTER_SUBTITLES: Record<number, string> = {
  1: 'Weeks 1–13',
  2: 'Weeks 14–27',
  3: 'Weeks 28–40',
};

const TRIMESTER_COLORS: Record<number, string> = {
  1: Colors.accentPink,
  2: Colors.accentBlue,
  3: Colors.accentPeach,
};

export default function MilestonesScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { profile } = useApp();
  const queryClient = useQueryClient();

  const userId = profile?.id;
  const pregnancyWeek = getPregnancyWeek(profile?.dueDate);

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ['/api/milestones', userId],
    queryFn: async () => {
      const url = new URL('/api/milestones', getApiUrl());
      if (userId) url.searchParams.set('userId', userId);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch milestones');
      return res.json();
    },
    enabled: true,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const url = new URL(`/api/milestones/${id}/complete`, getApiUrl());
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isCompleted }),
      });
      if (!res.ok) throw new Error('Failed to update milestone');
      return res.json();
    },
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/milestones', userId] });
      const previous = queryClient.getQueryData<Milestone[]>(['/api/milestones', userId]);
      queryClient.setQueryData<Milestone[]>(['/api/milestones', userId], old =>
        old ? old.map(m => m.id === id ? { ...m, isCompleted } : m) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['/api/milestones', userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestones', userId] });
    },
  });

  const handleToggle = useCallback((milestone: Milestone) => {
    if (!userId) return;
    tryHaptic();
    toggleMutation.mutate({ id: milestone.id, isCompleted: !milestone.isCompleted });
  }, [userId, toggleMutation]);

  const grouped: Record<number, Milestone[]> = { 1: [], 2: [], 3: [] };
  milestones.forEach(m => {
    if (grouped[m.trimester]) grouped[m.trimester].push(m);
  });

  const completedCount = milestones.filter(m => m.isCompleted).length;

  const nextMilestone = milestones.find(m =>
    !m.isCompleted && m.weekNumber >= pregnancyWeek
  );

  const renderMilestone = (milestone: Milestone, index: number) => {
    const isPast = milestone.weekNumber < pregnancyWeek && !milestone.isCompleted;
    const isComingUp = nextMilestone?.id === milestone.id;

    return (
      <Animated.View
        key={milestone.id}
        entering={FadeInDown.delay(index * 40).duration(400)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.card,
            milestone.isCompleted && styles.cardCompleted,
            isPast && styles.cardPast,
            isComingUp && styles.cardComingUp,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
          onPress={() => handleToggle(milestone)}
          testID={`milestone-${milestone.id}`}
        >
          {isComingUp && (
            <View style={styles.comingUpBadge}>
              <Text style={styles.comingUpText}>Coming Up</Text>
            </View>
          )}

          <View style={styles.cardRow}>
            <Text style={[styles.icon, (isPast || milestone.isCompleted) && styles.iconMuted]}>
              {milestone.icon ?? '✨'}
            </Text>
            <View style={styles.cardContent}>
              <View style={styles.titleRow}>
                <Text style={[
                  styles.title,
                  milestone.isCompleted && styles.titleCompleted,
                  isPast && styles.titlePast,
                ]}>
                  {milestone.title}
                </Text>
                <Text style={[styles.week, isPast && styles.weekPast]}>
                  Week {milestone.weekNumber}
                </Text>
              </View>
              {milestone.description && (
                <Text style={[
                  styles.description,
                  milestone.isCompleted && styles.descriptionMuted,
                  isPast && styles.descriptionMuted,
                ]}>
                  {milestone.description}
                </Text>
              )}
            </View>
            <View style={[
              styles.checkbox,
              milestone.isCompleted && styles.checkboxChecked,
            ]}>
              {milestone.isCompleted && (
                <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  let cardIndex = 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} testID="back-button">
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Milestones</Text>
          <Text style={styles.headerSub}>
            {completedCount} of {milestones.length} reached
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.textSecondary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {pregnancyWeek > 0 && (
            <Animated.View entering={FadeInDown.delay(0).duration(400)}>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${Math.round((completedCount / Math.max(milestones.length, 1)) * 100)}%` as any },
                ]} />
              </View>
              <Text style={styles.progressLabel}>
                Week {pregnancyWeek} · {Math.round((completedCount / Math.max(milestones.length, 1)) * 100)}% complete
              </Text>
            </Animated.View>
          )}

          {[1, 2, 3].map(trimester => {
            const items = grouped[trimester];
            if (!items.length) return null;
            return (
              <View key={trimester} style={styles.trimesterSection}>
                <View style={[styles.trimesterHeader, { borderLeftColor: TRIMESTER_COLORS[trimester] }]}>
                  <Text style={styles.trimesterTitle}>{TRIMESTER_LABELS[trimester]}</Text>
                  <Text style={styles.trimesterSub}>{TRIMESTER_SUBTITLES[trimester]}</Text>
                </View>
                {items.map(m => renderMilestone(m, cardIndex++))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(93,80,102,0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(93,80,102,0.1)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentPink,
    borderRadius: 3,
  },
  progressLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  trimesterSection: {
    marginBottom: 32,
  },
  trimesterHeader: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 16,
  },
  trimesterTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  trimesterSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompleted: {
    backgroundColor: '#FAFAFA',
  },
  cardPast: {
    opacity: 0.55,
  },
  cardComingUp: {
    borderWidth: 1.5,
    borderColor: Colors.accentPink,
    backgroundColor: '#FFFBFB',
  },
  comingUpBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentPink,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  comingUpText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  icon: {
    fontSize: 26,
    lineHeight: 32,
    marginTop: 2,
  },
  iconMuted: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  titleCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  titlePast: {
    color: Colors.textSecondary,
  },
  week: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  weekPast: {
    color: Colors.textLight,
  },
  description: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  descriptionMuted: {
    color: Colors.textLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(93,80,102,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Colors.accentPink,
    borderColor: Colors.accentPink,
  },
});
