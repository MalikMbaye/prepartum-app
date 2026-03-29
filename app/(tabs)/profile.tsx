import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryLabel, getCategoryColor } from '@/lib/prompts-data';
import { getPersonaConfig } from '@/lib/persona';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, promptResponses, memories, tasks, journalEntries,
    quizResults, roleplaySessions, getPregnancyWeek, getCurrentStreak, setProfile,
  } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const persona = (profile?.profileFlags?.persona as string) || '';
  const personaConfig = persona ? getPersonaConfig(persona) : null;

  function handlePersonaBadgePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      personaConfig?.personaBadge.label ?? 'Your Profile Type',
      `${personaConfig?.personaBadge.description ?? ''}\n\nWant to retake the questionnaire and update your profile?`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Retake questionnaire',
          onPress: async () => {
            await setProfile({ intakeCompleted: false } as any);
            router.push('/intake' as any);
          },
        },
      ]
    );
  }

  const pregnancyWeek = getPregnancyWeek();
  const completedTasks = tasks.filter(t => t.completed).length;
  const streak = getCurrentStreak();
  const completedSessions = roleplaySessions.filter(s => s.completedAt).length;

  function formatDueDate(dateStr: string) {
    if (!dateStr) return 'Not set';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function getDaysRemaining() {
    if (!profile?.dueDate) return null;
    const due = new Date(profile.dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (86400000));
    return Math.max(0, diff);
  }

  const daysLeft = getDaysRemaining();

  const stats = [
    { label: 'Day Streak', value: streak, icon: 'flame-outline' as const, color: '#FDDCB5' },
    { label: 'Reflections', value: promptResponses.length, icon: 'bulb-outline' as const, color: Colors.accentPink },
    { label: 'Memories', value: memories.length, icon: 'heart-outline' as const, color: Colors.accentPeach },
    { label: 'Tasks Done', value: completedTasks, icon: 'checkbox-outline' as const, color: Colors.accentBlue },
  ];

  const quickLinks = [
    { label: 'Journal', icon: 'book-open' as const, route: '/journal' },
    { label: 'Quizzes & Practice', icon: 'sparkles-outline' as const, route: '/(tabs)/quizzes', isIonicon: true },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 16, paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.profileHeader}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatar}>
            <Ionicons name="flower-outline" size={34} color={Colors.textPrimary} />
          </View>
          {pregnancyWeek > 0 && (
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>W{pregnancyWeek}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile?.name || 'Mama'}</Text>
        {profile?.dueDate && (
          <Text style={styles.dueText}>Due {formatDueDate(profile.dueDate)}</Text>
        )}
        {daysLeft !== null && daysLeft > 0 && (
          <View style={styles.countdownPill}>
            <Text style={styles.countdownText}>{daysLeft} days to go</Text>
          </View>
        )}
      </Animated.View>

      {personaConfig && (
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.personaBadgeWrap}>
          <Pressable
            onPress={handlePersonaBadgePress}
            style={({ pressed }) => [
              styles.personaBadge,
              { backgroundColor: personaConfig.personaBadge.background },
              pressed && { opacity: 0.85 },
            ]}
            testID="persona-badge"
          >
            <Ionicons name="sparkles-outline" size={16} color={personaConfig.personaBadge.textColor} />
            <Text style={[styles.personaBadgeLabel, { color: personaConfig.personaBadge.textColor }]}>
              {personaConfig.personaBadge.label}
            </Text>
            <Feather name="info" size={13} color={personaConfig.personaBadge.textColor} style={{ opacity: 0.6 }} />
          </Pressable>
          <Text style={styles.personaBadgeDesc}>{personaConfig.personaBadge.description}</Text>
        </Animated.View>
      )}

      {profile?.focusAreas && profile.focusAreas.length > 0 && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.focusSection}>
          <View style={styles.focusRow}>
            {profile.focusAreas.map(area => (
              <View key={area} style={[styles.focusBadge, { backgroundColor: getCategoryColor(area) }]}>
                <Text style={styles.focusBadgeText}>{getCategoryLabel(area)}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <Text style={styles.sectionLabel}>Your Journey</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={20} color={Colors.textPrimary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.linksSection}>
        {quickLinks.map((link, i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(link.route as any);
            }}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.linkIconWrap}>
              {(link as any).isIonicon ? (
                <Ionicons name={link.icon as any} size={18} color={Colors.textPrimary} />
              ) : (
                <Feather name={link.icon as any} size={18} color={Colors.textPrimary} />
              )}
            </View>
            <Text style={styles.linkText}>{link.label}</Text>
            <Feather name="chevron-right" size={16} color={Colors.textLight} />
          </Pressable>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/settings');
          }}
          style={({ pressed }) => [styles.settingsButton, pressed && { opacity: 0.7 }]}
        >
          <Feather name="settings" size={18} color={Colors.textSecondary} />
          <Text style={styles.settingsText}>Settings</Text>
          <Feather name="chevron-right" size={16} color={Colors.textLight} />
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  content: {
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarOuter: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  weekBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 2,
    borderColor: Colors.canvas,
  },
  weekBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.white,
  },
  name: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  dueText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  countdownPill: {
    backgroundColor: Colors.accentPeach,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countdownText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  personaBadgeWrap: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  personaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  personaBadgeLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
  },
  personaBadgeDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  focusSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  focusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  focusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  focusBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  sectionLabel: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    width: '47%' as any,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  linksSection: {
    marginBottom: 20,
    gap: 6,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 12,
  },
  linkIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.white,
    gap: 12,
  },
  settingsText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    flex: 1,
  },
});
