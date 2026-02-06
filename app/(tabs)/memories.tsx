import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';

export default function MemoriesScreen() {
  const insets = useSafeAreaInsets();
  const { memories, deleteMemory } = useApp();
  const [search, setSearch] = useState('');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const filtered = search.trim()
    ? memories.filter(m =>
        m.content.toLowerCase().includes(search.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : memories;

  function handleDelete(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      deleteMemory(id);
    } else {
      Alert.alert('Delete Memory', 'Are you sure you want to remove this memory?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMemory(id) },
      ]);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Memory Bank</Text>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/new-memory'); }}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="add" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Moments worth remembering</Text>

        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search memories..."
            placeholderTextColor={Colors.textLight}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>
              {search ? 'No memories found' : 'Your memory bank is empty'}
            </Text>
            <Text style={styles.emptyBody}>
              {search ? 'Try a different search term' : 'Save meaningful moments from your pregnancy journey'}
            </Text>
          </View>
        ) : (
          filtered.map((memory, index) => (
            <Animated.View key={memory.id} entering={FadeInDown.delay(index * 60).duration(400)}>
              <View style={styles.memoryCard}>
                <View style={styles.timelineDot}>
                  <View style={[styles.dot, { backgroundColor: getCategoryColor(memory.category) }]} />
                  {index < filtered.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.memoryContent}>
                  <View style={styles.memoryHeader}>
                    <Text style={styles.memoryDate}>{formatDate(memory.date)}</Text>
                    <Pressable onPress={() => handleDelete(memory.id)} hitSlop={8}>
                      <Feather name="trash-2" size={14} color={Colors.textLight} />
                    </Pressable>
                  </View>
                  <Text style={styles.memoryText}>{memory.content}</Text>
                  {memory.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {memory.tags.map((tag, i) => (
                        <View key={i} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
  memoryCard: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineDot: {
    width: 24,
    alignItems: 'center',
    marginRight: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  memoryContent: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textLight,
  },
  memoryText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: Colors.canvas,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
