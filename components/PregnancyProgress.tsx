import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FRUITS_BY_WEEK = [
  {w:1,  e:'🌱', n:'poppy seed'},
  {w:2,  e:'🫐', n:'blueberry'},
  {w:3,  e:'🫘', n:'kidney bean'},
  {w:4,  e:'🫘', n:'lentil'},
  {w:5,  e:'🍓', n:'strawberry'},
  {w:6,  e:'🍇', n:'sweet pea'},
  {w:7,  e:'🫐', n:'blueberry'},
  {w:8,  e:'🍓', n:'raspberry'},
  {w:9,  e:'🍇', n:'grape'},
  {w:10, e:'🫒', n:'olive'},
  {w:11, e:'🍑', n:'fig'},
  {w:12, e:'🍋', n:'lime'},
  {w:13, e:'🍋', n:'lemon'},
  {w:14, e:'🍋', n:'lemon'},
  {w:15, e:'🍎', n:'apple'},
  {w:16, e:'🥑', n:'avocado'},
  {w:17, e:'🍐', n:'pear'},
  {w:18, e:'🫑', n:'bell pepper'},
  {w:19, e:'🥭', n:'mango'},
  {w:20, e:'🍌', n:'banana'},
  {w:21, e:'🥕', n:'carrot'},
  {w:22, e:'🌽', n:'corn'},
  {w:23, e:'🥭', n:'large mango'},
  {w:24, e:'🌽', n:'ear of corn'},
  {w:25, e:'🥦', n:'cauliflower'},
  {w:26, e:'🥬', n:'lettuce head'},
  {w:27, e:'🥦', n:'broccoli'},
  {w:28, e:'🥒', n:'zucchini'},
  {w:29, e:'🎃', n:'butternut squash'},
  {w:30, e:'🥥', n:'coconut'},
  {w:31, e:'🍍', n:'pineapple'},
  {w:32, e:'🥥', n:'large coconut'},
  {w:33, e:'🍍', n:'large pineapple'},
  {w:34, e:'🍈', n:'cantaloupe'},
  {w:35, e:'🍈', n:'honeydew'},
  {w:36, e:'🍉', n:'small watermelon'},
  {w:37, e:'🍊', n:'grapefruit'},
  {w:38, e:'🎃', n:'small pumpkin'},
  {w:39, e:'🍉', n:'watermelon'},
  {w:40, e:'🍉', n:'watermelon'},
];

type TrimesterInfo = {
  number: 1 | 2 | 3;
  label: string;
  weekRange: string;
  theme: string;
  description: string;
};

const TRIMESTERS: TrimesterInfo[] = [
  {
    number: 1,
    label: '1st',
    weekRange: 'Weeks 1-12',
    theme: 'Beginning and becoming',
    description: 'This is a season of quiet transformation. The biggest changes are invisible to the world, and sometimes to you.',
  },
  {
    number: 2,
    label: '2nd',
    weekRange: 'Weeks 13-27',
    theme: 'Growing and connecting',
    description: 'This is a season of deepening. Your body is finding its rhythm and so are you.',
  },
  {
    number: 3,
    label: '3rd',
    weekRange: 'Weeks 28-40',
    theme: 'Preparing and trusting',
    description: 'This is a season of arrival. Everything you have been building is about to meet the world.',
  },
];

function getTrimester(week: number): 1 | 2 | 3 {
  if (week <= 12) return 1;
  if (week <= 27) return 2;
  return 3;
}

type Props = {
  currentWeek: number;
  dueDate: string;
};

export default function PregnancyProgress({ currentWeek, dueDate }: Props) {
  const safeWeek = Math.max(1, Math.min(40, currentWeek));
  const currentFruit = FRUITS_BY_WEEK[safeWeek - 1];
  const percentage = Math.round(((safeWeek - 1) / 39) * 100);
  const currentTrimester = getTrimester(safeWeek);
  const trimesterInfo = TRIMESTERS[currentTrimester - 1];
  const weeksLeft = 40 - safeWeek;

  function getDotStyle(trimesterNum: 1 | 2 | 3) {
    if (trimesterNum < currentTrimester) {
      return { backgroundColor: '#C9A0B4', borderWidth: 0 };
    }
    if (trimesterNum === currentTrimester) {
      return { backgroundColor: '#5D5066', borderWidth: 0 };
    }
    return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#EDD8E0' };
  }

  function getDotLabelColor(trimesterNum: 1 | 2 | 3) {
    if (trimesterNum === currentTrimester) return '#5D5066';
    if (trimesterNum < currentTrimester) return '#C9A0B4';
    return '#C8B8C8';
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.weekText}>Week {safeWeek} of 40</Text>
        <Text style={styles.percentText}>{percentage}%</Text>
      </View>

      <View style={styles.dotsRow}>
        {TRIMESTERS.map((t) => (
          <View key={t.number} style={styles.dotGroup}>
            <View style={[styles.dot, getDotStyle(t.number)]} />
            <Text style={[styles.dotLabel, { color: getDotLabelColor(t.number) }]}>
              {t.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${percentage}%` as any }]} />
        </View>
        <View
          style={[
            styles.thumbContainer,
            { left: `${percentage}%` as any },
          ]}
        >
          <Text style={styles.thumbEmoji}>{currentFruit.e}</Text>
        </View>
      </View>

      <View style={styles.weekLabelsRow}>
        <Text style={styles.weekLabelText}>Week 1</Text>
        <Text style={[styles.weekLabelText, styles.weekLabelCenter]}>Week {safeWeek}</Text>
        <Text style={styles.weekLabelText}>Week 40</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{safeWeek - 1}</Text>
          <Text style={styles.statLabel}>Weeks done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weeksLeft}</Text>
          <Text style={styles.statLabel}>Weeks left</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentTrimester}</Text>
          <Text style={styles.statLabel}>Trimester</Text>
        </View>
      </View>

      <View style={styles.babySizeCard}>
        <Text style={styles.babySizeEmoji}>{currentFruit.e}</Text>
        <View style={styles.babySizeRight}>
          <Text style={styles.babySizeCaption}>Your baby is the size of a</Text>
          <Text style={styles.babySizeName}>{currentFruit.n}</Text>
        </View>
      </View>

      <View style={styles.trimesterCard}>
        <Text style={styles.trimesterLabel}>{trimesterInfo.label} Trimester</Text>
        <Text style={styles.trimesterTheme}>{trimesterInfo.theme}</Text>
        <Text style={styles.trimesterDesc}>{trimesterInfo.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#5D5066',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 18,
    color: '#5D5066',
  },
  percentText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: '#C9A0B4',
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  dotGroup: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
  },

  barContainer: {
    position: 'relative',
    marginBottom: 6,
    paddingVertical: 14,
  },
  barTrack: {
    height: 8,
    backgroundColor: '#F0E0D0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#C9A0B4',
    borderRadius: 4,
  },
  thumbContainer: {
    position: 'absolute',
    top: 3,
    marginLeft: -11,
  },
  thumbEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },

  weekLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekLabelText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: '#9B8A99',
  },
  weekLabelCenter: {
    color: '#5D5066',
    fontFamily: 'Lato_700Bold',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    borderWidth: 0.5,
    borderColor: '#EDD8E0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#5D5066',
  },
  statLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: '#9B8A99',
    marginTop: 2,
  },

  babySizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderWidth: 0.5,
    borderColor: '#EDD8E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 14,
  },
  babySizeEmoji: {
    fontSize: 32,
  },
  babySizeRight: {
    flex: 1,
  },
  babySizeCaption: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: '#9B8A99',
    marginBottom: 3,
  },
  babySizeName: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: '#5D5066',
    textTransform: 'capitalize',
  },

  trimesterCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#BBD4E3',
    backgroundColor: '#EEF5F9',
    borderRadius: 12,
    padding: 12,
  },
  trimesterLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 9,
    color: '#185FA5',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  trimesterTheme: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 13,
    color: '#5D5066',
    marginBottom: 4,
  },
  trimesterDesc: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: '#5D5066',
    lineHeight: 18,
  },
});
