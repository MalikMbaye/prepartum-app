import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, TextInput,
  ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, {
  FadeIn, FadeInDown, FadeInUp, FadeOut,
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '@/contexts/AppContext';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

const PLUM = '#4A2F4B';
const CREAM = '#FAF8F5';
const CARD_BG = '#FFFFFF';
const TEXT_SECONDARY = '#8A7F94';
const BORDER = '#F0E8E4';
const TOTAL_QUESTIONS = 24;

type IntakeQuestion = {
  id: string;
  questionId: string;
  phase: number;
  questionText: string;
  questionType: string;
  answerOptions: { value: string; label: string }[] | null;
  category: string | null;
  orderNumber: number | null;
  required: boolean | null;
  scoringMap: Record<string, any> | null;
};

type ScreenState = 'welcome' | 'phase_transition' | 'question' | 'processing' | 'complete';

const PHASE_INFO: Record<number, { icon: string; title: string; subtitle: string }> = {
  1: { icon: 'person-outline', title: 'About You', subtitle: 'A few basics to get started' },
  2: { icon: 'heart-outline', title: 'Your Mindset', subtitle: 'How you\'re feeling right now' },
  3: { icon: 'people-outline', title: 'Your World', subtitle: 'Relationships, support, and readiness' },
};

const SEASON_DESCRIPTIONS: Record<string, { emoji: string; title: string; description: string }> = {
  tender: {
    emoji: '🌸',
    title: 'A Tender Season',
    description: 'You\'re in a tender season. We\'ll be gentle with you, offering warmth, validation, and a safe space to process your emotions at your own pace.',
  },
  grounding: {
    emoji: '🌿',
    title: 'A Grounding Season',
    description: 'You\'re in a grounding season. We\'ll help you stay steady, build confidence in your decisions, and find your footing as you prepare for what\'s ahead.',
  },
  expanding: {
    emoji: '✨',
    title: 'An Expanding Season',
    description: 'You\'re in an expanding season. You\'re ready to dream, grow, and embrace the beautiful transformation ahead with open arms.',
  },
  restorative: {
    emoji: '🌙',
    title: 'A Restorative Season',
    description: 'You\'re in a restorative season. We\'ll remind you to rest, recharge, and honour your body\'s needs as it does the incredible work of growing new life.',
  },
};

function tryHaptic(style: any = Haptics.ImpactFeedbackStyle.Light) {
  try { Haptics.impactAsync(style); } catch {}
}

export default function IntakeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const [screen, setScreen] = useState<ScreenState>('welcome');
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; answerData?: any }>>({});
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [textValue, setTextValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [calculatedSeason, setCalculatedSeason] = useState('');
  const [calculatedFlags, setCalculatedFlags] = useState<string[]>([]);
  const [currentPhase, setCurrentPhase] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  const pulseAnim = useSharedValue(1);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/intake-questions', baseUrl).toString());
      const data = await res.json();
      setQuestions(data);

      if (profile?.id) {
        const respRes = await fetch(new URL(`/api/users/${profile.id}/intake-responses`, baseUrl).toString());
        const existingResponses = await respRes.json();
        if (existingResponses.length > 0) {
          const restored: Record<string, { answer: string; answerData?: any }> = {};
          for (const r of existingResponses) {
            restored[r.questionId] = { answer: r.answer, answerData: r.answerData };
          }
          setAnswers(restored);
          setCurrentIndex(existingResponses.length);
        }
      }
    } catch (e) {
      console.error('Error loading intake questions:', e);
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) : 0;

  function getCurrentAnswer(): string {
    if (!currentQuestion) return '';
    const saved = answers[currentQuestion.id];
    return saved?.answer || '';
  }

  function canAdvance(): boolean {
    if (!currentQuestion) return false;
    const qt = currentQuestion.questionType;
    if (qt === 'text_input') return textValue.trim().length > 0;
    if (qt === 'date_picker') return dateValue.trim().length > 0;
    if (qt === 'single_select') return selectedValues.length === 1;
    if (qt === 'multi_select') return selectedValues.length > 0;
    return false;
  }

  function prepareQuestionState() {
    if (!questions[currentIndex]) return;
    const q = questions[currentIndex];
    const existing = answers[q.id];
    if (existing) {
      if (q.questionType === 'text_input') {
        setTextValue(existing.answer);
        setSelectedValues([]);
      } else if (q.questionType === 'date_picker') {
        setDateValue(existing.answer);
        setSelectedValues([]);
      } else if (q.questionType === 'multi_select') {
        setSelectedValues(existing.answer.split(','));
        setTextValue('');
      } else {
        setSelectedValues([existing.answer]);
        setTextValue('');
      }
    } else {
      setSelectedValues([]);
      // Pre-fill from onboarding profile for questions already answered there
      if (q.questionId === '1.1' && profile?.name) {
        setTextValue(profile.name);
      } else {
        setTextValue('');
      }
      if (q.questionId === '1.2' && profile?.dueDate) {
        setDateValue(profile.dueDate);
      } else {
        setDateValue('');
      }
    }
  }

  useEffect(() => {
    if (screen === 'question' && questions.length > 0) {
      prepareQuestionState();
    }
  }, [currentIndex, screen, questions]);

  async function saveAnswer(questionId: string, answer: string, answerData?: any) {
    setAnswers(prev => ({ ...prev, [questionId]: { answer, answerData } }));

    if (profile?.id) {
      try {
        await apiRequest('POST', `/api/users/${profile.id}/intake-responses`, {
          questionId,
          answer,
          answerData,
        });
      } catch (e) {
        console.error('Error saving intake response:', e);
      }
    }
  }

  async function handleNext() {
    if (!currentQuestion || !canAdvance()) return;
    tryHaptic();

    const qt = currentQuestion.questionType;
    let answerVal = '';
    let answerData: any = undefined;

    if (qt === 'text_input') {
      answerVal = textValue.trim();
      if (currentQuestion.questionId === '1.1' && profile?.id) {
        try { await setProfile({ name: answerVal }); } catch {}
      }
    } else if (qt === 'date_picker') {
      answerVal = dateValue.trim();
      if (currentQuestion.questionId === '1.2' && profile?.id) {
        try { await setProfile({ dueDate: answerVal }); } catch {}
      }
    } else if (qt === 'multi_select') {
      answerVal = selectedValues.join(',');
      answerData = { selected: selectedValues };
    } else {
      answerVal = selectedValues[0];
    }

    await saveAnswer(currentQuestion.id, answerVal, answerData);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) {
      setScreen('processing');
      calculateProfile();
      return;
    }

    const nextQ = questions[nextIndex];
    if (nextQ && nextQ.phase !== currentQuestion.phase) {
      setCurrentPhase(nextQ.phase);
      setCurrentIndex(nextIndex);
      setScreen('phase_transition');
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  function handleSingleSelect(value: string) {
    tryHaptic();
    setSelectedValues([value]);
    setTimeout(() => {
      const qt = currentQuestion?.questionType;
      if (qt === 'single_select') {
        const answerVal = value;
        saveAnswer(currentQuestion!.id, answerVal);

        const nextIndex = currentIndex + 1;
        if (nextIndex >= questions.length) {
          setScreen('processing');
          calculateProfile();
          return;
        }
        const nextQ = questions[nextIndex];
        if (nextQ && nextQ.phase !== currentQuestion!.phase) {
          setCurrentPhase(nextQ.phase);
          setCurrentIndex(nextIndex);
          setScreen('phase_transition');
        } else {
          setCurrentIndex(nextIndex);
        }
      }
    }, 500);
  }

  function handleMultiSelect(value: string) {
    tryHaptic();
    setSelectedValues(prev => {
      if (prev.includes(value)) return prev.filter(v => v !== value);
      return [...prev, value];
    });
  }

  function handleBack() {
    tryHaptic();
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevQ = questions[prevIndex];
      if (prevQ && prevQ.phase !== questions[currentIndex]?.phase) {
        setCurrentPhase(prevQ.phase);
      }
      setCurrentIndex(prevIndex);
      if (screen !== 'question') setScreen('question');
    } else {
      setScreen('welcome');
    }
  }

  async function calculateProfile() {
    let derivedPersona = 'supported_nurturer';

    if (profile?.id) {
      try {
        const res = await apiRequest('POST', `/api/users/${profile.id}/intake/complete`, {});
        const data = await res.json();
        const calculatedProfile = data.profile;

        derivedPersona = calculatedProfile.profileFlags?.persona || 'supported_nurturer';
        setCalculatedSeason(calculatedProfile.currentSeason);

        const flagKeys = Object.keys(calculatedProfile.profileFlags || {});
        setCalculatedFlags(flagKeys);

        await setProfile({
          ...data.user,
          intakeCompleted: true,
          currentSeason: calculatedProfile.currentSeason,
          seasonScores: calculatedProfile.seasonScores,
          profileFlags: calculatedProfile.profileFlags,
        });
      } catch (e) {
        console.error('Error completing intake:', e);
        setCalculatedSeason('grounding');
        setCalculatedFlags([]);
      }
    } else {
      setCalculatedSeason('grounding');
      setCalculatedFlags([]);
    }

    await new Promise(resolve => setTimeout(resolve, 2500));
    router.replace({ pathname: '/persona-reveal', params: { persona: derivedPersona } });
  }

  function handleBeginJourney() {
    tryHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  }

  function handleSkip() {
    tryHaptic();
    router.replace('/(tabs)');
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + webTopInset }]}>
        <ActivityIndicator size="large" color={PLUM} />
      </View>
    );
  }

  // WELCOME SCREEN
  if (screen === 'welcome') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.welcomeSkipRow}>
          <Pressable onPress={handleSkip} hitSlop={12} testID="skip-intake">
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>

        <View style={styles.welcomeContent}>
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text style={styles.welcomeTitle}>Welcome, mama</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text style={styles.welcomeBody}>
              Before we begin, let's create your personalised experience. These questions help us understand where you are right now — emotionally, relationally, and physically.{'\n\n'}There are no wrong answers. This is just for you.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.welcomeBottom}>
            <Pressable
              onPress={() => {
                tryHaptic(Haptics.ImpactFeedbackStyle.Medium);
                setCurrentPhase(1);
                setScreen('phase_transition');
              }}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              testID="begin-intake"
            >
              <Text style={styles.primaryBtnText}>Let's Begin</Text>
            </Pressable>

            <Text style={styles.durationText}>Takes about 8-12 minutes</Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  // PHASE TRANSITION SCREEN
  if (screen === 'phase_transition') {
    const info = PHASE_INFO[currentPhase] || PHASE_INFO[1];
    return (
      <Pressable
        style={[styles.container, styles.centered, { paddingTop: insets.top + webTopInset }]}
        onPress={() => {
          tryHaptic();
          setScreen('question');
        }}
        testID="phase-transition"
      >
        <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.phaseContent}>
          <View style={styles.phaseIconCircle}>
            <Ionicons name={info.icon as any} size={36} color={PLUM} />
          </View>
          <Text style={styles.phaseLabel}>Phase {currentPhase} of 3</Text>
          <Text style={styles.phaseTitle}>{info.title}</Text>
          <Text style={styles.phaseSubtitle}>{info.subtitle}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.phaseBottomWrap}>
          <Pressable
            onPress={() => {
              tryHaptic();
              setScreen('question');
            }}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    );
  }

  // PROCESSING SCREEN
  if (screen === 'processing') {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + webTopInset }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.processingContent}>
          <ProcessingDots />
          <Text style={styles.processingTitle}>Creating your personalised{'\n'}experience...</Text>
          <Text style={styles.processingSubtitle}>Analysing your responses</Text>
        </Animated.View>
      </View>
    );
  }

  // COMPLETE SCREEN
  if (screen === 'complete') {
    const seasonInfo = SEASON_DESCRIPTIONS[calculatedSeason] || SEASON_DESCRIPTIONS.grounding;
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <ScrollView
          contentContainerStyle={[styles.completeContent, { paddingBottom: insets.bottom + webBottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.completeHeader}>
            <Text style={styles.completeEmoji}>{seasonInfo.emoji}</Text>
            <Text style={styles.completeTitle}>Your Profile is Ready!</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.seasonCard}>
            <Text style={styles.seasonTitle}>{seasonInfo.title}</Text>
            <Text style={styles.seasonDescription}>{seasonInfo.description}</Text>
          </Animated.View>

          {calculatedFlags.length > 0 && (
            <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.flagsSection}>
              <Text style={styles.flagsSectionTitle}>We'll focus on</Text>
              <View style={styles.flagsList}>
                {calculatedFlags.slice(0, 3).map((flag, i) => (
                  <View key={flag} style={styles.flagChip}>
                    <Ionicons name="leaf-outline" size={14} color={PLUM} />
                    <Text style={styles.flagText}>{formatFlag(flag)}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.completeButtonWrap}>
            <Pressable
              onPress={handleBeginJourney}
              style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
              testID="begin-journey"
            >
              <Text style={styles.primaryBtnText}>Begin Your Journey</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // QUESTION SCREEN
  if (!currentQuestion) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      {/* Header */}
      <View style={styles.qHeader}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn} testID="question-back">
          <Feather name="chevron-left" size={22} color={PLUM} />
        </Pressable>
        <Text style={styles.qCounter}>Question {currentIndex + 1} of {TOTAL_QUESTIONS}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / TOTAL_QUESTIONS) * 100}%` }]} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.qContent, { paddingBottom: insets.bottom + webBottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(300)} key={currentQuestion.id}>
          <Text style={styles.qText}>{currentQuestion.questionText}</Text>

          {currentQuestion.questionType === 'text_input' && (
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={textValue}
                onChangeText={setTextValue}
                placeholder={currentQuestion.questionId === '1.1' ? 'Your name' : 'Type your answer...'}
                placeholderTextColor={TEXT_SECONDARY}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => canAdvance() && handleNext()}
                testID="text-answer"
              />
            </View>
          )}

          {currentQuestion.questionType === 'date_picker' && (
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={dateValue}
                onChangeText={setDateValue}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={TEXT_SECONDARY}
                autoFocus
                keyboardType="numbers-and-punctuation"
                testID="date-answer"
              />
              <Text style={styles.dateHint}>Enter your due date (e.g. 2026-08-15)</Text>
            </View>
          )}

          {currentQuestion.questionType === 'single_select' && currentQuestion.answerOptions && (
            <View style={styles.optionsWrap}>
              {(currentQuestion.answerOptions as { value: string; label: string }[]).map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleSingleSelect(opt.value)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    testID={`option-${opt.value}`}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={PLUM} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {currentQuestion.questionType === 'multi_select' && currentQuestion.answerOptions && (
            <View style={styles.optionsWrap}>
              {(currentQuestion.answerOptions as { value: string; label: string }[]).map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => handleMultiSelect(opt.value)}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    testID={`option-${opt.value}`}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.label}
                    </Text>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom button for text, date, multi-select */}
      {(currentQuestion.questionType !== 'single_select') && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
          <Pressable
            onPress={handleNext}
            disabled={!canAdvance()}
            style={({ pressed }) => [
              styles.primaryBtn,
              !canAdvance() && styles.primaryBtnDisabled,
              pressed && canAdvance() && { opacity: 0.9 },
            ]}
            testID="next-btn"
          >
            <Text style={[styles.primaryBtnText, !canAdvance() && styles.primaryBtnTextDisabled]}>
              {currentIndex === questions.length - 1 ? 'Complete' : 'Next'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ProcessingDots() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    dot1.value = withRepeat(withSequence(
      withTiming(1, { duration: 400 }),
      withTiming(0.3, { duration: 400 }),
    ), -1, false);

    setTimeout(() => {
      dot2.value = withRepeat(withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ), -1, false);
    }, 200);

    setTimeout(() => {
      dot3.value = withRepeat(withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ), -1, false);
    }, 400);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.dotsRow}>
      <Animated.View style={[styles.dot, s1]} />
      <Animated.View style={[styles.dot, s2]} />
      <Animated.View style={[styles.dot, s3]} />
    </View>
  );
}

function formatFlag(flag: string): string {
  return flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Welcome
  welcomeSkipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skipText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: TEXT_SECONDARY,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    color: PLUM,
    textAlign: 'center',
    marginBottom: 24,
  },
  welcomeBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: PLUM,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.85,
  },
  welcomeBottom: {
    marginTop: 48,
    alignItems: 'center',
  },
  durationText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 16,
  },

  // Phase transition
  phaseContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  phaseIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CARD_BG,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  phaseLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  phaseTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: PLUM,
    textAlign: 'center',
    marginBottom: 8,
  },
  phaseSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  phaseBottomWrap: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
  },

  // Processing
  processingContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  processingTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: PLUM,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 32,
  },
  processingSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: TEXT_SECONDARY,
    marginTop: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PLUM,
  },

  // Complete
  completeContent: {
    paddingHorizontal: 28,
    paddingTop: 40,
    alignItems: 'center',
  },
  completeHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  completeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: PLUM,
    textAlign: 'center',
  },
  seasonCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  seasonTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: PLUM,
    marginBottom: 12,
  },
  seasonDescription: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: PLUM,
    lineHeight: 24,
    opacity: 0.85,
  },
  flagsSection: {
    width: '100%',
    marginBottom: 24,
  },
  flagsSectionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: TEXT_SECONDARY,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  flagsList: {
    gap: 8,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  flagText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: PLUM,
  },
  completeButtonWrap: {
    width: '100%',
    marginTop: 16,
  },

  // Question screen
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qCounter: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: BORDER,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PLUM,
    borderRadius: 2,
  },
  qContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  qText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: PLUM,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 32,
  },
  inputWrap: {
    marginBottom: 20,
  },
  textInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 18,
    color: PLUM,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: BORDER,
    textAlign: 'center',
  },
  dateHint: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 10,
  },
  optionsWrap: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: PLUM,
    backgroundColor: PLUM + '08',
  },
  optionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: PLUM,
    flex: 1,
    lineHeight: 22,
  },
  optionTextSelected: {
    fontFamily: 'Lato_700Bold',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: PLUM,
    borderColor: PLUM,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: CREAM,
  },

  // Shared
  primaryBtn: {
    backgroundColor: PLUM,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  primaryBtnDisabled: {
    backgroundColor: PLUM + '40',
  },
  primaryBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  primaryBtnTextDisabled: {
    opacity: 0.6,
  },
});
