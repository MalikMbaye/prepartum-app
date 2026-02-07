import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const CATEGORY_OPTIONS = [
  { key: 'first-trimester', label: 'First Trimester', color: Colors.accentPink },
  { key: 'second-trimester', label: 'Second Trimester', color: Colors.accentBlue },
  { key: 'third-trimester', label: 'Third Trimester', color: Colors.accentPeach },
  { key: 'hospital-bag', label: 'Hospital Bag', color: '#D4E2D4' },
  { key: 'partner-prep', label: 'Partner Prep', color: '#D6D4E8' },
  { key: 'postpartum', label: 'Postpartum', color: '#E8D4D6' },
];

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { addCustomTask } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('first-trimester');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const canSave = title.trim().length > 0;

  async function handleSave() {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addCustomTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
      });
      setSaved(true);
      setTimeout(() => router.back(), 1200);
    } catch (e) {
      console.error('Error adding task:', e);
      setIsSaving(false);
    }
  }

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.savedContainer}>
          <Animated.View entering={ZoomIn.delay(200).duration(400)}>
            <View style={styles.savedCircle}>
              <Ionicons name="checkmark" size={32} color={Colors.textPrimary} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={styles.savedTitle}>
            Task added
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(550).duration(400)} style={styles.savedBody}>
            Your custom task has been added to the board
          </Animated.Text>
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
        <Text style={styles.headerTitle}>Add Task</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || isSaving}
          style={({ pressed }) => [
            styles.saveButton,
            (!canSave || isSaving) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
          testID="save-task-button"
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text>
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
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={Colors.textLight}
            autoFocus
            testID="task-title-input"
          />

          <Text style={styles.sectionLabel}>Description (optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add more details..."
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
            testID="task-description-input"
          />

          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_OPTIONS.map(cat => (
              <Pressable
                key={cat.key}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat.key); }}
                style={[
                  styles.categoryOption,
                  category === cat.key && styles.categoryOptionActive,
                  category === cat.key && { borderColor: cat.color },
                ]}
                testID={`category-${cat.key}`}
              >
                <View style={[styles.categoryColorDot, { backgroundColor: cat.color }]} />
                <Text style={[
                  styles.categoryOptionText,
                  category === cat.key && styles.categoryOptionTextActive,
                ]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
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
    backgroundColor: Colors.accentPeach,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  titleInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  descriptionInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
    minHeight: 100,
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.cardBg,
  },
  categoryColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryOptionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoryOptionTextActive: {
    fontFamily: 'Lato_700Bold',
    color: Colors.textPrimary,
  },
  savedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  savedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  savedTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  savedBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
