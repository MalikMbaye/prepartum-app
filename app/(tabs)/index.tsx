import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getCategoryColor, getCategoryLabel } from '@/lib/prompts-data';
import { getPersonaConfig, sanitizeForPersona, personaAffirmation } from '@/lib/persona';

type PregnancyWeekData = {
  weekNumber: number;
  trimester: number;
  babySizeComparison: string | null;
  babySizeEmoji: string | null;
  affirmation: string | null;
  theme: string | null;
};

function tryHaptic() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

function ProgressRing({ progress, size, strokeWidth, color }: { progress: number; size: number; strokeWidth: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const segmentCount = 7;
  const gapAngle = 6;
  const totalArc = 360 - segmentCount * gapAngle;
  const segmentArc = totalArc / segmentCount;
  const filledSegments = Math.round(progress * segmentCount);
  const center = size / 2;

  const trackSegments = Array.from({ length: segmentCount }, (_, i) => {
    const startAngle = i * (segmentArc + gapAngle) - 90;
    return { startAngle, isFilled: i < filledSegments };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {trackSegments.map((seg, i) => {
        const midAngle = seg.startAngle + segmentArc / 2;
        const midRad = (midAngle * Math.PI) / 180;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: strokeWidth + 14,
              height: strokeWidth,
              borderRadius: strokeWidth / 2,
              backgroundColor: seg.isFilled ? color : Colors.border,
              transform: [
                { translateX: radius * Math.cos(midRad) },
                { translateY: radius * Math.sin(midRad) },
                { rotate: `${midAngle + 90}deg` },
              ],
            }}
          />
        );
      })}
      <View style={{
        width: size - strokeWidth * 2 - 16,
        height: size - strokeWidth * 2 - 16,
        borderRadius: (size - strokeWidth * 2 - 16) / 2,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: Colors.textPrimary }}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

const BODY_CHECKIN_OPTIONS = [
  { key: 'tender', label: 'Tender', emoji: '🌸' },
  { key: 'okay', label: 'Okay', emoji: '🌿' },
  { key: 'strong', label: 'Strong', emoji: '✨' },
];

function todayKey() {
  return `body_checkin_${new Date().toISOString().slice(0, 10)}`;
}

function BodyCheckInCard() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(todayKey()).then(v => {
      if (v) { setSelected(v); setSaved(true); }
    });
  }, []);

  async function handleSelect(key: string) {
    tryHaptic();
    setSelected(key);
    setSaved(true);
    await AsyncStorage.setItem(todayKey(), key);
  }

  return (
    <View style={styles.emphasisCard}>
      <Text style={styles.emphasisLabel}>How does your body feel today?</Text>
      <View style={styles.bodyRow}>
        {BODY_CHECKIN_OPTIONS.map(opt => (
          <Pressable
            key={opt.key}
            onPress={() => handleSelect(opt.key)}
            style={[styles.bodyBtn, selected === opt.key && styles.bodyBtnSelected]}
          >
            <Text style={styles.bodyEmoji}>{opt.emoji}</Text>
            <Text style={[styles.bodyBtnText, selected === opt.key && styles.bodyBtnTextSelected]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {saved && selected && (
        <Text style={styles.emphasisSub}>Noted. Be gentle with yourself today.</Text>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile, promptResponses, getWeeklyProgress, getPregnancyWeek, getWeeklyCompletedCount,
    tasks, journalEntries, memories, prompts, personalizedPrompts, refreshing, refreshData
  } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const weeklyProgress = getWeeklyProgress();
  const weeklyCount = getWeeklyCompletedCount();
  const pregnancyWeek = getPregnancyWeek();
  const completedPromptIds = promptResponses.map(r => r.promptId);

  const persona = (profile?.profileFlags?.persona as string) || 'supported_nurturer';
  const personaConfig = getPersonaConfig(persona);

  const { data: weekData } = useQuery<PregnancyWeekData>({
    queryKey: [`/api/pregnancy-weeks/${pregnancyWeek}`],
    enabled: pregnancyWeek > 0,
  });

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  const fallbackPrompts = useMemo(() => {
    if (personalizedPrompts.length > 0) return [];
    const categories = ['mindset', 'relationships', 'physical'];
    const result: any[] = [];
    for (const cat of categories) {
      const p = prompts.find(pr => pr.category === cat && !completedPromptIds.includes(pr.id));
      if (p) result.push({ ...p, depth: null, format: null, intensity: null, reframe: null });
    }
    return result.slice(0, 3);
  }, [personalizedPrompts, prompts, completedPromptIds]);

  const greeting = useMemo(() => {
    const name = profile?.name || 'Mama';
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  }, [profile?.name]);

  const availablePrompts = personalizedPrompts.length > 0
    ? personalizedPrompts.filter(p => !completedPromptIds.includes(p.id))
    : fallbackPrompts;
  const hasPrompts = availablePrompts.length > 0;
  const primaryColor = hasPrompts ? getCategoryColor(availablePrompts[0].category) : Colors.accentPink;

  const weekAffirmation = weekData?.affirmation
    ? personaAffirmation(weekData.affirmation, persona)
    : null;

  function renderEmphasisCard() {
    const emphasis = personaConfig.homeScreenEmphasis;

    if (emphasis === 'tasks') {
      const currentTrimTask = totalTasks > 0;
      return (
        <Animated.View entering={FadeInDown.delay(175).duration(500)}>
          <Pressable
            onPress={() => { tryHaptic(); router.push('/(tabs)/tasks'); }}
            style={({ pressed }) => [styles.emphasisCard, pressed && { opacity: 0.95 }]}
            testID="emphasis-tasks-card"
          >
            <View style={styles.emphasisRow}>
              <Text style={styles.emphasisLabel}>{personaConfig.taskBoardLabel}</Text>
              <View style={styles.emphasisBadge}>
                <Text style={styles.emphasisBadgeText}>Week {pregnancyWeek || '?'}</Text>
              </View>
            </View>
            <Text style={styles.emphasisBig}>{completedTasks}<Text style={styles.emphasisBigOf}> / {totalTasks}</Text></Text>
            <Text style={styles.emphasisSub}>tasks complete</Text>
            <View style={styles.emphasisCta}>
              <Text style={styles.emphasisCtaText}>Open checklist</Text>
              <Feather name="arrow-right" size={14} color={Colors.textPrimary} />
            </View>
          </Pressable>
        </Animated.View>
      );
    }

    if (emphasis === 'milestones') {
      if (!weekData) return null;
      return (
        <Animated.View entering={FadeInDown.delay(175).duration(500)}>
          <View style={[styles.emphasisCard, { borderLeftWidth: 4, borderLeftColor: Colors.accentBlue }]}>
            <Text style={styles.emphasisLabel}>This week's milestone</Text>
            <Text style={styles.emphasisTitle}>Week {weekData.weekNumber}</Text>
            {weekData.theme && (
              <Text style={styles.emphasisBody}>{weekData.theme}</Text>
            )}
            {weekAffirmation && (
              <Text style={styles.emphasisQuote}>"{sanitizeForPersona(weekAffirmation, persona)}"</Text>
            )}
          </View>
        </Animated.View>
      );
    }

    if (emphasis === 'strength') {
      const affText = weekAffirmation || "You have everything you need right now.";
      return (
        <Animated.View entering={FadeInDown.delay(175).duration(500)}>
          <View style={[styles.emphasisCard, { backgroundColor: '#D4E8D4' }]}>
            <Text style={styles.emphasisLabel}>This week's strength</Text>
            <Text style={styles.emphasisQuote}>"{sanitizeForPersona(affText, persona)}"</Text>
          </View>
        </Animated.View>
      );
    }

    if (emphasis === 'body') {
      return (
        <Animated.View entering={FadeInDown.delay(175).duration(500)}>
          <BodyCheckInCard />
        </Animated.View>
      );
    }

    if (emphasis === 'surrender') {
      const affText = weekAffirmation || "Everything is unfolding as it should.";
      return (
        <Animated.View entering={FadeInDown.delay(175).duration(500)}>
          <View style={[styles.emphasisCard, { backgroundColor: Colors.accentPeach }]}>
            <Text style={styles.emphasisLabel}>This week's intention</Text>
            <Text style={[styles.emphasisQuote, { fontSize: 20 }]}>"{sanitizeForPersona(affText, persona)}"</Text>
          </View>
        </Animated.View>
      );
    }

    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 20, paddingBottom: 110 }]}
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
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.header}>
        <View>
          <Text style={styles.greeting} testID="home-greeting">{greeting}</Text>
          {pregnancyWeek > 0 && (
            <Text style={styles.weekLabel}>Week {pregnancyWeek} of your pregnancy journey</Text>
          )}
          {pregnancyWeek === 0 && (
            <Text style={styles.weekLabel}>Your pregnancy journey</Text>
          )}
        </View>
      </Animated.View>

      {weekData && (
        <Animated.View entering={FadeInDown.delay(150).duration(500)}>
          <Pressable
            onPress={() => { tryHaptic(); router.push('/pregnancy-weeks'); }}
            style={({ pressed }) => [
              styles.weekCard,
              pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
            ]}
            testID="this-week-card"
          >
            <View style={styles.weekCardTop}>
              <View style={styles.weekCardLeft}>
                <Text style={styles.weekCardEmoji}>{weekData.babySizeEmoji ?? '🌱'}</Text>
                <View>
                  <Text style={styles.weekCardTitle}>Week {weekData.weekNumber}</Text>
                  <Text style={styles.weekCardSize}>{weekData.babySizeComparison}</Text>
                </View>
              </View>
              <View style={styles.weekCardBadge}>
                <Text style={styles.weekCardBadgeText}>
                  {weekData.trimester === 1 ? '1st' : weekData.trimester === 2 ? '2nd' : '3rd'} Trimester
                </Text>
              </View>
            </View>
            {weekAffirmation && (
              <Text style={styles.weekCardAffirmation}>
                "{sanitizeForPersona(weekAffirmation, persona)}"
              </Text>
            )}
            <View style={styles.weekCardFooter}>
              <Text style={styles.weekCardFooterText}>View full journey</Text>
              <Feather name="arrow-right" size={14} color={Colors.textSecondary} />
            </View>
          </Pressable>
        </Animated.View>
      )}

      {renderEmphasisCard()}

      {!profile?.intakeCompleted && (
        <Animated.View entering={FadeInDown.delay(weekData ? 200 : 150).duration(500)}>
          <Pressable
            onPress={() => router.push('/intake')}
            style={styles.intakeBanner}
            testID="resume-intake"
          >
            <View style={styles.intakeBannerIcon}>
              <Ionicons name="sparkles" size={18} color="#4A2F4B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.intakeBannerTitle}>Personalise your experience</Text>
              <Text style={styles.intakeBannerSubtitle}>Complete a quick questionnaire to get tailored content</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </Pressable>
        </Animated.View>
      )}

      {hasPrompts && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>{personaConfig.homeGreeting}</Text>
          {availablePrompts.map((prompt, index) => {
            const categoryColor = getCategoryColor(prompt.category);
            const sanitizedBody = sanitizeForPersona(prompt.body, persona);
            return (
              <Pressable
                key={prompt.id}
                onPress={() => {
                  tryHaptic();
                  router.push({
                    pathname: '/prompt-response',
                    params: {
                      promptId: prompt.id,
                      promptText: sanitizedBody,
                      category: prompt.category,
                      promptTitle: prompt.title ?? '',
                      format: (prompt as any).format ?? 'text',
                      weekNumber: prompt.weekNumber ? String(prompt.weekNumber) : '',
                      ...((prompt as any).reframe ? {
                        reframeOriginal: (prompt as any).reframe.originalThought,
                        reframeText: (prompt as any).reframe.reframedThought,
                      } : {}),
                    }
                  });
                }}
                style={({ pressed }) => [
                  styles.promptCard,
                  pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] }
                ]}
                testID={`prompt-card-${prompt.category}`}
              >
                <View style={styles.promptHeader}>
                  <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                  <Text style={styles.categoryLabel}>{getCategoryLabel(prompt.category)}</Text>
                  {(prompt as any).depth && (
                    <View style={[styles.depthBadge, { backgroundColor: categoryColor + '40' }]}>
                      <Text style={styles.depthText}>{(prompt as any).depth}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.promptTitle}>{prompt.title}</Text>
                <Text style={styles.promptPreview} numberOfLines={2}>{sanitizedBody}</Text>

                <View style={[styles.startButton, { backgroundColor: categoryColor }]}>
                  <Text style={styles.startButtonText}>Reflect</Text>
                  <Feather name="arrow-right" size={16} color={Colors.textPrimary} />
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      )}

      {!hasPrompts && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.allDoneCard}>
          <Ionicons name="checkmark-circle-outline" size={32} color={Colors.success} />
          <Text style={styles.allDoneTitle}>All caught up</Text>
          <Text style={styles.allDoneBody}>You've reflected on all available prompts. New ones will appear soon.</Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.progressCard}>
          <ProgressRing
            progress={weeklyProgress}
            size={80}
            strokeWidth={6}
            color={primaryColor}
          />
          <View style={styles.progressInfo}>
            <Text style={styles.progressCount}>{weeklyCount} of 7</Text>
            <Text style={styles.progressLabel}>prompts completed this week</Text>
            <Text style={styles.progressEncouragement}>
              {weeklyCount === 0 ? 'Start your week with a reflection' :
               weeklyCount < 4 ? 'Keep showing up for yourself' :
               weeklyCount < 7 ? 'You\'re doing wonderfully' :
               'A perfect week'}
            </Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(440).duration(500)}>
        <Pressable
          onPress={() => { tryHaptic(); router.push('/milestones'); }}
          style={({ pressed }) => [
            styles.milestonesCard,
            pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] },
          ]}
          testID="milestones-card"
        >
          <View style={styles.milestonesCardLeft}>
            <Text style={styles.milestonesIcon}>🎯</Text>
            <View>
              <Text style={styles.milestonesLabel}>Pregnancy Milestones</Text>
              <Text style={styles.milestonesSubLabel}>Track your journey's key moments</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.quickSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <Pressable
            onPress={() => { tryHaptic(); router.push('/(tabs)/memories'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            testID="quick-memories"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentPink }]}>
              <Ionicons name="heart-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickLabel}>Memories</Text>
            <Text style={styles.quickMeta}>{memories.length}</Text>
          </Pressable>

          <Pressable
            onPress={() => { tryHaptic(); router.push('/(tabs)/tasks'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            testID="quick-tasks"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentBlue }]}>
              <Ionicons name="checkbox-outline" size={22} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickLabel}>Tasks</Text>
            <Text style={styles.quickMeta}>{completedTasks}/{totalTasks}</Text>
          </Pressable>

          <Pressable
            onPress={() => { tryHaptic(); router.push('/journal'); }}
            style={({ pressed }) => [styles.quickCard, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
            testID="quick-journal"
          >
            <View style={[styles.quickIconWrap, { backgroundColor: Colors.accentPeach }]}>
              <Feather name="book-open" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.quickLabel}>Journal</Text>
            <Text style={styles.quickMeta}>{journalEntries.length}</Text>
          </Pressable>
        </View>
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
  header: {
    marginBottom: 28,
  },
  greeting: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  weekLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  emphasisCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  emphasisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emphasisLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  emphasisBadge: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  emphasisBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textPrimary,
  },
  emphasisBig: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 36,
    color: Colors.textPrimary,
    lineHeight: 40,
  },
  emphasisBigOf: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 22,
    color: Colors.textSecondary,
  },
  emphasisTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emphasisBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
  },
  emphasisQuote: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 26,
    marginTop: 4,
  },
  emphasisSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emphasisCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  emphasisCtaText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  bodyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.canvas,
  },
  bodyBtnSelected: {
    backgroundColor: Colors.accentPeach,
    borderColor: Colors.textPrimary,
  },
  bodyEmoji: {
    fontSize: 22,
  },
  bodyBtnText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bodyBtnTextSelected: {
    color: Colors.textPrimary,
  },

  promptCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  categoryLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    flex: 1,
  },
  depthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  depthText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  promptTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  promptPreview: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  startButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },

  allDoneCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 28,
    marginBottom: 28,
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 10,
  },
  allDoneTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  allDoneBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  progressSection: {
    marginBottom: 28,
  },
  progressCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: 20,
  },
  progressInfo: {
    flex: 1,
  },
  progressCount: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  progressLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressEncouragement: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
  },

  quickSection: {
    marginBottom: 24,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    gap: 8,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  quickMeta: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  intakeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EDF5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  intakeBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5D6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  intakeBannerTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: '#4A2F4B',
    marginBottom: 2,
  },
  intakeBannerSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },

  weekCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  weekCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekCardEmoji: {
    fontSize: 36,
  },
  weekCardTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  weekCardSize: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  weekCardBadge: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  weekCardBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textPrimary,
  },
  weekCardAffirmation: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 14,
  },
  weekCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekCardFooterText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  milestonesCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  milestonesCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  milestonesIcon: {
    fontSize: 26,
  },
  milestonesLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  milestonesSubLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
