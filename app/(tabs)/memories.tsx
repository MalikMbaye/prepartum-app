import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  RefreshControl, Image, Modal, FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp, MemoryData } from '@/contexts/AppContext';

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

const TRIMESTER_INFO = [
  { t: 1, label: 'First Trimester', weeks: 'Weeks 1–12', sub: 'Beginning & Becoming', color: Colors.accentPeach },
  { t: 2, label: 'Second Trimester', weeks: 'Weeks 13–27', sub: 'Growing & Connecting', color: Colors.accentBlue },
  { t: 3, label: 'Third Trimester', weeks: 'Weeks 28–40', sub: 'Preparing & Trusting', color: Colors.accentPink },
];

function calcTrimester(memoryDate: string | null, dueDate: string | null): number | null {
  if (!memoryDate || !dueDate) return null;
  try {
    const due = new Date(dueDate + 'T12:00:00');
    const mem = new Date(memoryDate + 'T12:00:00');
    const diffDays = (due.getTime() - mem.getTime()) / 86400000;
    const week = Math.round(40 - diffDays / 7);
    if (week <= 12) return 1;
    if (week <= 27) return 2;
    return 3;
  } catch { return null; }
}

function formatMemoryDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = d.getFullYear() === now.getFullYear()
    ? { month: 'long', day: 'numeric' }
    : { month: 'long', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', opts);
}

function MemoryCard({ memory, index }: { memory: MemoryData; index: number }) {
  const hasPhotos = (memory.mediaUrls || []).length > 0 && memory.type === 'photo';
  const hasVoice = memory.type === 'voice' && (memory.mediaUrls || []).length > 0;
  const thumbnail = memory.mediaThumbnailUrl || (memory.mediaUrls?.[0]);
  const photoCount = (memory.mediaUrls || []).length;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(350)}>
      <Pressable
        onPress={() => {
          tryHaptic();
          router.push({ pathname: '/view-memory', params: { memoryId: memory.id } });
        }}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] }]}
        testID={`memory-card-${memory.id}`}
      >
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>{formatMemoryDate(memory.memoryDate)}</Text>
          <View style={styles.typeChip}>
            <Feather
              name={memory.type === 'photo' ? 'camera' : memory.type === 'voice' ? 'mic' : memory.type === 'pdf' ? 'file-text' : 'edit-3'}
              size={11}
              color={Colors.textSecondary}
            />
          </View>
        </View>

        {memory.title ? (
          <Text style={styles.cardTitle} numberOfLines={2}>{memory.title}</Text>
        ) : null}

        {hasPhotos && thumbnail ? (
          <View style={styles.photoWrap}>
            <Image source={{ uri: thumbnail }} style={styles.photoThumb} resizeMode="cover" />
            {photoCount > 1 && (
              <View style={styles.photoCountBadge}>
                <Text style={styles.photoCountText}>+{photoCount - 1}</Text>
              </View>
            )}
          </View>
        ) : null}

        {hasVoice ? (
          <View style={styles.voiceChip}>
            <Feather name="mic" size={14} color={Colors.textSecondary} />
            <Text style={styles.voiceChipText}>Voice memo</Text>
          </View>
        ) : null}

        {memory.content ? (
          <Text style={styles.cardContent} numberOfLines={hasPhotos || hasVoice ? 2 : 4}>
            {memory.content}
          </Text>
        ) : null}

        {(memory.tags || []).length > 0 ? (
          <View style={styles.tagRow}>
            {(memory.tags || []).slice(0, 3).map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {(memory.tags || []).length > 3 && (
              <Text style={styles.moreTagsText}>+{(memory.tags || []).length - 3} more</Text>
            )}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function TrimesterDivider({ t }: { t: typeof TRIMESTER_INFO[0] }) {
  return (
    <View style={styles.trimesterDivider}>
      <View style={[styles.trimesterLine, { backgroundColor: t.color }]} />
      <View style={styles.trimesterLabelRow}>
        <Text style={styles.trimesterLabel}>{t.label}</Text>
        <Text style={styles.trimesterWeeks}>{t.weeks}</Text>
      </View>
      <Text style={styles.trimesterSub}>{t.sub}</Text>
    </View>
  );
}

const ADD_TYPES = [
  { key: 'text', icon: 'edit-3' as const, label: 'Write a note', color: Colors.accentPeach },
  { key: 'photo', icon: 'camera' as const, label: 'Add a photo', color: Colors.accentPink },
  { key: 'voice', icon: 'mic' as const, label: 'Record voice memo', color: Colors.accentBlue },
  { key: 'pdf', icon: 'file-text' as const, label: 'Attach document', color: '#E8D5F5' },
];

export default function MemoriesScreen() {
  const insets = useSafeAreaInsets();
  const { memories, profile, refreshing, refreshData } = useApp();
  const [showTypeModal, setShowTypeModal] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  useFocusEffect(useCallback(() => {
    refreshData();
  }, []));

  const grouped = useMemo(() => {
    const byTrimester: Record<number, MemoryData[]> = { 1: [], 2: [], 3: [] };
    const unassigned: MemoryData[] = [];

    for (const mem of memories) {
      const t = mem.trimester ?? calcTrimester(mem.memoryDate, profile?.dueDate ?? null);
      if (t === 1 || t === 2 || t === 3) {
        byTrimester[t].push(mem);
      } else {
        unassigned.push(mem);
      }
    }

    const sections: { trimester: typeof TRIMESTER_INFO[0] | null; items: MemoryData[] }[] = [];
    for (const info of TRIMESTER_INFO) {
      if (byTrimester[info.t].length > 0) {
        sections.push({ trimester: info, items: byTrimester[info.t] });
      }
    }
    if (unassigned.length > 0) {
      sections.push({ trimester: null, items: unassigned });
    }
    return sections;
  }, [memories, profile?.dueDate]);

  function openAdd(type: string) {
    setShowTypeModal(false);
    setTimeout(() => router.push({ pathname: '/new-memory', params: { type } }), 200);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memory Bank</Text>
          <Text style={styles.subtitle}>Your pregnancy story, preserved</Text>
        </View>
        <Pressable
          onPress={() => { tryHaptic(); setShowTypeModal(true); }}
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8, transform: [{ scale: 0.92 }] }]}
          testID="add-memory-button"
        >
          <Ionicons name="add" size={26} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomInset + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshData} tintColor={Colors.textSecondary} colors={[Colors.accentPink]} />
        }
      >
        {memories.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="heart-outline" size={44} color={Colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>Your story starts here.</Text>
            <Text style={styles.emptyBody}>
              Capture the moments that matter — a first kick, a morning feeling, a quiet thought. You'll want to look back on these.
            </Text>
            <Pressable
              onPress={() => { tryHaptic(); setShowTypeModal(true); }}
              style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.emptyBtnText}>Add your first memory</Text>
            </Pressable>
          </Animated.View>
        ) : (
          grouped.map((section, si) => (
            <View key={si} style={styles.section}>
              {section.trimester ? (
                <TrimesterDivider t={section.trimester} />
              ) : (
                <View style={styles.trimesterDivider}>
                  <View style={[styles.trimesterLine, { backgroundColor: Colors.border }]} />
                  <Text style={styles.trimesterLabel}>Other Memories</Text>
                </View>
              )}
              {section.items.map((mem, mi) => (
                <MemoryCard key={mem.id} memory={mem} index={si * 20 + mi} />
              ))}
            </View>
          ))
        )}

        {memories.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{memories.length} {memories.length === 1 ? 'memory' : 'memories'} captured</Text>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => { tryHaptic(); setShowTypeModal(true); }}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + webBottomInset + 90 },
          pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] }
        ]}
        testID="fab-add-memory"
      >
        <Ionicons name="add" size={28} color={Colors.textPrimary} />
      </Pressable>

      <Modal
        visible={showTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTypeModal(false)}>
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.modalSheet, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add a Memory</Text>
            <Text style={styles.modalSub}>What would you like to capture?</Text>
            {ADD_TYPES.map(t => (
              <Pressable
                key={t.key}
                onPress={() => { tryHaptic(); openAdd(t.key); }}
                style={({ pressed }) => [styles.typeRow, pressed && { opacity: 0.85 }]}
              >
                <View style={[styles.typeIcon, { backgroundColor: t.color }]}>
                  <Feather name={t.icon} size={20} color={Colors.textPrimary} />
                </View>
                <Text style={styles.typeLabel}>{t.label}</Text>
                <Feather name="chevron-right" size={18} color={Colors.textLight} />
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontFamily: 'Lato_400Regular', fontSize: 14, color: Colors.textSecondary },
  addButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.accentPink, alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 8 },

  trimesterDivider: { marginBottom: 16, marginTop: 8 },
  trimesterLine: { height: 2, borderRadius: 2, marginBottom: 10 },
  trimesterLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  trimesterLabel: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 15, color: Colors.textPrimary },
  trimesterWeeks: { fontFamily: 'Lato_400Regular', fontSize: 12, color: Colors.textSecondary },
  trimesterSub: { fontFamily: 'Lato_400Regular', fontSize: 12, color: Colors.textLight, marginTop: 2 },

  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDate: { fontFamily: 'Lato_400Regular', fontSize: 12, color: Colors.textLight },
  typeChip: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.canvas, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 16,
    color: Colors.textPrimary, marginBottom: 8,
  },
  photoWrap: { position: 'relative', marginBottom: 10 },
  photoThumb: {
    width: '100%', height: 160, borderRadius: 12, backgroundColor: Colors.border,
  },
  photoCountBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
  },
  photoCountText: { fontFamily: 'Lato_700Bold', fontSize: 12, color: Colors.white },
  voiceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentBlue + '40', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, alignSelf: 'flex-start',
  },
  voiceChipText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textSecondary },
  cardContent: { fontFamily: 'Lato_400Regular', fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' },
  tag: { backgroundColor: Colors.canvas, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontFamily: 'Lato_400Regular', fontSize: 11, color: Colors.textSecondary },
  moreTagsText: { fontFamily: 'Lato_400Regular', fontSize: 11, color: Colors.textLight },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 14 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
  },
  emptyTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 20, color: Colors.textPrimary, textAlign: 'center' },
  emptyBody: { fontFamily: 'Lato_400Regular', fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: Colors.accentPink, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 20, marginTop: 8,
  },
  emptyBtnText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: Colors.textPrimary },

  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textLight },

  fab: {
    position: 'absolute', right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accentPink, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 16,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 4 },
  modalSub: { fontFamily: 'Lato_400Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
  typeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  typeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { flex: 1, fontFamily: 'Lato_700Bold', fontSize: 16, color: Colors.textPrimary },
});
