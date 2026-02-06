import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { journalEntries, deleteJournalEntry } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      deleteJournalEntry(id);
    } else {
      Alert.alert('Delete Entry', 'Remove this journal entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteJournalEntry(id) },
      ]);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Journal</Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/new-journal'); }}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
        >
          <Ionicons name="add" size={22} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {journalEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Your journal awaits</Text>
            <Text style={styles.emptyBody}>
              Write freely about your thoughts, feelings, and experiences
            </Text>
          </View>
        ) : (
          journalEntries.map((entry, index) => (
            <Animated.View key={entry.id} entering={FadeInDown.delay(index * 60).duration(400)}>
              <View style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryDate}>{formatDate(entry.createdAt || '')}</Text>
                    {entry.fromPrompt && (
                      <View style={styles.promptBadge}>
                        <Ionicons name="bulb-outline" size={10} color={Colors.textSecondary} />
                        <Text style={styles.promptBadgeText}>From prompt</Text>
                      </View>
                    )}
                  </View>
                  <Pressable onPress={() => handleDelete(entry.id)} hitSlop={8}>
                    <Feather name="trash-2" size={14} color={Colors.textLight} />
                  </Pressable>
                </View>
                <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(entry.category) }]} />
                <Text style={styles.entryTitle}>{entry.title}</Text>
                <Text style={styles.entryContent} numberOfLines={4}>{entry.content}</Text>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
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
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textLight,
  },
  promptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  promptBadgeText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 10,
    color: Colors.textSecondary,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  entryTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  entryContent: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});
