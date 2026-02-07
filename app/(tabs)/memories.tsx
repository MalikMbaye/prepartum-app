import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

function getTypeIcon(type: string): { name: keyof typeof Feather.glyphMap; color: string } {
  switch (type) {
    case 'photo': return { name: 'camera', color: Colors.accentPink };
    case 'voice': return { name: 'mic', color: Colors.accentBlue };
    default: return { name: 'edit-3', color: Colors.accentPeach };
  }
}

interface MemoryGroup {
  label: string;
  memories: Array<{
    id: string;
    userId: string;
    type: string;
    content: string;
    mediaUrl: string | null;
    tags: string[] | null;
    createdAt: string | null;
  }>;
}

function MemoryCard({ memory, index, isLast }: {
  memory: MemoryGroup['memories'][0];
  index: number;
  isLast: boolean;
}) {
  const typeInfo = getTypeIcon(memory.type);
  const dateStr = memory.createdAt
    ? new Date(memory.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';
  const isPhoto = memory.type === 'photo' && memory.mediaUrl;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/view-memory', params: { memoryId: memory.id } });
        }}
        style={({ pressed }) => [styles.cardRow, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.timelineCol}>
          <View style={[styles.typeIconCircle, { backgroundColor: typeInfo.color }]}>
            <Feather name={typeInfo.name} size={14} color={Colors.textPrimary} />
          </View>
          {!isLast && <View style={styles.timelineLine} />}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardDate}>{dateStr}</Text>

          {isPhoto && (
            <Image
              source={{ uri: memory.mediaUrl! }}
              style={styles.photoThumb}
              resizeMode="cover"
            />
          )}

          <Text style={styles.cardContent} numberOfLines={isPhoto ? 2 : 4}>
            {memory.content}
          </Text>

          {(memory.tags || []).length > 0 && (
            <View style={styles.tagRow}>
              {(memory.tags || []).slice(0, 3).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {(memory.tags || []).length > 3 && (
                <Text style={styles.moreTagsText}>+{(memory.tags || []).length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MemoriesScreen() {
  const insets = useSafeAreaInsets();
  const { memories, refreshing, refreshData } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const groupedMemories = useMemo<MemoryGroup[]>(() => {
    const groups: Record<string, MemoryGroup['memories']> = {};
    for (const mem of memories) {
      const date = mem.createdAt ? new Date(mem.createdAt) : new Date();
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(mem);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, mems]) => {
        const d = mems[0].createdAt ? new Date(mems[0].createdAt) : new Date();
        return {
          label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          memories: mems,
        };
      });
  }, [memories]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Memory Bank</Text>
            <Text style={styles.subtitle}>Your pregnancy moments, preserved</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/new-memory'); }}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
            testID="add-memory-button"
          >
            <Ionicons name="add" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
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
        {memories.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={44} color={Colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Start capturing moments</Text>
            <Text style={styles.emptyBody}>
              These memories will be here for you to look back on throughout your journey
            </Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/new-memory'); }}
              style={({ pressed }) => [styles.emptyAddButton, pressed && { opacity: 0.9 }]}
            >
              <Ionicons name="add" size={20} color={Colors.textPrimary} />
              <Text style={styles.emptyAddText}>Add your first memory</Text>
            </Pressable>
          </View>
        ) : (
          groupedMemories.map((group, gi) => (
            <View key={gi} style={styles.monthGroup}>
              <Text style={styles.monthLabel}>{group.label}</Text>
              {group.memories.map((mem, mi) => (
                <MemoryCard
                  key={mem.id}
                  memory={mem}
                  index={gi * 10 + mi}
                  isLast={mi === group.memories.length - 1 && gi === groupedMemories.length - 1}
                />
              ))}
            </View>
          ))
        )}

        {memories.length > 0 && (
          <View style={styles.countFooter}>
            <Text style={styles.countText}>{memories.length} {memories.length === 1 ? 'memory' : 'memories'} saved</Text>
          </View>
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
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  monthGroup: {
    marginBottom: 8,
  },
  monthLabel: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 14,
    marginLeft: 4,
  },

  cardRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineCol: {
    width: 28,
    alignItems: 'center',
    marginRight: 14,
  },
  typeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  cardBody: {
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
  cardDate: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 8,
  },
  photoThumb: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: Colors.border,
  },
  cardContent: {
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
    alignItems: 'center',
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
  moreTagsText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textLight,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 14,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 21,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 8,
  },
  emptyAddText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },

  countFooter: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  countText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
  },
});
