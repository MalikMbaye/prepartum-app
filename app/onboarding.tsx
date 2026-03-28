import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
  Platform, KeyboardAvoidingView, Switch, NativeSyntheticEvent, NativeScrollEvent
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FocusArea } from '@/lib/types';

const TOTAL_STEPS = 5;

const ITEM_H = 48;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const now = new Date();
const YEARS = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2].map(String);

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
}

function WheelPicker({ items, selectedIndex, onSelect, flex = 1 }: WheelPickerProps) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  function snap(y: number) {
    const idx = Math.max(0, Math.min(Math.round(y / ITEM_H), items.length - 1));
    ref.current?.scrollTo({ y: idx * ITEM_H, animated: true });
    if (idx !== selectedIndex) {
      try { Haptics.selectionAsync(); } catch {}
      onSelect(idx);
    }
  }

  return (
    <View style={[wheelStyles.container, { flex }]}>
      <View pointerEvents="none" style={wheelStyles.highlight} />
      <View pointerEvents="none" style={wheelStyles.lineTop} />
      <View pointerEvents="none" style={wheelStyles.lineBottom} />
      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => snap(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => snap(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIndex);
          return (
            <View key={i} style={wheelStyles.item}>
              <Text style={[
                wheelStyles.itemText,
                dist === 0 && wheelStyles.itemTextSelected,
                { opacity: dist === 0 ? 1 : dist === 1 ? 0.55 : 0.25 },
              ]}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    height: WHEEL_H,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * Math.floor(VISIBLE / 2),
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: Colors.accentPink + '35',
    borderRadius: 12,
    zIndex: 2,
  },
  lineTop: {
    position: 'absolute',
    top: ITEM_H * Math.floor(VISIBLE / 2),
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: Colors.accentPink + '90',
    zIndex: 3,
  },
  lineBottom: {
    position: 'absolute',
    top: ITEM_H * Math.floor(VISIBLE / 2) + ITEM_H - 1,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: Colors.accentPink + '90',
    zIndex: 3,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  itemTextSelected: {
    fontFamily: 'Lato_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
});

const FOCUS_ITEMS: { key: FocusArea; label: string; desc: string; color: string }[] = [
  { key: 'mindset', label: 'Mindset & Emotional Prep', desc: 'Cultivate resilience and emotional well-being.', color: Colors.accentPink },
  { key: 'relationships', label: 'Relationships', desc: 'Nurture connections and communication.', color: Colors.accentBlue },
  { key: 'physical', label: 'Physical Wellness', desc: 'Focus on body, movement, and nutrition.', color: Colors.accentPeach },
  { key: 'partner', label: 'Partner Prep', desc: 'Align expectations and support systems.', color: Colors.accentBlue },
  { key: 'postpartum', label: 'Postpartum Planning', desc: 'Prepare for the fourth trimester.', color: Colors.accentPink },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [monthIdx, setMonthIdx] = useState(0);
  const [yearIdx, setYearIdx] = useState(1);
  const [isFirstPregnancy, setIsFirstPregnancy] = useState<boolean | null>(null);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [preferredTime, setPreferredTime] = useState('9:00 AM');
  const [dateError, setDateError] = useState('');

  const selectedDay = dayIdx + 1;
  const selectedMonth = monthIdx + 1;
  const selectedYear = parseInt(YEARS[yearIdx]);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  function tryHaptic() {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }

  function toggleFocus(area: FocusArea) {
    tryHaptic();
    setFocusAreas(prev => {
      if (prev.includes(area)) return prev.filter(a => a !== area);
      if (prev.length >= 3) return prev;
      return [...prev, area];
    });
  }

  function validateSelectedDate(): boolean {
    const inputDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate <= today) {
      setDateError('Due date must be in the future');
      return false;
    }
    setDateError('');
    return true;
  }

  async function complete() {
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    const dd = String(selectedDay).padStart(2, '0');
    const mm = String(selectedMonth).padStart(2, '0');
    const formattedDueDate = `${selectedYear}-${mm}-${dd}`;
    try {
      await setProfile({
        name: name.trim() || 'Mama',
        dueDate: formattedDueDate,
        focusAreas: focusAreas.length > 0 ? focusAreas : ['mindset', 'relationships', 'physical'],
        notificationsEnabled,
        onboardingCompleted: true,
      });
      router.replace('/intake');
    } catch (e) {
      console.error('Error completing onboarding:', e);
    }
  }

  async function skipOnboarding() {
    tryHaptic();
    try {
      await setProfile({
        name: 'Mama',
        onboardingCompleted: false,
      });
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Error skipping onboarding:', e);
    }
  }

  function next() {
    tryHaptic();
    if (step === 1 && !validateSelectedDate()) {
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

  const timeOptions = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '8:00 PM'];

  const canProceed =
    step === 0 ||
    step === 3 ||
    step === 4 ||
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && focusAreas.length > 0);

  const ctaLabel =
    step === 0 ? 'Begin Your Journey' :
    step === 4 ? "Let's Begin" :
    'Continue';

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset, paddingBottom: insets.bottom + webBottomInset }]}>
      {step > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.headerRow}>
          <Pressable onPress={back} style={styles.backButton} hitSlop={12}>
            <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
          </Pressable>

          {step < 4 ? (
            <View style={styles.progressContainer}>
              {step <= 3 && (
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepIndicatorText}>Step {step} of {TOTAL_STEPS - 1}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <View style={{ width: 40 }} />
        </Animated.View>
      )}

      {step > 0 && step < 4 && (
        <View style={styles.dotsContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.dot, i === step ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
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
          scrollEnabled={step !== 1}
        >
          {step === 0 && (
            <Animated.View entering={FadeIn.duration(800)} style={styles.welcomeContainer}>
              <View style={styles.welcomeSpacer} />

              <Animated.Text entering={FadeInDown.delay(200).duration(700)} style={styles.welcomeBrand}>
                PrePartum
              </Animated.Text>

              <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={styles.welcomeTagline}>
                Prepare. Nurture. Bloom.
              </Animated.Text>

              <View style={styles.welcomeSpacer} />
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Tell us about you</Text>

              <View style={styles.fieldGroup}>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="What should we call you?"
                    placeholderTextColor={Colors.textLight}
                    autoCapitalize="words"
                    testID="name-input"
                  />
                </View>

                <View>
                  <Text style={styles.dateLabel}>When are you due?</Text>
                  <View style={styles.wheelRow}>
                    <View style={styles.wheelCol}>
                      <Text style={styles.wheelColLabel}>Day</Text>
                      <WheelPicker
                        items={DAYS}
                        selectedIndex={dayIdx}
                        onSelect={setDayIdx}
                      />
                    </View>
                    <View style={[styles.wheelCol, { flex: 1.4 }]}>
                      <Text style={styles.wheelColLabel}>Month</Text>
                      <WheelPicker
                        items={MONTHS}
                        selectedIndex={monthIdx}
                        onSelect={setMonthIdx}
                      />
                    </View>
                    <View style={styles.wheelCol}>
                      <Text style={styles.wheelColLabel}>Year</Text>
                      <WheelPicker
                        items={YEARS}
                        selectedIndex={yearIdx}
                        onSelect={setYearIdx}
                      />
                    </View>
                  </View>
                  {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
                </View>

                <View style={styles.pregnancyRow}>
                  <Text style={styles.pregnancyLabel}>Is this your first pregnancy?</Text>
                  <View style={styles.yesNoGroup}>
                    <Pressable
                      onPress={() => { setIsFirstPregnancy(true); tryHaptic(); }}
                      style={[styles.yesNoBtn, isFirstPregnancy === true && styles.yesNoBtnActive]}
                    >
                      <Text style={[styles.yesNoText, isFirstPregnancy === true && styles.yesNoTextActive]}>Yes</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setIsFirstPregnancy(false); tryHaptic(); }}
                      style={[styles.yesNoBtn, isFirstPregnancy === false && styles.yesNoBtnActive]}
                    >
                      <Text style={[styles.yesNoText, isFirstPregnancy === false && styles.yesNoTextActive]}>No</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What matters most to you?</Text>
              <Text style={styles.stepSubtitle}>Select 1-3 areas</Text>

              <View style={styles.focusList}>
                {FOCUS_ITEMS.map(item => {
                  const selected = focusAreas.includes(item.key);
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => toggleFocus(item.key)}
                      style={[styles.focusCard, selected && { borderColor: item.color, backgroundColor: item.color + '18' }]}
                      testID={`focus-${item.key}`}
                    >
                      <View style={[styles.focusIconCircle, { backgroundColor: item.color }]}>
                        <Ionicons
                          name={
                            item.key === 'mindset' ? 'sparkles-outline' :
                            item.key === 'relationships' ? 'people-outline' :
                            item.key === 'physical' ? 'body-outline' :
                            item.key === 'partner' ? 'heart-outline' :
                            'calendar-outline'
                          }
                          size={20}
                          color={Colors.textPrimary}
                        />
                      </View>
                      <View style={styles.focusTextWrap}>
                        <Text style={styles.focusTitle}>{item.label}</Text>
                        <Text style={styles.focusDesc}>{item.desc}</Text>
                      </View>
                      {selected && (
                        <View style={styles.focusCheck}>
                          <Ionicons name="checkmark" size={14} color={Colors.white} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Stay on track</Text>
              <Text style={styles.stepSubtitle}>A gentle daily nudge to keep you connected</Text>

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
                      tryHaptic();
                    }}
                    trackColor={{ false: Colors.border, true: Colors.accentPink }}
                    thumbColor="#FFF"
                    testID="notif-toggle"
                  />
                </View>
              </View>

              {notificationsEnabled && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={styles.timeLabel}>Preferred time</Text>
                  <View style={styles.timeGrid}>
                    {timeOptions.map(t => (
                      <Pressable
                        key={t}
                        onPress={() => {
                          setPreferredTime(t);
                          tryHaptic();
                        }}
                        style={[styles.timeChip, preferredTime === t && styles.timeChipActive]}
                      >
                        <Text style={[styles.timeChipText, preferredTime === t && styles.timeChipTextActive]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {step === 4 && (
            <Animated.View entering={FadeIn.duration(700)} style={styles.readyContainer}>
              <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.readyCheckWrap}>
                <View style={styles.readyCheckOuter}>
                  <View style={styles.readyCheckInner}>
                    <Ionicons name="checkmark" size={32} color={Colors.textPrimary} />
                  </View>
                </View>
              </Animated.View>

              <Animated.Text entering={FadeInDown.delay(400).duration(500)} style={styles.readyTitle}>
                You're ready, {name || 'Mama'}
              </Animated.Text>

              <Animated.Text entering={FadeInDown.delay(600).duration(500)} style={styles.readyBody}>
                Your personalized journey is set. Each day we'll bring you a moment of calm reflection, preparation, and connection.
              </Animated.Text>

              <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.readyFeatures}>
                <View style={styles.readyFeatureItem}>
                  <View style={[styles.readyFeatureIcon, { backgroundColor: Colors.accentPink }]}>
                    <Ionicons name="leaf-outline" size={16} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.readyFeatureText}>Daily reflections</Text>
                </View>
                <View style={styles.readyFeatureItem}>
                  <View style={[styles.readyFeatureIcon, { backgroundColor: Colors.accentPeach }]}>
                    <Ionicons name="heart-outline" size={16} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.readyFeatureText}>Memory bank</Text>
                </View>
                <View style={styles.readyFeatureItem}>
                  <View style={[styles.readyFeatureIcon, { backgroundColor: Colors.accentBlue }]}>
                    <Ionicons name="checkbox-outline" size={16} color={Colors.textPrimary} />
                  </View>
                  <Text style={styles.readyFeatureText}>Preparation tasks</Text>
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
            pressed && canProceed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
          ]}
          testID="onboarding-cta"
        >
          <Text style={[styles.ctaText, !canProceed && { opacity: 0.4 }]}>
            {ctaLabel}
          </Text>
        </Pressable>

        {step === 0 && (
          <Animated.View entering={FadeInUp.delay(800).duration(500)} style={styles.welcomeBottomLinks}>
            <Pressable
              onPress={skipOnboarding}
              style={styles.skipOnboardingLink}
              testID="skip-onboarding"
            >
              <Text style={styles.skipOnboardingText}>Skip for now</Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace('/sign-in')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>Log In</Text>
            </Pressable>
          </Animated.View>
        )}

        {step === 3 && (
          <Pressable onPress={next} style={styles.skipLink}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  stepIndicatorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: Colors.textPrimary,
  },
  dotInactive: {
    backgroundColor: Colors.border,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },

  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  welcomeSpacer: {
    flex: 1,
  },
  welcomeBrand: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 44,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  welcomeTagline: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 1.5,
  },

  stepContainer: {
    paddingTop: 4,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: Colors.textPrimary,
    marginBottom: 8,
    lineHeight: 40,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },

  fieldGroup: {
    marginTop: 24,
    gap: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 16,
  },
  dateLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
    marginTop: 4,
  },
  wheelCol: {
    flex: 1,
    alignItems: 'center',
  },
  wheelColLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textLight,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  errorText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.error,
    marginLeft: 4,
    marginTop: -4,
  },

  pregnancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  pregnancyLabel: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  yesNoGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  yesNoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  yesNoBtnActive: {
    backgroundColor: Colors.accentPink,
    borderColor: Colors.accentPink,
  },
  yesNoText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  yesNoTextActive: {
    fontFamily: 'Lato_700Bold',
    color: Colors.textPrimary,
  },

  focusList: {
    gap: 10,
  },
  focusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 12,
  },
  focusIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusTextWrap: {
    flex: 1,
  },
  focusTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  focusDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  focusCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.accentPink + '40',
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
  timeLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
    backgroundColor: Colors.accentPink + '40',
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
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textLight,
  },

  readyContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  readyCheckWrap: {
    marginBottom: 28,
  },
  readyCheckOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.accentPink + '30',
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
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  readyBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  readyFeatures: {
    gap: 14,
    width: '100%',
  },
  readyFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readyFeatureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyFeatureText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
  },

  bottomSection: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  ctaButton: {
    backgroundColor: Colors.accentPink,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  loginLink: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  welcomeBottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 14,
  },
  skipOnboardingLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipOnboardingText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textLight,
  },
  loginLinkText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
