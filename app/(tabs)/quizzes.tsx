import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { sortScenariosByPersona } from '@/lib/persona';

const CATEGORY_COLORS: Record<string, string> = {
  mindset: Colors.accentPink,
  relationships: Colors.accentBlue,
  physical: Colors.accentPeach,
};

const CATEGORY_LABELS: Record<string, string> = {
  mindset: 'Mindset',
  relationships: 'Relationships',
  physical: 'Physical',
};

function QuizCard({ quiz, index, isCompleted, latestResult }: {
  quiz: any;
  index: number;
  isCompleted: boolean;
  latestResult: any;
}) {
  const categoryColor = CATEGORY_COLORS[quiz.category || 'mindset'] || Colors.accentPink;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (isCompleted && latestResult) {
            router.push({ pathname: '/quiz-results', params: { quizId: quiz.id, resultId: latestResult.id } });
          } else {
            router.push({ pathname: '/take-quiz', params: { quizId: quiz.id } });
          }
        }}
        style={({ pressed }) => [styles.quizCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        testID={`quiz-card-${index}`}
      >
        <View style={[styles.categoryStripe, { backgroundColor: categoryColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryBadgeText}>
                {CATEGORY_LABELS[quiz.category || 'mindset'] || quiz.category}
              </Text>
            </View>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>

          <Text style={styles.quizTitle}>{quiz.title}</Text>
          <Text style={styles.quizDescription} numberOfLines={2}>{quiz.description}</Text>

          <View style={styles.quizMeta}>
            <View style={styles.metaItem}>
              <Feather name="help-circle" size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{quiz.questionCount || '?'} questions</Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} color={Colors.textLight} />
              <Text style={styles.metaText}>{quiz.estimatedMinutes || '?'} min</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.ctaText}>
              {isCompleted ? 'View Results' : 'Start Quiz'}
            </Text>
            <Feather name="arrow-right" size={16} color={Colors.textPrimary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ScenarioCard({ scenario, index, sessionCount }: {
  scenario: any;
  index: number;
  sessionCount: number;
}) {
  const categoryColor = CATEGORY_COLORS[scenario.category || 'mindset'] || Colors.accentPink;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/scenario-intro', params: { scenarioId: scenario.id } });
        }}
        style={({ pressed }) => [styles.scenarioCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
        testID={`scenario-card-${index}`}
      >
        <View style={[styles.scenarioAccent, { backgroundColor: categoryColor }]} />
        <View style={styles.scenarioContent}>
          <View style={styles.scenarioTopRow}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
              <Text style={styles.categoryBadgeText}>
                {CATEGORY_LABELS[scenario.category || 'mindset'] || scenario.category}
              </Text>
            </View>
            {sessionCount > 0 && (
              <View style={styles.practicedBadge}>
                <Ionicons name="chatbubble-ellipses" size={14} color={Colors.textSecondary} />
                <Text style={styles.practicedText}>{sessionCount}x practiced</Text>
              </View>
            )}
          </View>

          <Text style={styles.scenarioTitle}>{scenario.title}</Text>

          <View style={styles.roleRow}>
            <Ionicons name="person-circle-outline" size={16} color={Colors.textLight} />
            <Text style={styles.roleText}>Practice with: {scenario.role}</Text>
          </View>

          <Text style={styles.scenarioDescription} numberOfLines={2}>{scenario.description}</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.ctaText}>
              {sessionCount > 0 ? 'Practice Again' : 'Start Practice'}
            </Text>
            <Ionicons name="chatbubbles-outline" size={16} color={Colors.textPrimary} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { quizzes, quizResults, scenarios, roleplaySessions, refreshData, refreshing, profile } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const [activeTab, setActiveTab] = useState<'roleplay' | 'quizzes'>('roleplay');

  const persona = (profile?.profileFlags?.persona as string) || 'supported_nurturer';
  const sortedScenarios = useMemo(() => sortScenariosByPersona(scenarios, persona), [scenarios, persona]);

  function getLatestResult(quizId: string) {
    return quizResults.find(r => r.quizId === quizId);
  }

  function getSessionCount(scenarioId: string) {
    return roleplaySessions.filter(s => s.scenarioId === scenarioId).length;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Practice & self-discovery tools</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          onPress={() => { setActiveTab('roleplay'); Haptics.selectionAsync(); }}
          style={[styles.tab, activeTab === 'roleplay' && styles.tabActive]}
        >
          <Ionicons name="chatbubbles-outline" size={16} color={activeTab === 'roleplay' ? Colors.textPrimary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'roleplay' && styles.tabTextActive]}>Practice</Text>
        </Pressable>
        <Pressable
          onPress={() => { setActiveTab('quizzes'); Haptics.selectionAsync(); }}
          style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}
        >
          <Feather name="compass" size={16} color={activeTab === 'quizzes' ? Colors.textPrimary : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.tabTextActive]}>Quizzes</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            tintColor={Colors.textSecondary}
          />
        }
      >
        {activeTab === 'roleplay' ? (
          <>
            {sortedScenarios.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>No practice scenarios yet</Text>
                <Text style={styles.emptyBody}>Check back soon for conversation practice</Text>
              </View>
            ) : (
              sortedScenarios.map((scenario, index) => (
                <ScenarioCard
                  key={scenario.id}
                  scenario={scenario}
                  index={index}
                  sessionCount={getSessionCount(scenario.id)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {quizzes.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="compass" size={48} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>No quizzes available yet</Text>
                <Text style={styles.emptyBody}>Check back soon for self-discovery assessments</Text>
              </View>
            ) : (
              quizzes.map((quiz, index) => {
                const latestResult = getLatestResult(quiz.id);
                return (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    index={index}
                    isCompleted={!!latestResult}
                    latestResult={latestResult}
                  />
                );
              })
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: Colors.canvas,
  },
  tabText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textLight,
  },
  tabTextActive: {
    fontFamily: 'Lato_700Bold',
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  quizCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryStripe: {
    width: 5,
  },
  cardContent: {
    flex: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.success,
  },
  quizTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 6,
    lineHeight: 26,
  },
  quizDescription: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  quizMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
  },
  scenarioCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scenarioAccent: {
    width: 5,
  },
  scenarioContent: {
    flex: 1,
    padding: 20,
  },
  scenarioTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  practicedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  practicedText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  scenarioTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 19,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 25,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  roleText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  scenarioDescription: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  ctaText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
