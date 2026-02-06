import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FocusArea } from '@/lib/types';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';

type CategoryOption = FocusArea | 'general';

export default function NewMemoryScreen() {
  const insets = useSafeAreaInsets();
  const { addMemory } = useApp();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryOption>('general');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  async function handleSave() {
    if (!content.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addMemory({
      content: content.trim(),
      type: category,
      tags,
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
        <Text style={styles.headerTitle}>New Memory</Text>
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
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="What moment do you want to remember?"
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <Text style={styles.label}>Category</Text>
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

          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag..."
              placeholderTextColor={Colors.textLight}
              onSubmitEditing={addTag}
              returnKeyType="done"
            />
            <Pressable onPress={addTag} style={styles.addTagButton}>
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <Pressable key={tag} onPress={() => removeTag(tag)} style={styles.tagBadge}>
                  <Text style={styles.tagBadgeText}>{tag}</Text>
                  <Feather name="x" size={12} color={Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
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
  contentInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 150,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
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
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addTagButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagBadgeText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
});
