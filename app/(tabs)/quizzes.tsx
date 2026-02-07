import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

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

export default function QuizzesScreen() {
  const insets = useSafeAreaInsets();
  const { quizzes, quizResults, refreshData, refreshing } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  function getLatestResult(quizId: string) {
    return quizResults.find(r => r.quizId === quizId);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Self-Discovery</Text>
        <Text style={styles.subtitle}>Learn more about yourself</Text>
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
