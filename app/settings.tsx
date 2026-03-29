import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert, TextInput, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (inputDate <= today) {
          setDueDateError('Due date must be in the future');
          return;
        }
        const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSaving(true);
        try {
          await setProfile({ dueDate: formatted });
          setEditingDueDate(false);
        } catch (e) {
          console.error(e);
        } finally {
          setSaving(false);
        }
        return;
      }
    }
    if (dueDateValue.length === 0) {
      setSaving(true);
      try {
        await setProfile({ dueDate: null });
        setEditingDueDate(false);
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
      return;
    }
    setDueDateError('Enter a complete date (DD/MM/YYYY)');
  }

  function formatDisplayDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const onboardingIncomplete = !profile?.onboardingCompleted;

  async function handleSaveName() {
    if (!nameValue.trim()) return;
    setSaving(true);
    try {
      await setProfile({ name: nameValue.trim() });
      setEditingName(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    tryHaptic();
    const doSignOut = async () => {
      await signOut();
      router.replace('/');
    };
    if (Platform.OS === 'web') {
      doSignOut();
    } else {
      Alert.alert(
        'Sign Out',
        'You will need to sign in again when you return.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', onPress: doSignOut },
        ]
      );
    }
  }

  function handleDeleteAccount() {
    tryHaptic();
    const doDelete = async () => {
      try {
        await deleteAccount();
        router.replace('/');
      } catch (e) {
        console.error(e);
      }
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

  async function handleToggleNotifications(value: boolean) {
    tryHaptic();
    try {
      await setProfile({ notificationsEnabled: value });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {onboardingIncomplete && (
          <Animated.View entering={FadeInDown.delay(50).duration(400)}>
            <Pressable
              onPress={() => {
                tryHaptic();
                router.push('/onboarding');
              }}
              style={({ pressed }) => [styles.onboardingBanner, pressed && { opacity: 0.9 }]}
              testID="complete-onboarding"
            >
              <View style={styles.onboardingIconWrap}>
                <Ionicons name="sparkles" size={20} color={Colors.textPrimary} />
              </View>
              <View style={styles.onboardingTextWrap}>
                <Text style={styles.onboardingTitle}>Complete Your Setup</Text>
                <Text style={styles.onboardingDesc}>Personalize your experience with focus areas and preferences</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textPrimary} />
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
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
                    style={styles.nameInput}
                    value={nameValue}
                    onChangeText={setNameValue}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <Pressable onPress={handleSaveName} disabled={saving} hitSlop={8}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.textPrimary} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => { setNameValue(profile?.name || ''); setEditingName(true); }}
                  style={styles.editRow}
                  hitSlop={8}
                >
                  <Text style={styles.rowValue}>{profile?.name || 'Not set'}</Text>
                  <Feather name="edit-2" size={14} color={Colors.textLight} />
                </Pressable>
              )}
            </View>

            <View style={styles.divider} />

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
                      style={styles.nameInput}
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
                  {dueDateError ? <Text style={styles.dueDateError}>{dueDateError}</Text> : null}
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

            <View style={styles.divider} />

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: Colors.accentBlue }]}>
                  <Feather name="target" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Focus Areas</Text>
              </View>
              <Text style={styles.rowValue}>
                {profile?.focusAreas?.length ? `${profile.focusAreas.length} selected` : 'None'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.rowIcon, { backgroundColor: '#E8E0EC' }]}>
                  <Ionicons name="notifications-outline" size={16} color={Colors.textPrimary} />
                </View>
                <Text style={styles.rowLabel}>Daily Reminders</Text>
              </View>
              <Switch
                value={profile?.notificationsEnabled ?? true}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: Colors.border, true: Colors.accentPink }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
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

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
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
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.dangerSection}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.dangerButton, styles.signOutButton, pressed && { opacity: 0.7 }]}
          >
            <Feather name="log-out" size={18} color={Colors.textSecondary} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            style={({ pressed }) => [styles.dangerButton, styles.deleteButton, pressed && { opacity: 0.7 }]}
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
    paddingBottom: 60,
  },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentPink + '30',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.accentPink,
  },
  onboardingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTextWrap: {
    flex: 1,
  },
  onboardingTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  onboardingDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentPink,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 120,
  },
  dueDateEditWrap: {
    marginTop: 8,
    gap: 4,
    paddingLeft: 42,
  },
  dueDateError: {
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
  dangerSection: {
    marginTop: 32,
    gap: 10,
    marginBottom: 40,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
  },
  signOutButton: {
    backgroundColor: Colors.white,
  },
  signOutText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: '#FFF0F0',
  },
  deleteText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.error,
  },
});
