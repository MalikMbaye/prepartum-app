import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { dailyPrompts, getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';
import { FocusArea } from '@/lib/types';

type FilterType = 'all' | FocusArea;

export default function PromptsScreen() {
  const insets = useSafeAreaInsets();
  const { promptResponses } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const completedIds = new Set(promptResponses.map(r => r.promptId));
  const filtered = filter === 'all' ? dailyPrompts : dailyPrompts.filter(p => p.category === filter);

  const filters: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: Colors.textPrimary },
    { key: 'mindset', label: 'Mindset', color: Colors.accentPink },
    { key: 'relationships', label: 'Relationships', color: Colors.accentBlue },
    { key: 'physical', label: 'Physical', color: Colors.accentPeach },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Daily Reflections</Text>
      <Text style={styles.subtitle}>Thoughtful prompts to guide your journey</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filters.map(f => (
          <Pressable
            key={f.key}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f.key); }}
            style={[styles.filterChip, filter === f.key && { backgroundColor: f.key === 'all' ? Colors.textPrimary : f.color }]}
          >
            <Text style={[styles.filterText, filter === f.key && { color: f.key === 'all' ? Colors.white : Colors.textPrimary }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.map((prompt, index) => {
        const isCompleted = completedIds.has(prompt.id);
        const response = promptResponses.find(r => r.promptId === prompt.id);

        return (
          <Animated.View key={prompt.id} entering={FadeInDown.delay(index * 60).duration(400)}>
            <Pressable
              onPress={() => {
                if (!isCompleted) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/prompt-response', params: { promptId: prompt.id, promptText: prompt.text, category: prompt.category } });
                }
              }}
              style={({ pressed }) => [
                styles.promptCard,
                isCompleted && styles.promptCardCompleted,
                pressed && !isCompleted && { opacity: 0.95, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.promptHeader}>
                <View style={[styles.dot, { backgroundColor: getCategoryColor(prompt.category) }]} />
                <Text style={styles.categoryLabel}>{getCategoryLabel(prompt.category)}</Text>
                {isCompleted && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark" size={12} color={Colors.white} />
                  </View>
                )}
              </View>
              <Text style={[styles.promptText, isCompleted && styles.promptTextCompleted]} numberOfLines={isCompleted ? 2 : 4}>
                {prompt.text}
              </Text>
              {isCompleted && response && (
                <Text style={styles.responsePreview} numberOfLines={2}>
                  Your response: {response.response}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  filterRow: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  promptCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  promptCardCompleted: {
    opacity: 0.7,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    flex: 1,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 23,
  },
  promptTextCompleted: {
    color: Colors.textSecondary,
  },
  responsePreview: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
});
