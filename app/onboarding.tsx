import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
  Platform, KeyboardAvoidingView, Switch
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FocusArea } from '@/lib/types';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [preferredTime, setPreferredTime] = useState('9:00 AM');
  const [dateError, setDateError] = useState('');

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  function toggleFocus(area: FocusArea) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  }

  const validateDueDate = useCallback((dateStr: string): boolean => {
    if (!dateStr || dateStr.length < 10) return true;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2024) return false;
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate <= today) {
      setDateError('Due date must be in the future');
      return false;
    }
    setDateError('');
    return true;
  }, []);

  async function complete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    let formattedDueDate: string | undefined;
    if (dueDate) {
      const parts = dueDate.split('/');
      if (parts.length === 3) {
        formattedDueDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }
    await setProfile({
      name: name.trim() || 'Mama',
      dueDate: formattedDueDate || null,
      focusAreas: focusAreas.length > 0 ? focusAreas : ['mindset', 'relationships', 'physical'],
      notificationsEnabled,
      onboardingCompleted: true,
    });
    router.replace('/(tabs)');
  }

  function next() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1 && dueDate.length === 10 && !validateDueDate(dueDate)) {
      return;
    }
    if (step < 4) setStep(step + 1);
    else complete();
  }

  function back() {
    if (step > 0) {
      setStep(step - 1);
      setDateError('');
    }
  }

  function formatDateInput(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    setDueDate(formatted);
    setDateError('');
  }

  const timeOptions = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '8:00 PM'];

  const canProceed =
    step === 0 ||
    step === 3 ||
    step === 4 ||
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && focusAreas.length > 0);

  const ctaLabel =
    step === 0 ? 'Get Started' :
    step === 4 ? 'Begin' :
    'Continue';

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset, paddingBottom: insets.bottom + webBottomInset }]}>
      {step > 0 && step < 4 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <Pressable onPress={back} style={styles.backButton} hitSlop={12}>
            <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.progressContainer}>
            {[1, 2, 3].map(i => (
              <View key={i} style={[styles.progressBar, i <= step && styles.progressBarActive]} />
            ))}
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>
      )}

      {step === 4 && (
        <Pressable onPress={back} style={[styles.backButton, { marginTop: 8, marginLeft: 0 }]} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={Colors.textPrimary} />
        </Pressable>
      )}

      <KeyboardAvoidingView
        style={styles.contentWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.welcomeContainer}>
              <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.logoMark}>
                <View style={styles.logoInner}>
                  <Ionicons name="leaf-outline" size={32} color={Colors.textPrimary} />
                </View>
              </Animated.View>

              <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.welcomeBrand}>
                PrePartum
              </Animated.Text>

              <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.welcomeTextBlock}>
                <Text style={styles.welcomeHeadline}>
                  Every pregnancy app{'\n'}prepares you for the baby.
                </Text>
                <View style={styles.dividerLine} />
                <Text style={styles.welcomeHero}>
                  PrePartum prepares YOU.
                </Text>
              </Animated.View>

              <Animated.Text entering={FadeInUp.delay(900).duration(600)} style={styles.welcomeTagline}>
                5 minutes a day to prepare for a lifetime.
              </Animated.Text>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Let's personalize{'\n'}your journey</Text>
              <Text style={styles.stepBody}>We'll use this to make your experience feel like yours.</Text>

              <Text style={styles.inputLabel}>What should we call you?</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor={Colors.textLight}
                autoFocus
                autoCapitalize="words"
                testID="name-input"
              />

              <Text style={[styles.inputLabel, { marginTop: 28 }]}>When is your due date?</Text>
              <TextInput
                style={[styles.input, dateError ? styles.inputError : null]}
                value={dueDate}
                onChangeText={formatDateInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                maxLength={10}
                testID="duedate-input"
              />
              {dateError ? (
                <Text style={styles.errorText}>{dateError}</Text>
              ) : (
                <Text style={styles.hintText}>Optional — skip if you prefer</Text>
              )}
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What matters most{'\n'}to you right now?</Text>
              <Text style={styles.stepBody}>Select all that apply</Text>

              <Pressable
                onPress={() => toggleFocus('mindset')}
                style={[styles.focusCard, focusAreas.includes('mindset') && { borderColor: Colors.accentPink, backgroundColor: '#FFF0EF' }]}
                testID="focus-mindset"
              >
                <View style={[styles.focusIcon, { backgroundColor: Colors.accentPink }]}>
                  <Ionicons name="sparkles-outline" size={22} color={Colors.textPrimary} />
                </View>
                <View style={styles.focusTextWrap}>
                  <Text style={styles.focusTitle}>Mindset</Text>
                  <Text style={styles.focusDesc}>Managing anxiety, building confidence, processing emotions</Text>
                </View>
                <View style={[styles.checkCircle, focusAreas.includes('mindset') && styles.checkCircleActive]}>
                  {focusAreas.includes('mindset') && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => toggleFocus('relationships')}
                style={[styles.focusCard, focusAreas.includes('relationships') && { borderColor: Colors.accentBlue, backgroundColor: '#EEF5FA' }]}
                testID="focus-relationships"
              >
                <View style={[styles.focusIcon, { backgroundColor: Colors.accentBlue }]}>
                  <Ionicons name="people-outline" size={22} color={Colors.textPrimary} />
                </View>
                <View style={styles.focusTextWrap}>
                  <Text style={styles.focusTitle}>Relationships</Text>
                  <Text style={styles.focusDesc}>Partner dynamics, family boundaries, asking for support</Text>
                </View>
                <View style={[styles.checkCircle, focusAreas.includes('relationships') && styles.checkCircleActive]}>
                  {focusAreas.includes('relationships') && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => toggleFocus('physical')}
                style={[styles.focusCard, focusAreas.includes('physical') && { borderColor: Colors.accentPeach, backgroundColor: '#FFF5F0' }]}
                testID="focus-physical"
              >
                <View style={[styles.focusIcon, { backgroundColor: Colors.accentPeach }]}>
                  <Ionicons name="body-outline" size={22} color={Colors.textPrimary} />
                </View>
                <View style={styles.focusTextWrap}>
                  <Text style={styles.focusTitle}>Physical</Text>
                  <Text style={styles.focusDesc}>Body changes, energy management, preparing for birth</Text>
                </View>
                <View style={[styles.checkCircle, focusAreas.includes('physical') && styles.checkCircleActive]}>
                  {focusAreas.includes('physical') && (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  )}
                </View>
              </Pressable>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Stay on track</Text>
              <Text style={styles.stepBody}>A daily reminder helps build your practice</Text>

              <View style={styles.notifCard}>
                <View style={styles.notifIconWrap}>
                  <Ionicons name="notifications-outline" size={28} color={Colors.textPrimary} />
                </View>
                <View style={styles.notifToggleRow}>
                  <Text style={styles.notifLabel}>Enable daily reminders</Text>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={(val) => {
                      setNotificationsEnabled(val);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    trackColor={{ false: Colors.border, true: Colors.accentPink }}
                    thumbColor="#FFF"
                    testID="notif-toggle"
                  />
                </View>
              </View>

              {notificationsEnabled && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={[styles.inputLabel, { marginTop: 24 }]}>Preferred time</Text>
                  <View style={styles.timeGrid}>
                    {timeOptions.map(t => (
                      <Pressable
                        key={t}
                        onPress={() => {
                          setPreferredTime(t);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={[styles.timeChip, preferredTime === t && styles.timeChipActive]}
                      >
                        <Text style={[styles.timeChipText, preferredTime === t && styles.timeChipTextActive]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              <Pressable onPress={next} style={styles.skipLink}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            </Animated.View>
          )}

          {step === 4 && (
            <Animated.View entering={FadeIn.duration(700)} style={styles.readyContainer}>
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.readyCheckWrap}>
                <View style={styles.readyCheckOuter}>
                  <View style={styles.readyCheckInner}>
                    <Ionicons name="checkmark" size={36} color={Colors.textPrimary} />
                  </View>
                </View>
              </Animated.View>

              <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.readyTitle}>
                You're ready, {name || 'Mama'}
              </Animated.Text>

              <Animated.Text entering={FadeInDown.delay(600).duration(500)} style={styles.readySubtitle}>
                Your first prompt is waiting.
              </Animated.Text>

              <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.readyDetailRow}>
                <View style={styles.readyDetailCard}>
                  <Ionicons name="leaf-outline" size={18} color={Colors.textSecondary} />
                  <Text style={styles.readyDetailText}>Daily reflections</Text>
                </View>
                <View style={styles.readyDetailCard}>
                  <Ionicons name="heart-outline" size={18} color={Colors.textSecondary} />
                  <Text style={styles.readyDetailText}>Memory bank</Text>
                </View>
                <View style={styles.readyDetailCard}>
                  <Ionicons name="checkbox-outline" size={18} color={Colors.textSecondary} />
                  <Text style={styles.readyDetailText}>Preparation tasks</Text>
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomSection}>
        <Pressable
          onPress={next}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.ctaButton,
            !canProceed && styles.ctaButtonDisabled,
            pressed && canProceed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          testID="onboarding-cta"
        >
          <Text style={[styles.ctaText, !canProceed && { opacity: 0.5 }]}>
            {ctaLabel}
          </Text>
        </Pressable>

        {step === 0 && (
          <Animated.Text entering={FadeInUp.delay(1100).duration(500)} style={styles.bottomTagline}>
            5 minutes a day to prepare for a lifetime.
          </Animated.Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  progressBar: {
    height: 3,
    width: 48,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
  },
  progressBarActive: {
    backgroundColor: Colors.textPrimary,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  logoMark: {
    marginBottom: 20,
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accentPink,
  },
  welcomeBrand: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    letterSpacing: 4,
    textTransform: 'uppercase' as const,
    color: Colors.textSecondary,
    marginBottom: 40,
  },
  welcomeTextBlock: {
    alignItems: 'center',
    marginBottom: 48,
  },
  welcomeHeadline: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.accentPink,
    marginBottom: 20,
  },
  welcomeHero: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
  },
  welcomeTagline: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  stepContainer: {
    paddingTop: 8,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
    lineHeight: 38,
  },
  stepBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 28,
  },
  inputLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  input: {
    fontFamily: 'Lato_400Regular',
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  hintText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 10,
  },
  errorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.error,
    marginTop: 10,
  },

  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  focusIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  focusTextWrap: {
    flex: 1,
  },
  focusTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  focusDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkCircleActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },

  notifCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  notifIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  notifToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  notifLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: '#FFF0EF',
    borderColor: Colors.accentPink,
  },
  timeChipText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: Colors.textPrimary,
    fontFamily: 'Lato_700Bold',
  },
  skipLink: {
    alignSelf: 'center',
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textLight,
    textDecorationLine: 'underline' as const,
  },

  readyContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  readyCheckWrap: {
    marginBottom: 32,
  },
  readyCheckOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyCheckInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  readySubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 17,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  readyDetailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  readyDetailCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  readyDetailText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  bottomSection: {
    paddingBottom: 16,
  },
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentPink,
    borderRadius: 20,
    paddingVertical: 18,
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.border,
  },
  ctaText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
  bottomTagline: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 14,
  },
});
