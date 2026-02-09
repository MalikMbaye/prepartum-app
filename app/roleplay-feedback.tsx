import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const CATEGORY_COLORS: Record<string, string> = {
  mindset: Colors.accentPink,
  relationships: Colors.accentBlue,
  physical: Colors.accentPeach,
};

function ScoreStars({ score, color }: { score: number; color: string }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= score ? 'star' : 'star-outline'}
          size={20}
          color={i <= score ? color : Colors.textLight}
        />
      ))}
    </View>
  );
}

export default function RoleplayFeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { roleplaySessions } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const session = roleplaySessions.find(s => s.id === sessionId);
  const scenario = session?.scenario;
  const feedback = session?.feedback as any;
  const categoryColor = CATEGORY_COLORS[scenario?.category || 'mindset'] || Colors.accentPink;

  if (!session || !scenario || !feedback) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Feedback not available</Text>
        </View>
      </View>
    );
  }

  const strengths = (feedback.strengths || []) as string[];
  const improvements = (feedback.improvements || []) as string[];
  const practicePointScores = (feedback.practicePointScores || []) as { point: string; score: number; note: string }[];

  function handleDone() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.dismissAll();
  }

  function handleTryAgain() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({ pathname: '/scenario-intro', params: { scenarioId: scenario!.id } });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.closeRow}>
        <Pressable onPress={handleDone} hitSlop={12}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.heroSection}>
          <View style={[styles.scoreCircle, { backgroundColor: categoryColor }]}>
            <Text style={styles.scoreNumber}>{feedback.overallScore || 0}</Text>
            <Text style={styles.scoreLabel}>/ 5</Text>
          </View>
          <Text style={styles.heroTitle}>Practice Complete</Text>
          <Text style={styles.heroSubtitle}>{scenario.title}</Text>
          <ScoreStars score={feedback.overallScore || 0} color={categoryColor} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.summaryCard}>
          <Text style={styles.summaryText}>{feedback.summary}</Text>
        </Animated.View>

        {strengths.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: Colors.success }]}>
                <Feather name="thumbs-up" size={14} color={Colors.white} />
              </View>
              <Text style={styles.sectionTitle}>What You Did Well</Text>
            </View>
            {strengths.map((strength, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                <Text style={styles.listItemText}>{strength}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {improvements.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: Colors.accentPeach }]}>
                <Feather name="trending-up" size={14} color={Colors.textPrimary} />
              </View>
              <Text style={styles.sectionTitle}>Areas to Grow</Text>
            </View>
            {improvements.map((improvement, index) => (
              <View key={index} style={styles.listItem}>
                <Feather name="arrow-up-right" size={18} color={Colors.textSecondary} />
                <Text style={styles.listItemText}>{improvement}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {practicePointScores.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: categoryColor }]}>
                <Feather name="target" size={14} color={Colors.textPrimary} />
              </View>
              <Text style={styles.sectionTitle}>Practice Points</Text>
            </View>
            {practicePointScores.map((pp, index) => (
              <View key={index} style={styles.practicePointCard}>
                <View style={styles.ppHeader}>
                  <Text style={styles.ppTitle} numberOfLines={2}>{pp.point}</Text>
                  <ScoreStars score={pp.score} color={categoryColor} />
                </View>
                {pp.note && <Text style={styles.ppNote}>{pp.note}</Text>}
              </View>
            ))}
          </Animated.View>
        )}

        {feedback.encouragement && (
          <Animated.View entering={FadeInDown.delay(500).duration(500)} style={[styles.encouragementCard, { backgroundColor: categoryColor }]}>
            <Ionicons name="heart" size={20} color={Colors.textPrimary} />
            <Text style={styles.encouragementText}>{feedback.encouragement}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.actionButtons}>
          <Pressable
            onPress={handleTryAgain}
            style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.8 }]}
          >
            <Feather name="refresh-cw" size={18} color={Colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Practice Again</Text>
          </Pressable>
          <Pressable
            onPress={handleDone}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: categoryColor }, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  scoreNumber: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: Colors.textPrimary,
  },
  scoreLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  summaryText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 23,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  listItemText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
    flex: 1,
  },
  practicePointCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 6,
  },
  ppTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  ppNote: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  encouragementText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    flex: 1,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  secondaryButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
