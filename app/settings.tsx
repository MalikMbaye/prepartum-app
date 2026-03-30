import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
  Alert, TextInput, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const FOCUS_AREAS = [
  { key: 'mindset', label: 'Mindset', color: Colors.accentPink },
  { key: 'relationships', label: 'Relationships', color: Colors.accentBlue },
  { key: 'physical', label: 'Physical', color: Colors.accentPeach },
] as const;

const FORMAT_OPTIONS = [
  { key: 'text', label: 'Text' },
  { key: 'voice', label: 'Voice' },
] as const;

const REMINDER_TIME_KEY = 'reminder_time';

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

function formatTime(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  const displayM = m.toString().padStart(2, '0');
  return `${displayH}:${displayM} ${ampm}`;
}

function timeStringToDate(timeStr: string): Date {
  const d = new Date();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const min = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    d.setHours(h, min, 0, 0);
  } else {
    d.setHours(8, 0, 0, 0);
  }
  return d;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, setProfile, signOut, deleteAccount } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(profile?.name || '');
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [dueDateValue, setDueDateValue] = useState('');
  const [dueDateError, setDueDateError] = useState('');
  const [saving, setSaving] = useState(false);

  const notifEnabled = profile?.notificationsEnabled ?? true;
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState<Date>(() => {
    const d = new Date(); d.setHours(8, 0, 0, 0); return d;
  });
  const [reminderTimeStr, setReminderTimeStr] = useState('8:00 AM');

  const focusAreas: string[] = profile?.focusAreas || [];
  const formatPref: string = profile?.preferences?.format_preference || 'text';

  useEffect(() => {
    AsyncStorage.getItem(REMINDER_TIME_KEY).then(val => {
      if (val) {
        setReminderTimeStr(val);
        setReminderTime(timeStringToDate(val));
      }
    });
  }, []);

  function formatDateInput(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    setDueDateValue(formatted);
    setDueDateError('');
  }

  function startEditingDueDate() {
    tryHaptic();
    if (profile?.dueDate) {
      const [y, m, d] = profile.dueDate.split('-');
      setDueDateValue(`${d}/${m}/${y}`);
    } else {
      setDueDateValue('');
    }
    setDueDateError('');
    setEditingDueDate(true);
  }

  async function handleSaveDueDate() {
    if (dueDateValue.length === 10) {
      const parts = dueDateValue.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2024) {
          setDueDateError('Please enter a valid date');
          return;
        }
        const inputDate = new Date(year, month - 1, day);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (inputDate <= today) {
          setDueDateError('Due date must be in the future');
          return;
        }
        const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSaving(true);
        try { await setProfile({ dueDate: formatted }); setEditingDueDate(false); }
        catch (e) { console.error(e); }
        finally { setSaving(false); }
        return;
      }
    }
    if (dueDateValue.length === 0) {
      setSaving(true);
      try { await setProfile({ dueDate: null }); setEditingDueDate(false); }
      catch (e) { console.error(e); }
      finally { setSaving(false); }
      return;
    }
    setDueDateError('Enter a complete date (DD/MM/YYYY)');
  }

  function formatDisplayDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  async function handleSaveName() {
    if (!nameValue.trim()) return;
    setSaving(true);
    try { await setProfile({ name: nameValue.trim() }); setEditingName(false); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleToggleNotifications(value: boolean) {
    tryHaptic();
    try { await setProfile({ notificationsEnabled: value }); }
    catch (e) { console.error(e); }
  }

  async function handleTimeChange(_: any, selected?: Date) {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selected) {
      setReminderTime(selected);
      const str = formatTime(selected);
      setReminderTimeStr(str);
      await AsyncStorage.setItem(REMINDER_TIME_KEY, str);
    }
  }

  async function toggleFocusArea(area: string) {
    tryHaptic();
    const current = profile?.focusAreas || [];
    let next: string[];
    if (current.includes(area)) {
      if (current.length === 1) return;
      next = current.filter(a => a !== area);
    } else {
      next = [...current, area];
    }
    try { await setProfile({ focusAreas: next }); }
    catch (e) { console.error(e); }
  }

  async function handleFormatChange(fmt: string) {
    tryHaptic();
    const preferences = { ...(profile?.preferences || {}), format_preference: fmt };
    try { await setProfile({ preferences }); }
    catch (e) { console.error(e); }
  }

  function handleSignOut() {
    tryHaptic();
    const doSignOut = async () => { await signOut(); router.replace('/'); };
    if (Platform.OS === 'web') {
      doSignOut();
    } else {
      Alert.alert('Sign Out', 'You will need to sign in again when you return.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: doSignOut },
      ]);
    }
  }

  function handleDeleteAccount() {
    tryHaptic();
    const doDelete = async () => {
      try { await deleteAccount(); router.replace('/'); }
      catch (e) { console.error(e); }
    };
    if (Platform.OS === 'web') {
      doDelete();
    } else {
      Alert.alert(
        'Delete Account',
        'This will permanently erase all your data including reflections, memories, and journal entries. This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Everything', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="settings-back">
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── ACCOUNT ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {/* Name */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentPink }]}>
                  <Feather name="user" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Name</Text>
              </View>
              {editingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.inlineInput}
                    value={nameValue}
                    onChangeText={setNameValue}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                    testID="name-input"
                  />
                  <Pressable onPress={handleSaveName} disabled={saving} hitSlop={8}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.textPrimary} />
                  </Pressable>
                  <Pressable onPress={() => setEditingName(false)} hitSlop={8}>
                    <Ionicons name="close-circle-outline" size={24} color={Colors.textLight} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => { setNameValue(profile?.name || ''); setEditingName(true); tryHaptic(); }}
                  style={styles.editRow}
                  hitSlop={8}
                  testID="edit-name"
                >
                  <Text style={styles.rowValue}>{profile?.name || 'Not set'}</Text>
                  <Feather name="edit-2" size={14} color={Colors.textLight} />
                </Pressable>
              )}
            </View>

            <View style={styles.divider} />

            {/* Email */}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentBlue }]}>
                  <Feather name="mail" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Email</Text>
              </View>
              <Text style={styles.rowValue} numberOfLines={1}>
                {(profile as any)?.email || '—'}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Due Date */}
            <View style={[styles.row, editingDueDate && { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 12 }]}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentPeach }]}>
                  <Feather name="calendar" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Due Date</Text>
              </View>
              {editingDueDate ? (
                <View style={styles.dueDateEditWrap}>
                  <View style={styles.editRow}>
                    <TextInput
                      style={styles.inlineInput}
                      value={dueDateValue}
                      onChangeText={formatDateInput}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="number-pad"
                      maxLength={10}
                      autoFocus
                    />
                    <Pressable onPress={handleSaveDueDate} disabled={saving} hitSlop={8}>
                      <Ionicons name="checkmark-circle" size={24} color={Colors.textPrimary} />
                    </Pressable>
                    <Pressable onPress={() => { setEditingDueDate(false); setDueDateError(''); }} hitSlop={8}>
                      <Ionicons name="close-circle-outline" size={24} color={Colors.textLight} />
                    </Pressable>
                  </View>
                  {dueDateError ? <Text style={styles.fieldError}>{dueDateError}</Text> : null}
                </View>
              ) : (
                <Pressable onPress={startEditingDueDate} style={styles.editRow} hitSlop={8}>
                  <Text style={styles.rowValue}>
                    {profile?.dueDate ? formatDisplayDate(profile.dueDate) : 'Not set'}
                  </Text>
                  <Feather name="edit-2" size={14} color={Colors.textLight} />
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── NOTIFICATIONS ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: '#E8E0EC' }]}>
                  <Ionicons name="notifications-outline" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Daily Reminder</Text>
              </View>
              <Switch
                value={notifEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: Colors.border, true: Colors.accentPink }}
                thumbColor={Colors.white}
              />
            </View>

            {notifEnabled && (
              <>
                <View style={styles.divider} />
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    tryHaptic();
                    if (Platform.OS === 'web') return;
                    setShowTimePicker(v => !v);
                  }}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.rowIcon, { backgroundColor: '#E8E0EC' }]}>
                      <Feather name="clock" size={16} color={Colors.textPrimary} />
                    </View>
                    <Text style={styles.rowLabel}>Reminder Time</Text>
                  </View>
                  <View style={styles.editRow}>
                    <Text style={styles.timeValue}>{reminderTimeStr}</Text>
                    {Platform.OS !== 'web' && (
                      <Feather name="chevron-right" size={16} color={Colors.textLight} />
                    )}
                  </View>
                </Pressable>

                {showTimePicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={reminderTime}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    style={Platform.OS === 'ios' ? styles.iosTimePicker : undefined}
                  />
                )}
              </>
            )}
          </View>
        </Animated.View>

        {/* ── PREFERENCES ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(400)}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            {/* Focus Areas */}
            <View style={styles.prefSection}>
              <Text style={styles.prefLabel}>Focus Areas</Text>
              <View style={styles.chipsRow}>
                {FOCUS_AREAS.map(area => {
                  const active = focusAreas.includes(area.key);
                  return (
                    <Pressable
                      key={area.key}
                      onPress={() => toggleFocusArea(area.key)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: active ? area.color : Colors.canvas },
                        active && styles.chipActive,
                        pressed && { opacity: 0.75 },
                      ]}
                      testID={`focus-area-${area.key}`}
                    >
                      <Text style={[styles.chipText, !active && { color: Colors.textSecondary }]}>
                        {area.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Preferred Format */}
            <View style={styles.prefSection}>
              <Text style={styles.prefLabel}>Preferred Response Format</Text>
              <View style={styles.formatRow}>
                {FORMAT_OPTIONS.map(opt => {
                  const active = formatPref === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => handleFormatChange(opt.key)}
                      style={({ pressed }) => [
                        styles.formatBtn,
                        active && styles.formatBtnActive,
                        pressed && { opacity: 0.75 },
                      ]}
                      testID={`format-${opt.key}`}
                    >
                      <Text style={[styles.formatBtnText, active && styles.formatBtnTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── PROFILE ── */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                tryHaptic();
                Alert.alert(
                  'Retake questionnaire?',
                  'This will reset your profile type and let you answer the intake questions again. Your journal, memories, and tasks will not be affected.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Retake',
                      onPress: async () => {
                        await setProfile({ intakeCompleted: false } as any);
                        router.push('/intake' as any);
                      },
                    },
                  ]
                );
              }}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              testID="retake-intake-button"
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentPink }]}>
                  <Ionicons name="refresh-outline" size={16} color={Colors.textPrimary} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Retake questionnaire</Text>
                  <Text style={styles.rowHint}>Update your personalised profile</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textLight} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── ABOUT ── */}
        <Animated.View entering={FadeInDown.delay(340).duration(400)}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentPeach }]}>
                  <Feather name="info" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Version</Text>
              </View>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/privacy-policy')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentBlue }]}>
                  <Feather name="shield" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Privacy Policy</Text>
              </View>
              <Feather name="chevron-right" size={14} color={Colors.textLight} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/terms-of-service')}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentBlue }]}>
                  <Feather name="file-text" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Terms of Service</Text>
              </View>
              <Feather name="chevron-right" size={14} color={Colors.textLight} />
            </Pressable>
          </View>
        </Animated.View>

        {/* ── ACCOUNT ACTIONS ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.dangerSection}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
            testID="sign-out-button"
          >
            <Feather name="log-out" size={18} color={Colors.textSecondary} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
            testID="delete-account-button"
          >
            <Feather name="trash-2" size={18} color={Colors.error} />
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 24,
    marginLeft: 4,
    opacity: 0.6,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  rowHint: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    maxWidth: 160,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentPink,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 110,
  },
  dueDateEditWrap: {
    marginTop: 8,
    gap: 4,
    paddingLeft: 42,
  },
  fieldError: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 58,
  },
  timeValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  iosTimePicker: {
    width: '100%',
    height: 160,
  },
  prefSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  prefLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    borderColor: 'transparent',
  },
  chipText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  formatBtnActive: {
    backgroundColor: Colors.accentPink,
    borderColor: 'transparent',
  },
  formatBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  formatBtnTextActive: {
    color: Colors.textPrimary,
  },
  dangerSection: {
    marginTop: 32,
    gap: 10,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  deleteBtn: {
    backgroundColor: '#FFF0F0',
  },
  signOutText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  deleteText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.error,
  },
});
