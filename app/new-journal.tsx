import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FocusArea } from '@/lib/types';
import { getCategoryColor } from '@/lib/prompts-data';

type CategoryOption = FocusArea | 'general';

export default function NewJournalScreen() {
  const insets = useSafeAreaInsets();
  const { addJournalEntry } = useApp();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryOption>('general');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  async function handleSave() {
    if (!content.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addJournalEntry({
      id: Crypto.randomUUID(),
      title: title.trim() || 'Untitled',
      content: content.trim(),
      category,
      date: new Date().toISOString(),
      fromPrompt: false,
    });
    router.back();
  }

  const categories: { key: CategoryOption; label: string; color: string }[] = [
    { key: 'general', label: 'General', color: '#E8E0EC' },
    { key: 'mindset', label: 'Mindset', color: Colors.accentPink },
    { key: 'relationships', label: 'Relationships', color: Colors.accentBlue },
    { key: 'physical', label: 'Physical', color: Colors.accentPeach },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>New Entry</Text>
        <Pressable
          onPress={handleSave}
          disabled={!content.trim()}
          style={({ pressed }) => [styles.saveButton, !content.trim() && { opacity: 0.4 }, pressed && { opacity: 0.8 }]}
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
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title (optional)"
            placeholderTextColor={Colors.textLight}
            autoFocus
          />

          <View style={styles.categoryRow}>
            {categories.map(c => (
              <Pressable
                key={c.key}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(c.key); }}
                style={[styles.categoryChip, category === c.key && { backgroundColor: c.color, borderColor: c.color }]}
              >
                <Text style={[styles.categoryChipText, category === c.key && { color: Colors.textPrimary }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Write what's on your heart..."
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
          />
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
  headerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
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
  titleInput: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 22,
    color: Colors.textPrimary,
    paddingVertical: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryChipText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  contentInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 250,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
