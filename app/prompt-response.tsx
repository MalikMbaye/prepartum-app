import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  Platform, KeyboardAvoidingView, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, FadeInUp,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';
import { personaAffirmation } from '@/lib/persona';

const CATEGORY_AFFIRMATIONS: Record<string, string> = {
  mindset: 'Awareness is the beginning of everything.',
  relationships: 'You just practiced asking for what you need.',
  physical: 'You honored your body today.',
};

const ACTION_BY_CATEGORY: Record<string, string> = {
  mindset: "Take 5 minutes to sit with what you just wrote. Do not analyze it. Just let it be.",
  relationships: "Share one sentence from your reflection with someone you trust today. Even a text is enough.",
  physical: "Put one hand on your belly. Breathe into your response for 60 seconds.",
};

function PulsingGlow({ color }: { color: string }) {
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1200 }),
        withTiming(0.25, { duration: 1200 }),
      ),
      -1,
      false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.glowWrapper}>
      <Animated.View style={[styles.glowOuter, { backgroundColor: color }, glowStyle]} />
      <View style={[styles.glowInner, { backgroundColor: color }]}>
        <Ionicons name="checkmark" size={38} color={Colors.textPrimary} />
      </View>
    </View>
  );
}

export default function PromptResponseScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const {
    promptId, promptText, category,
    promptTitle, format, weekNumber,
  } = useLocalSearchParams<{
    promptId: string;
    promptText: string;
    category: string;
    promptTitle?: string;
    format?: string;
    weekNumber?: string;
  }>();

  const { addPromptResponse, addJournalEntry, promptResponses, profile, prompts } = useApp();
  const currentPrompt = prompts.find(p => p.id === promptId);
  const childConnection = currentPrompt?.childConnection ?? null;
  const promptContext = currentPrompt?.context ?? null;
  const closingReframe = currentPrompt?.closingReframe ?? null;

  const [screen, setScreen] = useState<1 | 2 | 3>(1);
  const [responseText, setResponseText] = useState('');
  const [likertValue, setLikertValue] = useState<number | null>(null);
  const [saveToJournal, setSaveToJournal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const catColor = getCategoryColor(category || 'mindset');
  const catLabel = getCategoryLabel(category || 'mindset');
  const persona = (profile?.profileFlags?.persona as string) || 'supported_nurturer';
  const baseAffirmation = CATEGORY_AFFIRMATIONS[category || 'mindset'] ?? CATEGORY_AFFIRMATIONS.mindset;
  const affirmation = personaAffirmation(baseAffirmation, persona);

  const existingResponse = promptResponses.find(r => r.promptId === promptId);
  const alreadyCompleted = !!existingResponse;

  const firstSentence = (() => {
    if (!promptText) return '';
    const match = promptText.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : promptText.substring(0, 100) + '…';
  })();

  const effectiveResponse = format === 'likert'
    ? (likertValue !== null ? String(likertValue) : '')
    : responseText.trim();

  const canComplete = effectiveResponse.length > 0;

  async function handleDone() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await addPromptResponse({
        promptId: promptId || '',
        responseText: effectiveResponse,
        savedToJournal: saveToJournal,
      });
      if (saveToJournal) {
        await addJournalEntry({
          title: `Reflection: ${catLabel}`,
          content: `Prompt: ${promptText}\n\nMy Response: ${effectiveResponse}`,
          category: category || 'mindset',
          fromPrompt: true,
        });
      }
      router.back();
    } catch (e) {
      console.error('Error saving response:', e);
      setIsSaving(false);
      Alert.alert(
        "Could not save",
        "Your reflection was not saved. Please try again.",
        [{ text: "OK" }]
      );
    }
  }

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 20;

  // ── ALREADY COMPLETED ──────────────────────────────────────────────
  if (alreadyCompleted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={[styles.screenPad, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.pill, { backgroundColor: catColor }]}>
            <Text style={styles.pillText}>{catLabel}</Text>
          </View>
          <Text style={styles.completedMeta}>Completed</Text>
          <Text style={styles.reflectionQuestion}>{promptText}</Text>
          <View style={styles.completedBox}>
            <Text style={styles.completedBoxLabel}>Your reflection</Text>
            <Text style={styles.completedBoxText}>{existingResponse.responseText}</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.plumButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.plumButtonText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // ── SCREEN 1: CONTEXT ──────────────────────────────────────────────
  if (screen === 1) {
    return (
      <Animated.View
        key="s1"
        entering={FadeIn.duration(280)}
        style={[styles.container, { paddingTop: insets.top + webTopInset }]}
      >
        <View style={[styles.colorBar, { backgroundColor: catColor }]} />

        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="x" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={[styles.pill, { backgroundColor: catColor }]}>
            <Text style={styles.pillText}>{catLabel}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.screenPad, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text entering={FadeInDown.delay(80).duration(380)} style={styles.weekCatLabel}>
            {weekNumber ? `Week ${weekNumber}` : 'Today'} · {catLabel}
          </Animated.Text>

          {!!promptContext && (
            <Animated.View entering={FadeInDown.delay(140).duration(380)} style={styles.contextCard}>
              <Text style={styles.contextCardText}>{promptContext}</Text>
            </Animated.View>
          )}

          <Animated.Text entering={FadeInDown.delay(220).duration(380)} style={styles.contextTitle}>
            {promptTitle || promptText}
          </Animated.Text>

          {!!promptTitle && (
            <Animated.Text entering={FadeInDown.delay(320).duration(380)} style={styles.contextExcerpt}>
              {firstSentence}
            </Animated.Text>
          )}
        </ScrollView>

        <Animated.View
          entering={FadeInUp.delay(300).duration(380)}
          style={[styles.buttonRow, { paddingBottom: bottomPad }]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setScreen(2);
            }}
            style={({ pressed }) => [styles.plumButton, styles.plumButtonRow, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.plumButtonText}>Continue</Text>
            <Feather name="arrow-right" size={16} color={Colors.canvas} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  }

  // ── SCREEN 2: REFLECTION ───────────────────────────────────────────
  if (screen === 2) {
    return (
      <Animated.View
        key="s2"
        entering={FadeIn.duration(280)}
        style={[styles.container, { paddingTop: insets.top + webTopInset }]}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => setScreen(1)} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={20}
        >
          <ScrollView
            contentContainerStyle={[styles.screenPad, { paddingBottom: 120 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeInDown.delay(80).duration(380)}>
              <View style={[styles.pill, { backgroundColor: catColor, alignSelf: 'flex-start', marginBottom: 20 }]}>
                <Text style={styles.pillText}>{catLabel}</Text>
              </View>
              <Text style={styles.reflectionQuestion}>{promptText}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(380)}>
              {/* TEXT (default) */}
              {(!format || format === 'text' || format === 'multiselect') && (
                <View>
                  <TextInput
                    style={styles.textInput}
                    value={responseText}
                    onChangeText={setResponseText}
                    placeholder="Take your time. There's no wrong answer."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                    testID="prompt-response-input"
                  />
                  <Text style={styles.charCount}>{responseText.length} characters</Text>
                </View>
              )}

              {/* LIKERT */}
              {format === 'likert' && (
                <View style={styles.likertWrap}>
                  <View style={styles.likertRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Pressable
                        key={n}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setLikertValue(n);
                        }}
                        style={[
                          styles.likertBtn,
                          likertValue === n && { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
                        ]}
                      >
                        <Text style={[styles.likertNum, likertValue === n && { color: Colors.canvas }]}>{n}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.likertLabels}>
                    <Text style={styles.likertLabel}>Not at all</Text>
                    <Text style={styles.likertLabel}>Completely</Text>
                  </View>
                </View>
              )}

              {/* VOICE */}
              {format === 'voice' && (
                <View style={styles.voiceWrap}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (!responseText) setResponseText('Voice note recorded.');
                    }}
                    style={({ pressed }) => [
                      styles.micBtn,
                      { borderColor: catColor },
                      pressed && { transform: [{ scale: 0.95 }] },
                    ]}
                  >
                    <Ionicons name="mic" size={48} color={Colors.textPrimary} />
                  </Pressable>
                  <Text style={styles.voiceHint}>Tap to record your reflection</Text>
                  {!!responseText && (
                    <View style={[styles.textInput, { marginTop: 20 }]}>
                      <Text style={{ fontFamily: 'Lato_400Regular', fontSize: 15, color: Colors.textPrimary }}>
                        {responseText}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[styles.buttonRow, { paddingBottom: bottomPad }]}>
          <Pressable
            onPress={() => {
              if (!canComplete || isSaving) return;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setScreen(3);
            }}
            disabled={!canComplete || isSaving}
            style={({ pressed }) => [
              styles.plumButton,
              (!canComplete || isSaving) && { opacity: 0.35 },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.plumButtonText}>Complete</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  // ── SCREEN 3: CELEBRATION ──────────────────────────────────────────
  const todayAction = ACTION_BY_CATEGORY[category || 'mindset'] ?? ACTION_BY_CATEGORY.mindset;

  return (
    <Animated.View
      key="s3"
      entering={FadeIn.duration(400)}
      style={[styles.container, { paddingTop: insets.top + webTopInset }]}
    >
      <ScrollView
        contentContainerStyle={[styles.celebrationContainer, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.delay(100).duration(500)}>
          <PulsingGlow color={catColor} />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(380).duration(420)} style={styles.affirmationText}>
          {affirmation}
        </Animated.Text>

        {!!closingReframe && (
          <Animated.Text entering={FadeInDown.delay(460).duration(400)} style={styles.closingReframeText}>
            {closingReframe}
          </Animated.Text>
        )}

        {!!childConnection && (
          <Animated.View entering={FadeIn.delay(520).duration(600)} style={styles.childConnectionCard}>
            <Text style={styles.childConnectionIcon}>🌱</Text>
            <Text style={styles.childConnectionText}>{childConnection}</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(600).duration(380)} style={styles.actionCard}>
          <Text style={styles.actionCardLabel}>SOMETHING TO TRY TODAY</Text>
          <Text style={styles.actionCardText}>{todayAction}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(680).duration(380)}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSaveToJournal(v => !v);
            }}
            style={styles.toggleBtn}
          >
            <Ionicons
              name={saveToJournal ? 'checkbox' : 'square-outline'}
              size={24}
              color={saveToJournal ? Colors.textPrimary : Colors.textLight}
            />
            <Text style={styles.toggleText}>Save to Journal</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(820).duration(380)} style={{ width: '100%' }}>
          <Pressable
            onPress={handleDone}
            disabled={isSaving}
            style={({ pressed }) => [styles.plumButton, isSaving && { opacity: 0.5 }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.plumButtonText}>{isSaving ? 'Saving…' : 'Done'}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  colorBar: {
    height: 5,
    width: '100%',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  screenPad: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  buttonRow: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: Colors.canvas,
  },

  // Screen 1
  weekCatLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 20,
  },
  contextTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 38,
    marginBottom: 20,
  },
  contextExcerpt: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },

  // Screen 2
  reflectionQuestion: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    lineHeight: 30,
    marginBottom: 24,
  },
  textInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 180,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 8,
  },
  likertWrap: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  likertRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  likertBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.canvas,
  },
  likertNum: {
    fontFamily: 'Lato_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  likertLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  likertLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  voiceWrap: {
    alignItems: 'center',
    paddingTop: 20,
  },
  micBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardBg,
  },
  voiceHint: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 16,
  },

  // Buttons
  plumButton: {
    backgroundColor: Colors.textPrimary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  plumButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  plumButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.canvas,
  },

  // Screen 3 - Celebration
  celebrationContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 28,
    flexGrow: 1,
  },
  glowWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  glowInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affirmationText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 30,
  },
  childConnectionCard: {
    backgroundColor: '#F5E1DA',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  childConnectionIcon: {
    fontSize: 22,
  },
  childConnectionText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 16,
    color: '#5D5066',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  toggleText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },

  // Screen 1 - Context card
  contextCard: {
    backgroundColor: '#FFF0EC',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F5D6D6',
    marginBottom: 20,
  },
  contextCardText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#5D5066',
    lineHeight: 21,
  },

  // Screen 3 - Closing reframe + action
  closingReframeText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  actionCard: {
    backgroundColor: '#F5E1DA',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    gap: 8,
  },
  actionCardLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: '#993C1D',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  actionCardText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },

  // Already-completed view
  completedMeta: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 12,
    marginBottom: 20,
  },
  completedBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
  },
  completedBoxLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  completedBoxText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
});
