import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ScrollView,
  Dimensions, Platform, KeyboardAvoidingView
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { FocusArea } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { setProfile } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  function toggleFocus(area: FocusArea) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  }

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
    if (step < 4) setStep(step + 1);
    else complete();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function formatDateInput(text: string) {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    setDueDate(formatted);
  }

  const canProceed = step === 0 || step === 3 || step === 4 ||
    (step === 1 && name.trim().length > 0) ||
    (step === 2 && focusAreas.length > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset, paddingBottom: insets.bottom + webBottomInset }]}>
      {step > 0 && step < 4 && (
        <View style={styles.progressContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
      )}

      {step > 0 && (
        <Pressable onPress={back} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
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
            <Animated.View entering={FadeIn.duration(600)} style={styles.welcomeContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="flower-outline" size={48} color={Colors.textPrimary} />
              </View>
              <Text style={styles.welcomeTitle}>PrePartum</Text>
              <Text style={styles.welcomeSubtitle}>
                Preparing you{'\n'}for the journey ahead
              </Text>
              <Text style={styles.welcomeBody}>
                This isn't about tracking your baby's size.{'\n'}This is about preparing YOU — mentally,{'\n'}emotionally, and relationally — for the{'\n'}beautiful transformation of motherhood.
              </Text>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Let's get to know you</Text>
              <Text style={styles.stepBody}>What should we call you?</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your first name"
                placeholderTextColor={Colors.textLight}
                autoFocus
                autoCapitalize="words"
              />
              <Text style={[styles.stepBody, { marginTop: 24 }]}>When is your due date?</Text>
              <TextInput
                style={styles.input}
                value={dueDate}
                onChangeText={formatDateInput}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={Colors.textLight}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Text style={styles.hintText}>This is optional — skip if you prefer</Text>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What matters most to you?</Text>
              <Text style={styles.stepBody}>Choose the areas you'd like to focus on. You can always change these later.</Text>

              <Pressable
                onPress={() => toggleFocus('mindset')}
                style={[styles.focusCard, focusAreas.includes('mindset') && { borderColor: Colors.accentPink, backgroundColor: '#FFF0EF' }]}
              >
                <View style={[styles.focusIcon, { backgroundColor: Colors.accentPink }]}>
                  <Ionicons name="sparkles-outline" size={22} color={Colors.textPrimary} />
                </View>
                <View style={styles.focusText}>
                  <Text style={styles.focusTitle}>Mindset</Text>
                  <Text style={styles.focusDesc}>Identity, fears, expectations, self-awareness</Text>
                </View>
                {focusAreas.includes('mindset') && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.textPrimary} />
                )}
              </Pressable>

              <Pressable
                onPress={() => toggleFocus('relationships')}
                style={[styles.focusCard, focusAreas.includes('relationships') && { borderColor: Colors.accentBlue, backgroundColor: '#EEF5FA' }]}
              >
                <View style={[styles.focusIcon, { backgroundColor: Colors.accentBlue }]}>
                  <Ionicons name="people-outline" size={22} color={Colors.textPrimary} />
                </View>
                <View style={styles.focusText}>
                  <Text style={styles.focusTitle}>Relationships</Text>
                  <Text style={styles.focusDesc}>Partner, family, boundaries, communication</Text>
                </View>
                {focusAreas.includes('relationships') && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.textPrimary} />
                )}
              </Pressable>

              <Pressable
                onPress={() => toggleFocus('physical')}
                style={[styles.focusCard, focusAreas.includes('physical') && { borderColor: Colors.accentPeach, backgroundColor: '#FFF5F0' }]}
              >
                <View style={[styles.focusIcon, { backgroundColor: Colors.accentPeach }]}>
                  <Ionicons name="body-outline" size={22} color={Colors.textPrimary} />
                </View>
                <View style={styles.focusText}>
                  <Text style={styles.focusTitle}>Physical</Text>
                  <Text style={styles.focusDesc}>Body awareness, rest, nourishment, movement</Text>
                </View>
                {focusAreas.includes('physical') && (
                  <Ionicons name="checkmark-circle" size={24} color={Colors.textPrimary} />
                )}
              </Pressable>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View entering={FadeIn.duration(400)} style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Stay on track</Text>
              <Text style={styles.stepBody}>Would you like gentle reminders to check in with yourself?</Text>

              <Pressable
                onPress={() => { setNotificationsEnabled(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.optionCard, notificationsEnabled && styles.optionCardActive]}
              >
                <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
                <Text style={styles.optionText}>Yes, remind me daily</Text>
                {notificationsEnabled && <Ionicons name="checkmark-circle" size={22} color={Colors.textPrimary} />}
              </Pressable>

              <Pressable
                onPress={() => { setNotificationsEnabled(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.optionCard, !notificationsEnabled && styles.optionCardActive]}
              >
                <Ionicons name="notifications-off-outline" size={24} color={Colors.textPrimary} />
                <Text style={styles.optionText}>No thanks, I'll check in on my own</Text>
                {!notificationsEnabled && <Ionicons name="checkmark-circle" size={22} color={Colors.textPrimary} />}
              </Pressable>
            </Animated.View>
          )}

          {step === 4 && (
            <Animated.View entering={FadeIn.duration(600)} style={styles.welcomeContainer}>
              <View style={[styles.logoCircle, { backgroundColor: Colors.accentPink }]}>
                <Ionicons name="heart-outline" size={40} color={Colors.textPrimary} />
              </View>
              <Text style={styles.stepTitle}>You're ready, {name || 'Mama'}</Text>
              <Text style={[styles.welcomeBody, { marginTop: 16 }]}>
                This space is yours.{'\n'}No judgments, no comparisons.{'\n'}Just you, preparing for the most{'\n'}incredible chapter of your life.
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Pressable
        onPress={next}
        disabled={!canProceed}
        style={({ pressed }) => [
          styles.ctaButton,
          !canProceed && styles.ctaButtonDisabled,
          pressed && canProceed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={[styles.ctaText, !canProceed && { opacity: 0.5 }]}>
          {step === 0 ? "Let's Begin" : step === 4 ? "Start My Journey" : 'Continue'}
        </Text>
        {step < 4 && <Feather name="arrow-right" size={18} color={Colors.textPrimary} style={{ marginLeft: 8, opacity: canProceed ? 1 : 0.5 }} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.textPrimary,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginLeft: -8,
    marginTop: 4,
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
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF0EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  welcomeTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 24,
  },
  welcomeBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  stepContainer: {
    paddingTop: 20,
  },
  stepTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  stepBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
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
  hintText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 12,
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
  focusText: {
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 14,
  },
  optionCardActive: {
    borderColor: Colors.accentPink,
    backgroundColor: '#FFF0EF',
  },
  optionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentPink,
    borderRadius: 20,
    paddingVertical: 18,
    marginBottom: 16,
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.border,
  },
  ctaText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
  },
});
