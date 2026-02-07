import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';

type FilterType = 'all' | 'mindset' | 'relationships' | 'physical';

function PromptHistoryItem({ response, index }: {
  response: { id: string; promptId: string; responseText: string; completedAt: string | null; savedToJournal: boolean | null; prompt?: { id: string; title: string | null; body: string; category: string; weekNumber: number | null; dayOfWeek: number | null } };
  index: number;
}) {
  const promptCategory = response.prompt?.category || 'mindset';
  const promptBody = response.prompt?.body || '';
  const catColor = getCategoryColor(promptCategory);

  const dateStr = response.completedAt
    ? new Date(response.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: '/prompt-detail',
            params: { responseId: response.id },
          });
        }}
        style={({ pressed }) => [styles.historyCard, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
      >
        <View style={styles.historyTop}>
          <View style={styles.historyMeta}>
            <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
            <Text style={styles.historyCategoryText}>{getCategoryLabel(promptCategory)}</Text>
          </View>
          <Text style={styles.historyDate}>{dateStr}</Text>
        </View>
        <Text style={styles.historyPromptText} numberOfLines={2}>{promptBody}</Text>
        <Text style={styles.historyResponsePreview} numberOfLines={2}>{response.responseText}</Text>
        <View style={styles.historyFooter}>
          {response.savedToJournal && (
            <View style={styles.journalBadge}>
              <Feather name="book-open" size={11} color={Colors.textSecondary} />
              <Text style={styles.journalBadgeText}>In journal</Text>
            </View>
          )}
          <Feather name="chevron-right" size={16} color={Colors.textLight} style={{ marginLeft: 'auto' }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function PromptsScreen() {
  const insets = useSafeAreaInsets();
  const { promptResponses, prompts, refreshing, refreshData } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const completedIds = new Set(promptResponses.map(r => r.promptId));
  const completedCount = promptResponses.length;
  const totalCount = prompts.length;

  const filteredResponses = useMemo(() => {
    if (filter === 'all') return promptResponses;
    return promptResponses.filter(r => r.prompt?.category === filter);
  }, [promptResponses, filter]);

  const unansweredPrompts = useMemo(() => {
    const unanswered = prompts.filter(p => !completedIds.has(p.id));
    if (filter === 'all') return unanswered;
    return unanswered.filter(p => p.category === filter);
  }, [prompts, completedIds, filter]);

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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshData}
          tintColor={Colors.textSecondary}
          colors={[Colors.accentPink]}
        />
      }
    >
      <Text style={styles.title}>Daily Reflections</Text>
      <Text style={styles.subtitle}>{completedCount} of {totalCount} prompts completed</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filters.map(f => {
          const isActive = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f.key); }}
              style={[
                styles.filterChip,
                isActive && { backgroundColor: f.key === 'all' ? Colors.textPrimary : f.color, borderColor: f.key === 'all' ? Colors.textPrimary : f.color },
              ]}
            >
              <Text style={[
                styles.filterText,
                isActive && { color: f.key === 'all' ? Colors.white : Colors.textPrimary },
              ]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filteredResponses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed</Text>
          {filteredResponses.map((r, i) => (
            <PromptHistoryItem key={r.id} response={r} index={i} />
          ))}
        </View>
      )}

      {unansweredPrompts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available</Text>
          {unansweredPrompts.map((prompt, index) => (
            <Animated.View key={prompt.id} entering={FadeInDown.delay((filteredResponses.length + index) * 50).duration(350)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({
                    pathname: '/prompt-response',
                    params: { promptId: prompt.id, promptText: prompt.body, category: prompt.category },
                  });
                }}
                style={({ pressed }) => [styles.availableCard, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
              >
                <View style={styles.historyTop}>
                  <View style={styles.historyMeta}>
                    <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(prompt.category) }]} />
                    <Text style={styles.historyCategoryText}>{getCategoryLabel(prompt.category)}</Text>
                  </View>
                  {prompt.weekNumber && (
                    <Text style={styles.weekBadge}>Week {prompt.weekNumber}</Text>
                  )}
                </View>
                <Text style={styles.availablePromptText} numberOfLines={3}>{prompt.body}</Text>
                <View style={styles.startRow}>
                  <Text style={styles.startText}>Start reflection</Text>
                  <Feather name="arrow-right" size={14} color={Colors.textPrimary} />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      {filteredResponses.length === 0 && unansweredPrompts.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="bulb-outline" size={40} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No prompts found</Text>
          <Text style={styles.emptyBody}>Try a different filter to see more</Text>
        </View>
      )}
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
    marginBottom: 24,
    marginHorizontal: -20,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  historyCard: {
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
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyCategoryText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  historyDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textLight,
  },
  historyPromptText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 8,
  },
  historyResponsePreview: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  journalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  journalBadgeText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
  weekBadge: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textLight,
  },

  availableCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  availablePromptText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 23,
    marginBottom: 12,
  },
  startRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  startText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
