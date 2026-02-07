import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

const CATEGORY_COLORS: Record<string, string> = {
  mindset: Colors.accentPink,
  relationships: Colors.accentBlue,
  physical: Colors.accentPeach,
};

export default function QuizResultsScreen() {
  const insets = useSafeAreaInsets();
  const { quizId, resultId } = useLocalSearchParams<{ quizId: string; resultId: string }>();
  const { quizResults, quizzes } = useApp();
  const [quizDetail, setQuizDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const result = quizResults.find(r => r.id === resultId);
  const quiz = quizzes.find(q => q.id === quizId);

  useEffect(() => {
    loadQuizDetail();
  }, [quizId]);

  async function loadQuizDetail() {
    try {
      const baseUrl = getApiUrl();
      const url = new URL(`/api/quizzes/${quizId}`, baseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load quiz');
      const data = await res.json();
      setQuizDetail(data);
    } catch (e) {
      console.error('Error loading quiz detail:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !result || !quiz) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.textSecondary} />
      </View>
    );
  }

  const resultTypes = quizDetail?.quiz?.resultTypes || quiz.resultTypes || {};
  const resultTypeData = resultTypes[result.resultType || ''];
  const categoryColor = CATEGORY_COLORS[quiz.category || 'mindset'] || Colors.accentPink;
  const resultTitle = resultTypeData?.title || 'Your Result';
  const resultDescription = resultTypeData?.description || result.insights || 'Thank you for completing the quiz!';
  const resultInsights: string[] = resultTypeData?.insights || [];
  const completedDate = result.completedAt ? new Date(result.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Your Results</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.resultHeader}>
          <Text style={styles.quizTitleLabel}>{quiz.title}</Text>
          {completedDate ? <Text style={styles.dateLabel}>Completed {completedDate}</Text> : null}
        </Animated.View>

        <Animated.View entering={ZoomIn.delay(200).duration(500)}>
          <View style={[styles.resultCard, { borderColor: categoryColor }]}>
            <View style={[styles.resultIconCircle, { backgroundColor: categoryColor }]}>
              <Ionicons name="sparkles" size={28} color={Colors.textPrimary} />
            </View>
            <Text style={styles.resultTypeTitle}>{resultTitle}</Text>
            <Text style={styles.resultDescription}>{resultDescription}</Text>
          </View>
        </Animated.View>

        {resultInsights.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <Text style={styles.sectionTitle}>Personalized Insights</Text>
            <View style={styles.insightsContainer}>
              {resultInsights.map((insight, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(500 + index * 100).duration(300)}
                  style={styles.insightRow}
                >
                  <View style={[styles.insightDot, { backgroundColor: categoryColor }]} />
                  <Text style={styles.insightText}>{insight}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(800).duration(400)} style={styles.actions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace({ pathname: '/take-quiz', params: { quizId: quiz.id } });
            }}
            style={({ pressed }) => [styles.retakeButton, pressed && { opacity: 0.8 }]}
            testID="retake-quiz-button"
          >
            <Feather name="refresh-cw" size={16} color={Colors.textSecondary} />
            <Text style={styles.retakeText}>Retake Quiz</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.dismissAll();
            }}
            style={({ pressed }) => [styles.backButton, { backgroundColor: categoryColor }, pressed && { opacity: 0.85 }]}
            testID="back-to-quizzes-button"
          >
            <Text style={styles.backButtonText}>Back to Quizzes</Text>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topBarTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  resultHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  quizTitleLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
  },
  resultCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 32,
  },
  resultIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultTypeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  resultDescription: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  insightsContainer: {
    gap: 14,
    marginBottom: 32,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  insightText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  retakeText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
