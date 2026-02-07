import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';

export default function PromptDetailScreen() {
  const insets = useSafeAreaInsets();
  const { responseId } = useLocalSearchParams<{ responseId: string }>();
  const { promptResponses, updatePromptResponse, addJournalEntry } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const response = promptResponses.find(r => r.id === responseId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(response?.responseText || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (response) setEditedText(response.responseText);
  }, [response?.responseText]);

  if (!response) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Response not found</Text>
          <Pressable onPress={() => router.back()} style={styles.goBackButton}>
            <Text style={styles.goBackText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const prompt = response.prompt;
  const promptCategory = prompt?.category || 'mindset';
  const promptBody = prompt?.body || '';
  const catColor = getCategoryColor(promptCategory);
  const catLabel = getCategoryLabel(promptCategory);

  const completedDate = response.completedAt
    ? new Date(response.completedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const canEdit = (() => {
    if (!response.completedAt) return true;
    const completed = new Date(response.completedAt);
    const now = new Date();
    const diffHrs = (now.getTime() - completed.getTime()) / (1000 * 60 * 60);
    return diffHrs < 24;
  })();

  async function handleSaveEdit() {
    if (!editedText.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await updatePromptResponse(response!.id, { responseText: editedText.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } catch (e) {
      console.error('Error updating response:', e);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveToJournal() {
    try {
      await addJournalEntry({
        title: `Reflection: ${catLabel}`,
        content: `Prompt: ${promptBody}\n\nMy Response: ${response!.responseText}`,
        category: promptCategory,
        fromPrompt: true,
      });
      await updatePromptResponse(response!.id, {
        responseText: response!.responseText,
        savedToJournal: true,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error('Error saving to journal:', e);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <Pressable
                onPress={() => { setIsEditing(false); setEditedText(response.responseText); }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={!editedText.trim() || isSaving}
                style={[styles.saveEditButton, { backgroundColor: catColor }, (!editedText.trim() || isSaving) && { opacity: 0.4 }]}
              >
                <Text style={styles.saveEditButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              {canEdit && (
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsEditing(true); }}
                  hitSlop={8}
                >
                  <Feather name="edit-2" size={20} color={Colors.textPrimary} />
                </Pressable>
              )}
            </>
          )}
        </View>
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
            <Text style={styles.dateText}>{completedDate}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Text style={styles.promptText}>{promptBody}</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <View style={styles.divider} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            <Text style={styles.responseLabel}>Your Reflection</Text>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editedText}
                onChangeText={setEditedText}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <Text style={styles.responseText}>{response.responseText}</Text>
            )}
          </Animated.View>

          {!isEditing && (
            <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.actionsSection}>
              {!response.savedToJournal && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleSaveToJournal();
                  }}
                  style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.9 }]}
                >
                  <Feather name="book-open" size={18} color={Colors.textPrimary} />
                  <Text style={styles.actionButtonText}>Save to Journal</Text>
                </Pressable>
              )}

              {response.savedToJournal && (
                <View style={styles.savedJournalIndicator}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.savedJournalText}>Saved to journal</Text>
                </View>
              )}

              {!canEdit && (
                <Text style={styles.editExpiredText}>Editing window has passed (24 hours)</Text>
              )}
            </Animated.View>
          )}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  saveEditButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveEditButtonText: {
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
  promptText: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 33,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 24,
  },
  responseLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  responseText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  editInput: {
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
  actionsSection: {
    marginTop: 32,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  savedJournalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  savedJournalText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.success,
  },
  editExpiredText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  goBackButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.accentPink,
    borderRadius: 20,
  },
  goBackText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
