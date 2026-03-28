import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Alert, Image, Dimensions, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const { width: SCREEN_W } = Dimensions.get('window');

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function trimesterLabel(t: number | null): string {
  if (t === 1) return 'First Trimester';
  if (t === 2) return 'Second Trimester';
  if (t === 3) return 'Third Trimester';
  return '';
}

function trimesterColor(t: number | null): string {
  if (t === 1) return Colors.accentPeach;
  if (t === 2) return Colors.accentBlue;
  if (t === 3) return Colors.accentPink;
  return Colors.border;
}

function PhotoGallery({ uris }: { uris: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const imgW = Math.min(SCREEN_W - 40, 420);

  if (uris.length === 0) return null;

  return (
    <View style={gS.container}>
      <Image source={{ uri: uris[activeIndex] }} style={[gS.main, { width: imgW, height: imgW * 0.75 }]} resizeMode="cover" />
      {uris.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={gS.thumbRow}>
          {uris.map((uri, i) => (
            <Pressable key={i} onPress={() => { tryHaptic(); setActiveIndex(i); }}>
              <Image source={{ uri }} style={[gS.thumb, i === activeIndex && gS.thumbActive]} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const gS = StyleSheet.create({
  container: { marginBottom: 16 },
  main: { borderRadius: 16, backgroundColor: Colors.border, alignSelf: 'center' },
  thumbRow: { marginTop: 10 },
  thumb: { width: 64, height: 64, borderRadius: 10, marginRight: 8, opacity: 0.6 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: Colors.textPrimary },
});

function AudioPlayer({ uri }: { uri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let s: Audio.Sound | null = null;
    (async () => {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false },
          status => {
            if (status.isLoaded) {
              setPosition(status.positionMillis || 0);
              setDuration(status.durationMillis || 0);
              setIsPlaying(!!status.isPlaying);
              if (status.didJustFinish) { setIsPlaying(false); setPosition(0); }
            }
          }
        );
        s = newSound;
        setSound(newSound);
        setLoaded(true);
      } catch { setError(true); }
    })();
    return () => { s?.unloadAsync(); };
  }, [uri]);

  if (error) return (
    <View style={aS.errorWrap}>
      <Feather name="alert-circle" size={18} color={Colors.textLight} />
      <Text style={aS.errorText}>Voice memo unavailable on this device</Text>
    </View>
  );

  async function toggle() {
    if (!sound || !loaded) return;
    tryHaptic();
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      if (position >= duration && duration > 0) await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  }

  function fmtMs(ms: number) {
    const total = Math.floor(ms / 1000);
    return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
  }

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={aS.container}>
      <Pressable onPress={toggle} style={[aS.playBtn, { opacity: loaded ? 1 : 0.5 }]}>
        <Feather name={isPlaying ? 'pause' : 'play'} size={24} color={Colors.textPrimary} />
      </Pressable>
      <View style={aS.right}>
        <View style={aS.track}>
          <View style={[aS.fill, { width: `${progress * 100}%` as any }]} />
        </View>
        <View style={aS.times}>
          <Text style={aS.time}>{fmtMs(position)}</Text>
          <Text style={aS.time}>{fmtMs(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const aS = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.accentBlue + '40', borderRadius: 16, padding: 16, marginBottom: 16 },
  playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center' },
  right: { flex: 1, gap: 6 },
  track: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: Colors.textPrimary, borderRadius: 2 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontFamily: 'Lato_400Regular', fontSize: 12, color: Colors.textSecondary },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 16 },
  errorText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: Colors.textSecondary },
});

export default function ViewMemoryScreen() {
  const insets = useSafeAreaInsets();
  const { memoryId } = useLocalSearchParams<{ memoryId: string }>();
  const { memories, deleteMemory } = useApp();
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBot = Platform.OS === 'web' ? 34 : 0;

  const memory = memories.find(m => m.id === memoryId);

  async function handleDelete() {
    tryHaptic();
    Alert.alert('Delete Memory', 'Are you sure you want to delete this memory? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteMemory(memoryId);
            router.back();
          } catch { Alert.alert('Error', 'Could not delete memory.'); }
        }
      }
    ]);
  }

  if (!memory) {
    return (
      <View style={[vs.container, { paddingTop: insets.top + webTop, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={vs.notFoundText}>Memory not found</Text>
        <Pressable onPress={() => router.back()} style={vs.backBtn}>
          <Text style={vs.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const hasPhotos = memory.type === 'photo' && (memory.mediaUrls || []).length > 0;
  const hasVoice = memory.type === 'voice' && (memory.mediaUrls || []).length > 0;
  const tLabel = trimesterLabel(memory.trimester);
  const tColor = trimesterColor(memory.trimester);

  return (
    <View style={[vs.container, { paddingTop: insets.top + webTop }]}>
      <View style={vs.nav}>
        <Pressable onPress={() => router.back()} style={vs.navBtn} testID="back-button">
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Pressable onPress={handleDelete} style={vs.deleteBtn} testID="delete-memory-button">
          <Feather name="trash-2" size={18} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[vs.body, { paddingBottom: insets.bottom + webBot + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(350)}>
          <View style={vs.meta}>
            <Text style={vs.dateText}>{formatFullDate(memory.memoryDate || memory.createdAt)}</Text>
            {tLabel ? (
              <View style={[vs.trimesterBadge, { backgroundColor: tColor }]}>
                <Text style={vs.trimesterBadgeText}>{tLabel}</Text>
              </View>
            ) : null}
          </View>

          {memory.title ? (
            <Text style={vs.title}>{memory.title}</Text>
          ) : null}

          {hasPhotos && <PhotoGallery uris={memory.mediaUrls || []} />}

          {hasVoice && memory.mediaUrls?.[0] ? (
            <AudioPlayer uri={memory.mediaUrls[0]} />
          ) : null}

          {memory.content ? (
            <Text style={vs.content}>{memory.content}</Text>
          ) : null}

          {(memory.tags || []).length > 0 ? (
            <View style={vs.tagRow}>
              {(memory.tags || []).map((tag, i) => (
                <View key={i} style={vs.tag}>
                  <Feather name="tag" size={11} color={Colors.textSecondary} />
                  <Text style={vs.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {memory.createdAt ? (
            <Text style={vs.savedAt}>
              Saved {new Date(memory.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const vs = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  navBtn: { padding: 4, width: 44 },
  deleteBtn: { padding: 8, width: 44, alignItems: 'center' },
  body: { paddingHorizontal: 20, paddingTop: 24 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 },
  dateText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textSecondary, flex: 1 },
  trimesterBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  trimesterBadgeText: { fontFamily: 'Lato_700Bold', fontSize: 12, color: Colors.textPrimary },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.textPrimary, marginBottom: 20, lineHeight: 38 },
  content: { fontFamily: 'Lato_400Regular', fontSize: 17, color: Colors.textPrimary, lineHeight: 28, marginBottom: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.accentPink + '40', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textSecondary },
  savedAt: { fontFamily: 'Lato_400Regular', fontSize: 12, color: Colors.textLight, textAlign: 'center' },
  notFoundText: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18, color: Colors.textSecondary, marginBottom: 20 },
  backBtn: { backgroundColor: Colors.accentPink, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  backBtnText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: Colors.textPrimary },
});
