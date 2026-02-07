import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInRight, FadeInDown, SlideInRight, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

const CATEGORY_COLORS: Record<string, string> = {
  mindset: Colors.accentPink,
  relationships: Colors.accentBlue,
  physical: Colors.accentPeach,
};

interface QuizOption {
  text: string;
  value: string;
  score?: number;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  options: QuizOption[];
  orderNumber: number;
}

interface QuizDetails {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    questionCount: number | null;
    estimatedMinutes: number | null;
    resultTypes: Record<string, { title: string; description: string; insights: string[] }>;
  };
  questions: QuizQuestion[];
}

function OptionCard({ option, isSelected, onPress, index }: {
  option: QuizOption;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const categoryColor = Colors.accentBlue;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.optionCard,
          isSelected && styles.optionCardSelected,
          isSelected && { borderColor: categoryColor },
          pressed && { opacity: 0.85 },
        ]}
        testID={`option-${index}`}
      >
        <View style={[styles.optionRadio, isSelected && { borderColor: categoryColor }]}>
          {isSelected && <View style={[styles.optionRadioDot, { backgroundColor: categoryColor }]} />}
        </View>
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function TakeQuizScreen() {
  const insets = useSafeAreaInsets();
  const { quizId } = useLocalSearchParams<{ quizId: string }>();
  const { submitQuizResult } = useApp();
  const [quizData, setQuizData] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const progressWidth = useSharedValue(0);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  async function loadQuiz() {
    try {
      const baseUrl = getApiUrl();
      const url = new URL(`/api/quizzes/${quizId}`, baseUrl);
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load quiz');
      const data = await res.json();
      setQuizData(data);
    } catch (e) {
      console.error('Error loading quiz:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (quizData) {
      const total = quizData.questions.length;
      progressWidth.value = withTiming((currentQuestion + 1) / total, { duration: 300 });
    }
  }, [currentQuestion, quizData]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const selectOption = useCallback((value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers(prev => ({ ...prev, [currentQuestion]: value }));
  }, [currentQuestion]);

  function goNext() {
    if (!quizData) return;
    if (currentQuestion < quizData.questions.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  }

  function goBack() {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  }

  async function handleSubmit() {
    if (!quizData || submitting) return;
    setSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const tallies: Record<string, number> = {};
      let totalScore = 0;
      const answerList: { questionIndex: number; selectedValue: string }[] = [];

      for (let i = 0; i < quizData.questions.length; i++) {
        const selectedValue = answers[i];
        if (selectedValue) {
          tallies[selectedValue] = (tallies[selectedValue] || 0) + 1;
          answerList.push({ questionIndex: i, selectedValue });
          const option = quizData.questions[i].options.find((o: QuizOption) => o.value === selectedValue);
          if (option?.score) {
            totalScore += option.score;
          }
        }
      }

      let resultType = Object.keys(tallies).sort((a, b) => tallies[b] - tallies[a])[0] || 'unknown';

      const resultTypeData = quizData.quiz.resultTypes?.[resultType];
      const insights = resultTypeData
        ? `${resultTypeData.title}: ${resultTypeData.description}`
        : 'Thank you for completing the quiz!';

      const result = await submitQuizResult({
        quizId: quizData.quiz.id,
        answers: answerList,
        resultType,
        score: totalScore,
        insights,
      });

      router.replace({ pathname: '/quiz-results', params: { quizId: quizData.quiz.id, resultId: result.id } });
    } catch (e) {
      console.error('Error submitting quiz:', e);
      setSubmitting(false);
    }
  }

  if (loading || !quizData) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={Colors.textSecondary} />
      </View>
    );
  }

  const question = quizData.questions[currentQuestion];
  const totalQuestions = quizData.questions.length;
  const selectedAnswer = answers[currentQuestion];
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const categoryColor = CATEGORY_COLORS[quizData.quiz.category || 'mindset'] || Colors.accentPink;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.quizLabel}>{quizData.quiz.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { backgroundColor: categoryColor }, progressStyle]} />
        </View>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {totalQuestions}
        </Text>
      </View>

      <View style={styles.questionContainer}>
        <Animated.Text key={currentQuestion} entering={FadeIn.duration(300)} style={styles.questionText}>
          {question.questionText}
        </Animated.Text>
      </View>

      <View style={styles.optionsContainer}>
        {(question.options as QuizOption[]).map((option, index) => (
          <OptionCard
            key={`${currentQuestion}-${index}`}
            option={option}
            isSelected={selectedAnswer === option.value}
            onPress={() => selectOption(option.value)}
            index={index}
          />
        ))}
      </View>

      <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 16) }]}>
        <Pressable
          onPress={goBack}
          disabled={currentQuestion === 0}
          style={({ pressed }) => [
            styles.navButton,
            currentQuestion === 0 && { opacity: 0.3 },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Feather name="arrow-left" size={20} color={Colors.textPrimary} />
          <Text style={styles.navButtonText}>Back</Text>
        </Pressable>

        <Pressable
          onPress={goNext}
          disabled={!selectedAnswer || submitting}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: categoryColor },
            (!selectedAnswer || submitting) && { opacity: 0.4 },
            pressed && { opacity: 0.85 },
          ]}
          testID="next-button"
        >
          <Text style={styles.nextButtonText}>
            {submitting ? 'Submitting...' : isLastQuestion ? 'See Results' : 'Next'}
          </Text>
          {!submitting && <Feather name={isLastQuestion ? 'check' : 'arrow-right'} size={18} color={Colors.textPrimary} />}
        </Pressable>
      </View>
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
  quizLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
  },
  questionContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  questionText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    backgroundColor: Colors.cardBg,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontFamily: 'Lato_700Bold',
    color: Colors.textPrimary,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navButtonText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  nextButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
