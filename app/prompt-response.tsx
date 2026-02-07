import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';

export default function PromptResponseScreen() {
  const insets = useSafeAreaInsets();
  const { promptId, promptText, category } = useLocalSearchParams<{ promptId: string; promptText: string; category: string }>();
  const { addPromptResponse, addJournalEntry, promptResponses } = useApp();
  const [response, setResponse] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveToJournal, setSaveToJournal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const existingResponse = promptResponses.find(r => r.promptId === promptId);
  const alreadyCompleted = !!existingResponse;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const catColor = getCategoryColor(category || 'mindset');
  const catLabel = getCategoryLabel(category || 'mindset');

  async function handleSave() {
    if (!response.trim() || isSaving) return;
    setIsSaving(true);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await addPromptResponse({
        promptId: promptId || '',
        responseText: response.trim(),
        savedToJournal: saveToJournal,
      });

      if (saveToJournal) {
        await addJournalEntry({
          title: `Reflection: ${catLabel}`,
          content: `Prompt: ${promptText}\n\nMy Response: ${response.trim()}`,
          category: category || 'mindset',
          fromPrompt: true,
        });
      }

      setSaved(true);
    } catch (e) {
      console.error('Error saving response:', e);
      setIsSaving(false);
    }
  }

  if (alreadyCompleted && !saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="x" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View />
        </View>
        <ScrollView contentContainerStyle={styles.completedContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.categoryPill, { backgroundColor: catColor }]}>
            <Text style={styles.categoryPillText}>{catLabel}</Text>
          </View>
          <Text style={styles.completedDate}>Completed</Text>
          <Text style={styles.promptTextDisplay}>{promptText}</Text>
          <View style={styles.completedResponseBox}>
            <Text style={styles.completedResponseLabel}>Your reflection</Text>
            <Text style={styles.completedResponseText}>{existingResponse.responseText}</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => [styles.backHomeButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.backHomeButtonText}>Back to Home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.celebrationContainer}>
          <Animated.View entering={ZoomIn.delay(200).duration(500)}>
            <View style={[styles.celebrationGlow, { backgroundColor: catColor }]}>
              <View style={[styles.celebrationCircle, { backgroundColor: catColor }]}>
                <Ionicons name="checkmark" size={36} color={Colors.textPrimary} />
              </View>
            </View>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(500).duration(400)} style={styles.celebrationTitle}>
            Reflection saved
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(650).duration(400)} style={styles.celebrationBody}>
            You showed up for yourself today.{'\n'}That takes courage and intention.
          </Animated.Text>

          {saveToJournal && (
            <Animated.Text entering={FadeInDown.delay(800).duration(400)} style={styles.journalSavedNote}>
              Also saved to your journal
            </Animated.Text>
          )}

          <Animated.View entering={FadeInDown.delay(900).duration(400)}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.continueButton, { backgroundColor: catColor }, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!response.trim() || isSaving}
          style={({ pressed }) => [
            styles.completeButton,
            { backgroundColor: catColor },
            (!response.trim() || isSaving) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.completeButtonText}>{isSaving ? 'Saving...' : 'Complete'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.metaRow}>
            <View style={[styles.categoryPill, { backgroundColor: catColor }]}>
              <Text style={styles.categoryPillText}>{catLabel}</Text>
            </View>
            <Text style={styles.dateText}>{todayFormatted}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Text style={styles.promptTextDisplay}>{promptText}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <TextInput
              style={styles.responseInput}
              value={response}
              onChangeText={setResponse}
              placeholder="Take your time. There's no wrong answer."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
              autoFocus
              testID="prompt-response-input"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.actionsRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSaveToJournal(!saveToJournal);
              }}
              style={styles.journalToggle}
            >
              <Ionicons
                name={saveToJournal ? 'checkbox' : 'square-outline'}
                size={22}
                color={saveToJournal ? Colors.textPrimary : Colors.textLight}
              />
              <Text style={styles.journalToggleText}>Save to Journal</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(400)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.skipLink}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  completeButton: {
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 20,
  },
  completeButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryPillText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  dateText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  promptTextDisplay: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 33,
    marginBottom: 28,
  },
  responseInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 200,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionsRow: {
    marginTop: 18,
  },
  journalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  journalToggleText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  skipLink: {
    alignSelf: 'center',
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textLight,
    textDecorationLine: 'underline',
  },

  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  celebrationGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    opacity: 0.3,
  },
  celebrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  celebrationTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  celebrationBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  journalSavedNote: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.success,
    marginBottom: 32,
  },
  continueButton: {
    paddingHorizontal: 44,
    paddingVertical: 16,
    borderRadius: 22,
  },
  continueButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },

  completedContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
    paddingTop: 8,
  },
  completedDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 20,
    marginTop: 12,
  },
  completedResponseBox: {
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
  },
  completedResponseLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  completedResponseText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  backHomeButton: {
    backgroundColor: Colors.accentPink,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  backHomeButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
