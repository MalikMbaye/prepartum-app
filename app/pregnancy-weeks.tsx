import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

type PregnancyWeek = {
  weekNumber: number;
  trimester: number;
  theme: string | null;
  babySizeComparison: string | null;
  babySizeEmoji: string | null;
  babyWeightGrams: string | null;
  babyLengthCm: string | null;
  babyDevelopment: string | null;
  momBodyChanges: string | null;
  commonSymptoms: string | null;
  suggestedFocus: string | null;
  affirmation: string | null;
};

const TRIMESTER_LABELS: Record<number, string> = {
  1: 'First Trimester',
  2: 'Second Trimester',
  3: 'Third Trimester',
};

const TRIMESTER_SUBTITLE: Record<number, string> = {
  1: 'Weeks 1–12 · Beginning & Becoming',
  2: 'Weeks 13–27 · Growing & Connecting',
  3: 'Weeks 28–40 · Preparing & Trusting',
};

const TRIMESTER_COLOR: Record<number, string> = {
  1: Colors.accentPink,
  2: Colors.accentBlue,
  3: Colors.accentPeach,
};

function WeekRow({
  week,
  isCurrent,
  isExpanded,
  onToggle,
}: {
  week: PregnancyWeek;
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const accent = TRIMESTER_COLOR[week.trimester];

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.weekRow,
        isCurrent && { borderColor: accent, borderWidth: 2, backgroundColor: accent + '18' },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.weekRowTop}>
        <Text style={styles.weekEmoji}>{week.babySizeEmoji ?? '🌱'}</Text>
        <View style={styles.weekMeta}>
          <View style={styles.weekMetaRow}>
            <Text style={[styles.weekNumber, isCurrent && { color: Colors.textPrimary }]}>
              Week {week.weekNumber}
            </Text>
            {isCurrent && (
              <View style={[styles.currentBadge, { backgroundColor: accent }]}>
                <Text style={styles.currentBadgeText}>You are here</Text>
              </View>
            )}
          </View>
          <Text style={styles.weekSize}>{week.babySizeComparison}</Text>
        </View>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.textLight}
        />
      </View>

      {isExpanded && (
        <View style={styles.weekDetail}>
          {week.affirmation && (
            <Text style={styles.affirmation}>"{week.affirmation}"</Text>
          )}

          {week.babyDevelopment && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Baby this week</Text>
              <Text style={styles.detailText}>{week.babyDevelopment}</Text>
            </View>
          )}

          {week.momBodyChanges && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Your body</Text>
              <Text style={styles.detailText}>{week.momBodyChanges}</Text>
            </View>
          )}

          {week.commonSymptoms && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Common symptoms</Text>
              <Text style={styles.detailText}>{week.commonSymptoms}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            {week.babyWeightGrams && Number(week.babyWeightGrams) > 0.01 && (
              <View style={[styles.statChip, { backgroundColor: accent + '30' }]}>
                <Text style={styles.statValue}>
                  {Number(week.babyWeightGrams) >= 1000
                    ? `${(Number(week.babyWeightGrams) / 1000).toFixed(2)} kg`
                    : `${week.babyWeightGrams} g`}
                </Text>
                <Text style={styles.statLabel}>weight</Text>
              </View>
            )}
            {week.babyLengthCm && (
              <View style={[styles.statChip, { backgroundColor: accent + '30' }]}>
                <Text style={styles.statValue}>{week.babyLengthCm} cm</Text>
                <Text style={styles.statLabel}>length</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function PregnancyWeeksScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { getPregnancyWeek } = useApp();
  const currentWeek = getPregnancyWeek();

  const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeek > 0 ? currentWeek : 1);

  const { data: weeks = [], isLoading } = useQuery<PregnancyWeek[]>({
    queryKey: ['/api/pregnancy-weeks'],
  });

  const byTrimester = [1, 2, 3].map(t => ({
    trimester: t,
    weeks: weeks.filter(w => w.trimester === t),
  }));

  const toggle = (n: number) => setExpandedWeek(prev => (prev === n ? null : n));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Your Journey</Text>
          <Text style={styles.headerSubtitle}>
            {currentWeek > 0 ? `Week ${currentWeek} of 40` : '40 weeks of pregnancy'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 34 + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading your journey…</Text>
          </View>
        )}

        {byTrimester.map(({ trimester, weeks: tWeeks }) => (
          tWeeks.length > 0 && (
            <Animated.View
              key={trimester}
              entering={FadeInDown.delay(trimester * 100).duration(400)}
              style={styles.trimesterSection}
            >
              <View style={[styles.trimesterHeader, { borderLeftColor: TRIMESTER_COLOR[trimester] }]}>
                <Text style={styles.trimesterLabel}>{TRIMESTER_LABELS[trimester]}</Text>
                <Text style={styles.trimesterSub}>{TRIMESTER_SUBTITLE[trimester]}</Text>
              </View>

              {tWeeks.map(week => (
                <WeekRow
                  key={week.weekNumber}
                  week={week}
                  isCurrent={week.weekNumber === currentWeek}
                  isExpanded={expandedWeek === week.weekNumber}
                  onToggle={() => toggle(week.weekNumber)}
                />
              ))}
            </Animated.View>
          )
        ))}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.canvas,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingWrap: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textLight,
  },
  trimesterSection: {
    marginBottom: 28,
  },
  trimesterHeader: {
    borderLeftWidth: 4,
    paddingLeft: 14,
    marginBottom: 14,
  },
  trimesterLabel: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  trimesterSub: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  weekRow: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  weekRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekEmoji: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  weekMeta: {
    flex: 1,
    gap: 3,
  },
  weekMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekNumber: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weekSize: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  weekDetail: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 14,
  },
  affirmation: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  detailSection: {
    gap: 4,
  },
  detailLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
