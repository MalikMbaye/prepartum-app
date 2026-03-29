import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable,
  Alert, Platform, Image, Modal, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { WheelPicker, WHEEL_ITEM_H, WHEEL_VISIBLE } from '@/components/WheelPicker';

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const WHEEL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WHEEL_YEAR_START = 2022;
const WHEEL_YEARS = Array.from({ length: 8 }, (_, i) => String(WHEEL_YEAR_START + i));

function todayIndices() {
  const d = new Date();
  const yearIdx = Math.max(0, d.getFullYear() - WHEEL_YEAR_START);
  return { dayIdx: d.getDate() - 1, monthIdx: d.getMonth(), yearIdx };
}

function daysInMonth(monthIdx: number, yearIdx: number): number {
  return new Date(WHEEL_YEAR_START + yearIdx, monthIdx + 1, 0).getDate();
}

function indicesToDateStr(dayIdx: number, monthIdx: number, yearIdx: number): string {
  const year = WHEEL_YEAR_START + yearIdx;
  const month = monthIdx + 1;
  const day = dayIdx + 1;
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTHS_LONG[m - 1]} ${d}, ${y}`;
}

function DatePickerModal({
  visible, onClose, onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
}) {
  const inits = todayIndices();
  const [monthIdx, setMonthIdx] = useState(inits.monthIdx);
  const [dayIdx, setDayIdx] = useState(inits.dayIdx);
  const [yearIdx, setYearIdx] = useState(inits.yearIdx);
  const insets = useSafeAreaInsets();
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  const maxDays = daysInMonth(monthIdx, yearIdx);
  const safeDayIdx = Math.min(dayIdx, maxDays - 1);
  const dayItems = useMemo(() => Array.from({ length: maxDays }, (_, i) => String(i + 1)), [maxDays]);

  function handleMonthChange(idx: number) {
    setMonthIdx(idx);
    const newMax = daysInMonth(idx, yearIdx);
    if (dayIdx >= newMax) setDayIdx(newMax - 1);
  }

  function handleYearChange(idx: number) {
    setYearIdx(idx);
    const newMax = daysInMonth(monthIdx, idx);
    if (dayIdx >= newMax) setDayIdx(newMax - 1);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dpS.overlay} onPress={onClose}>
        <View style={[dpS.sheet, { paddingBottom: insets.bottom + webBottom + 16 }]}>
          <View style={dpS.handle} />
          <Text style={dpS.title}>When was this?</Text>
          <View style={dpS.wheelsContainer}>
            <View style={dpS.sharedHighlight} />
            <View style={dpS.wheels}>
              <WheelPicker items={WHEEL_MONTHS} selectedIndex={monthIdx} onSelect={handleMonthChange} flex={2} showHighlight={false} />
              <WheelPicker key={`day-${monthIdx}-${yearIdx}`} items={dayItems} selectedIndex={safeDayIdx} onSelect={setDayIdx} flex={1} showHighlight={false} />
              <WheelPicker items={WHEEL_YEARS} selectedIndex={yearIdx} onSelect={handleYearChange} flex={2} showHighlight={false} />
            </View>
          </View>
          <Pressable onPress={() => { onSelect(indicesToDateStr(safeDayIdx, monthIdx, yearIdx)); onClose(); }} style={dpS.confirm}>
            <Text style={dpS.confirmText}>Set Date</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const dpS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.canvas, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: Colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  wheelsContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, backgroundColor: Colors.canvas },
  sharedHighlight: {
    position: 'absolute',
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    left: 0, right: 0,
    height: WHEEL_ITEM_H,
    backgroundColor: '#F5D6D64D',
    zIndex: 10,
    pointerEvents: 'none',
  },
  wheels: { flexDirection: 'row' },
  confirm: { backgroundColor: Colors.accentPink, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontFamily: 'Lato_700Bold', fontSize: 16, color: Colors.textPrimary },
});

const TAG_SUGGESTIONS = ['first kick','scan','milestone','feeling','doctor visit','craving','dream','love note','gratitude','fear','hope'];

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');

  function addTag(tag: string) {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t)) { setInput(''); return; }
    onChange([...tags, t]); setInput(''); tryHaptic();
  }

  return (
    <View>
      <View style={tS.row}>
        <Feather name="tag" size={15} color={Colors.textSecondary} />
        <TextInput
          style={tS.input} placeholder="Add a tag..." placeholderTextColor={Colors.textLight}
          value={input} onChangeText={setInput}
          onSubmitEditing={() => addTag(input)} returnKeyType="done"
          testID="tag-input"
        />
        {input.length > 0 && <Pressable onPress={() => addTag(input)} style={tS.addBtn}><Text style={tS.addBtnText}>Add</Text></Pressable>}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {TAG_SUGGESTIONS.filter(s => !tags.includes(s)).map(s => (
          <Pressable key={s} onPress={() => addTag(s)} style={tS.pill}><Text style={tS.pillText}>{s}</Text></Pressable>
        ))}
      </ScrollView>
      {tags.length > 0 && (
        <View style={tS.tagRow}>
          {tags.map(tag => (
            <Pressable key={tag} onPress={() => onChange(tags.filter(t => t !== tag))} style={tS.tag}>
              <Text style={tS.tagText}>{tag}</Text>
              <Feather name="x" size={11} color={Colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const tS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },
  input: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 15, color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.accentPink, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  addBtnText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: Colors.textPrimary },
  pill: { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, backgroundColor: Colors.canvas },
  pillText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textSecondary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.accentPink + '60', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textPrimary },
});

export default function NewMemoryScreen() {
  const insets = useSafeAreaInsets();
  const { type: typeParam } = useLocalSearchParams<{ type?: string }>();
  const { addMemory, profile } = useApp();
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBot = Platform.OS === 'web' ? 34 : 0;
  const type = typeParam || 'text';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  });
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [recordingObj, setRecordingObj] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function calcTrimester(): number | null {
    if (!profile?.dueDate) return null;
    try {
      const due = new Date(profile.dueDate + 'T12:00:00');
      const mem = new Date(dateStr + 'T12:00:00');
      const week = Math.round(40 - (due.getTime() - mem.getTime()) / 86400000 / 7);
      if (week <= 12) return 1;
      if (week <= 27) return 2;
      return 3;
    } catch { return null; }
  }

  async function pickPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', allowsMultipleSelection: true, quality: 0.8, selectionLimit: 6,
    });
    if (!result.canceled) { tryHaptic(); setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 6)); }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow camera access.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) { tryHaptic(); setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 6)); }
  }

  async function startRecording() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Please allow microphone access.'); return; }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecordingObj(recording); setIsRecording(true); setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
      tryHaptic();
    } catch (e) { Alert.alert('Error', 'Could not start recording.'); }
  }

  async function stopRecording() {
    if (!recordingObj) return;
    clearInterval(timerRef.current!);
    setIsRecording(false);
    try {
      await recordingObj.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingObj.getURI();
      setRecordingObj(null);
      tryHaptic();
      if (uri) {
        if (Platform.OS !== 'web' && FileSystem.documentDirectory) {
          const dir = FileSystem.documentDirectory + 'voice_memos/';
          const info = await FileSystem.getInfoAsync(dir);
          if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          const dest = dir + `voice_${Date.now()}.m4a`;
          await FileSystem.moveAsync({ from: uri, to: dest });
          setVoiceUri(dest);
        } else {
          setVoiceUri(uri);
        }
      }
    } catch (e) { console.error('Stop recording error:', e); }
  }

  async function togglePlay() {
    if (!voiceUri) return;
    try {
      if (sound && isPlaying) { await sound.pauseAsync(); setIsPlaying(false); return; }
      if (sound) { await sound.playAsync(); setIsPlaying(true); return; }
      const { sound: s } = await Audio.Sound.createAsync({ uri: voiceUri }, { shouldPlay: true });
      setSound(s); setIsPlaying(true);
      s.setOnPlaybackStatusUpdate(status => { if (status.isLoaded && status.didJustFinish) setIsPlaying(false); });
    } catch (e) { console.error('Playback error:', e); }
  }

  function discardVoice() {
    sound?.unloadAsync(); setSound(null);
    setVoiceUri(null); setRecordSeconds(0);
  }

  async function save() {
    if (type === 'text' && !content.trim() && !title.trim()) { Alert.alert('Empty Memory', 'Please write something before saving.'); return; }
    if (type === 'photo' && photos.length === 0) { Alert.alert('No Photos', 'Please add at least one photo.'); return; }
    if (type === 'voice' && !voiceUri) { Alert.alert('No Recording', 'Please record a voice memo first.'); return; }

    setSaving(true);
    try {
      await addMemory({
        type,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        memoryDate: dateStr,
        tags,
        mediaUrls: type === 'photo' ? photos : voiceUri ? [voiceUri] : [],
        mediaThumbnailUrl: type === 'photo' && photos.length > 0 ? photos[0] : undefined,
        trimester: calcTrimester() ?? undefined,
      });
      tryHaptic();
      router.back();
    } catch { Alert.alert('Error', 'Could not save memory. Please try again.'); }
    finally { setSaving(false); }
  }

  const typeColor = type === 'photo' ? Colors.accentPink : type === 'voice' ? Colors.accentBlue : Colors.accentPeach;
  const typeIcon = type === 'photo' ? 'camera' : type === 'voice' ? 'mic' : 'edit-3';
  const typeLabel = type === 'photo' ? 'Photo Memory' : type === 'voice' ? 'Voice Memo' : 'Written Memory';
  const mins = Math.floor(recordSeconds / 60);
  const secs = recordSeconds % 60;

  return (
    <View style={[s.container, { paddingTop: insets.top + webTop }]}>
      <View style={s.nav}>
        <Pressable onPress={() => router.back()} style={s.navBtn} testID="back-button">
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={[s.typePill, { backgroundColor: typeColor }]}>
          <Feather name={typeIcon as any} size={13} color={Colors.textPrimary} />
          <Text style={s.typePillText}>{typeLabel}</Text>
        </View>
        <Pressable onPress={save} disabled={saving} style={s.saveBtn} testID="save-memory-button">
          {saving ? <ActivityIndicator size="small" color={Colors.textPrimary} /> : <Text style={s.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[s.body, { paddingBottom: insets.bottom + webBot + 40 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={s.sec}>
          <TextInput
            style={s.titleInput} placeholder="Give this memory a title..."
            placeholderTextColor={Colors.textLight} value={title} onChangeText={setTitle}
            maxLength={80} returnKeyType="next" testID="title-input"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(50).duration(350)} style={s.sec}>
          <Pressable onPress={() => setShowDatePicker(true)} style={s.dateRow} testID="date-picker-button">
            <Feather name="calendar" size={15} color={Colors.textSecondary} />
            <Text style={s.dateText}>{formatDisplayDate(dateStr)}</Text>
            <Feather name="chevron-down" size={15} color={Colors.textLight} />
          </Pressable>
        </Animated.View>

        {type === 'text' && (
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={s.sec}>
            <TextInput
              style={s.contentInput} placeholder="Write your memory here..." placeholderTextColor={Colors.textLight}
              value={content} onChangeText={setContent} multiline textAlignVertical="top" testID="content-input"
            />
          </Animated.View>
        )}

        {type === 'photo' && (
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={s.sec}>
            {photos.length === 0 ? (
              <View style={s.photoEmpty}>
                <Feather name="image" size={36} color={Colors.textLight} />
                <Text style={s.photoEmptyText}>No photos yet</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {photos.map((uri, i) => (
                  <View key={i} style={s.photoWrap}>
                    <Image source={{ uri }} style={s.photoImg} />
                    <Pressable onPress={() => setPhotos(p => p.filter((_, idx) => idx !== i))} style={s.photoRemove}>
                      <Ionicons name="close-circle" size={22} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={s.photoActions}>
              <Pressable onPress={pickPhotos} style={[s.photoBtn, { backgroundColor: Colors.accentPink }]}>
                <Feather name="image" size={15} color={Colors.textPrimary} />
                <Text style={s.photoBtnText}>Library</Text>
              </Pressable>
              {Platform.OS !== 'web' && (
                <Pressable onPress={takePhoto} style={[s.photoBtn, { backgroundColor: Colors.accentPeach }]}>
                  <Feather name="camera" size={15} color={Colors.textPrimary} />
                  <Text style={s.photoBtnText}>Camera</Text>
                </Pressable>
              )}
            </View>
            <TextInput
              style={s.captionInput} placeholder="Add a caption..." placeholderTextColor={Colors.textLight}
              value={content} onChangeText={setContent} multiline textAlignVertical="top" testID="caption-input"
            />
          </Animated.View>
        )}

        {type === 'voice' && (
          <Animated.View entering={FadeInDown.delay(100).duration(350)} style={[s.sec, s.voiceSec]}>
            {!voiceUri ? (
              <View style={s.recordArea}>
                <Text style={s.timerText}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</Text>
                {isRecording && (
                  <View style={s.recordingRow}>
                    <View style={s.recDot} />
                    <Text style={s.recordingLabel}>Recording...</Text>
                  </View>
                )}
                <Pressable
                  onPress={isRecording ? stopRecording : startRecording}
                  style={[s.recBtn, isRecording ? s.recBtnActive : s.recBtnIdle]}
                  testID="record-button"
                >
                  <Feather name={isRecording ? 'square' : 'mic'} size={32} color="#fff" />
                </Pressable>
                <Text style={s.recHint}>{isRecording ? 'Tap to stop' : 'Tap to record'}</Text>
              </View>
            ) : (
              <View style={s.playerArea}>
                <View style={s.playerHeader}>
                  <Feather name="check-circle" size={18} color="#4CAF50" />
                  <Text style={s.playerTitle}>Voice memo recorded</Text>
                </View>
                <Text style={s.playerDuration}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</Text>
                <View style={s.playerBtns}>
                  <Pressable onPress={togglePlay} style={[s.playerBtn, { backgroundColor: Colors.accentBlue }]}>
                    <Feather name={isPlaying ? 'pause' : 'play'} size={18} color={Colors.textPrimary} />
                    <Text style={s.playerBtnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
                  </Pressable>
                  <Pressable onPress={discardVoice} style={[s.playerBtn, { backgroundColor: Colors.border }]}>
                    <Feather name="trash-2" size={16} color={Colors.textSecondary} />
                    <Text style={s.playerBtnText}>Re-record</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={s.captionInput} placeholder="Add a note about this recording..."
                  placeholderTextColor={Colors.textLight} value={content} onChangeText={setContent}
                  multiline textAlignVertical="top" testID="voice-note-input"
                />
              </View>
            )}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(150).duration(350)} style={s.sec}>
          <Text style={s.secLabel}>Tags</Text>
          <TagInput tags={tags} onChange={setTags} />
        </Animated.View>
      </ScrollView>

      <DatePickerModal visible={showDatePicker} onClose={() => setShowDatePicker(false)} onSelect={setDateStr} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBtn: { padding: 4, width: 44 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  typePillText: { fontFamily: 'Lato_700Bold', fontSize: 13, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.accentPink, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 14, minWidth: 60, alignItems: 'center' },
  saveBtnText: { fontFamily: 'Lato_700Bold', fontSize: 15, color: Colors.textPrimary },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  sec: { marginBottom: 24 },
  secLabel: { fontFamily: 'Lato_700Bold', fontSize: 11, color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  titleInput: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: Colors.textPrimary, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  dateText: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 15, color: Colors.textPrimary },
  contentInput: { fontFamily: 'Lato_400Regular', fontSize: 16, color: Colors.textPrimary, lineHeight: 26, minHeight: 200, paddingTop: 8 },
  photoEmpty: { alignItems: 'center', paddingVertical: 48, gap: 12, backgroundColor: Colors.white, borderRadius: 16 },
  photoEmptyText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: Colors.textSecondary },
  photoWrap: { position: 'relative', marginRight: 10 },
  photoImg: { width: 130, height: 130, borderRadius: 12 },
  photoRemove: { position: 'absolute', top: -8, right: -8 },
  photoActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flex: 1, justifyContent: 'center' },
  photoBtnText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: Colors.textPrimary },
  captionInput: { fontFamily: 'Lato_400Regular', fontSize: 15, color: Colors.textPrimary, lineHeight: 24, paddingTop: 12, minHeight: 80 },
  voiceSec: { backgroundColor: Colors.white, borderRadius: 20, padding: 20 },
  recordArea: { alignItems: 'center', gap: 20, paddingVertical: 20 },
  timerText: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 48, color: Colors.textPrimary },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' },
  recordingLabel: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#E53935' },
  recBtn: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  recBtnIdle: { backgroundColor: Colors.accentPink },
  recBtnActive: { backgroundColor: '#E53935' },
  recHint: { fontFamily: 'Lato_400Regular', fontSize: 13, color: Colors.textSecondary },
  playerArea: { gap: 12 },
  playerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerTitle: { fontFamily: 'Lato_700Bold', fontSize: 16, color: Colors.textPrimary },
  playerDuration: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, color: Colors.textPrimary },
  playerBtns: { flexDirection: 'row', gap: 12 },
  playerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flex: 1, justifyContent: 'center' },
  playerBtnText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: Colors.textPrimary },
});
