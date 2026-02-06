import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';
import { FocusArea } from '@/lib/types';

export default function PromptResponseScreen() {
  const insets = useSafeAreaInsets();
  const { promptId, promptText, category } = useLocalSearchParams<{ promptId: string; promptText: string; category: string }>();
  const { addPromptResponse, addJournalEntry } = useApp();
  const [response, setResponse] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveToJournal, setSaveToJournal] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  async function handleSave() {
    if (!response.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await addPromptResponse({
      promptId: promptId || '',
      responseText: response.trim(),
      savedToJournal: saveToJournal,
    });

    if (saveToJournal) {
      await addJournalEntry({
        title: `Reflection: ${getCategoryLabel(category || 'mindset')}`,
        content: `Prompt: ${promptText}\n\nMy Response: ${response.trim()}`,
        category: (category as FocusArea) || 'mindset',
        fromPrompt: true,
      });
    }

    setSaved(true);
  }

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.celebrationContainer}>
          <View style={[styles.celebrationCircle, { backgroundColor: getCategoryColor(category || 'mindset') }]}>
            <Ionicons name="sparkles" size={36} color={Colors.textPrimary} />
          </View>
          <Text style={styles.celebrationTitle}>Beautiful reflection</Text>
          <Text style={styles.celebrationBody}>
            You showed up for yourself today.{'\n'}That takes courage and intention.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.doneButtonText}>Continue</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={!response.trim()}
          style={({ pressed }) => [styles.saveButton, !response.trim() && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.saveButtonText}>Save</Text>
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
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(category || 'mindset') }]}>
              <Text style={styles.categoryTagText}>{getCategoryLabel(category || 'mindset')}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Text style={styles.promptText}>{promptText}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <TextInput
              style={styles.responseInput}
              value={response}
              onChangeText={setResponse}
              placeholder="Take your time. Write freely..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
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
              <Text style={styles.journalToggleText}>Also save to my journal</Text>
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
  saveButton: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 18,
  },
  categoryTagText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  promptText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: 28,
  },
  responseInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 200,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  journalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    paddingVertical: 4,
  },
  journalToggleText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  celebrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  celebrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    marginBottom: 36,
  },
  doneButton: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 20,
  },
  doneButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
