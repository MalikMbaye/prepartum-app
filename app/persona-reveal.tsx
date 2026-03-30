import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  Modal, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PERSONA_CONFIG, PersonaKey } from '@/lib/persona';
import { useApp } from '@/contexts/AppContext';
import { apiRequest } from '@/lib/query-client';

const ALL_PERSONAS: PersonaKey[] = [
  'anxious_planner',
  'supported_nurturer',
  'solo_warrior',
  'healing_mother',
  'faith_anchored',
];

const PERSONA_EXPLANATIONS: Record<PersonaKey, string> = {
  anxious_planner:
    'Your reflection questions will focus on building trust in yourself and releasing what you cannot control. The app will meet you with structure, clarity, and calm.',
  solo_warrior:
    'Your reflection questions will never assume a partner is present. The app will focus on building your village, honoring your strength, and making sure you never feel alone in this.',
  healing_mother:
    'Your reflection questions will be gentle and trauma-informed. The app will move at your pace, with space to process whatever this pregnancy is bringing up.',
  faith_anchored:
    'Your reflection questions will honor your spiritual life as the foundation it is. Faith, purpose, and meaning will run through everything the app offers you.',
  supported_nurturer:
    'Your reflection questions will focus on deepening your relationships and preparing the people around you for this journey. You have support. Now let the app help you use it well.',
};

export default function PersonaRevealScreen() {
  const { persona } = useLocalSearchParams<{ persona: string }>();
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useApp();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [choosing, setChoosing] = useState<PersonaKey | null>(null);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  const personaKey = (persona as PersonaKey) in PERSONA_CONFIG
    ? (persona as PersonaKey)
    : 'supported_nurturer';
  const config = PERSONA_CONFIG[personaKey];
  const explanation = PERSONA_EXPLANATIONS[personaKey];

  function tryHaptic(style = Haptics.ImpactFeedbackStyle.Light) {
    try { Haptics.impactAsync(style); } catch {}
  }

  function handleBegin() {
    tryHaptic(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  }

  async function handleChoosePersona(selected: PersonaKey) {
    if (!profile?.id) {
      router.replace('/(tabs)');
      return;
    }
    setChoosing(selected);
    try {
      const res = await apiRequest('PATCH', `/api/users/${profile.id}`, {
        profileFlags: { ...(profile.profileFlags || {}), persona: selected },
      });
      const data = await res.json();
      await setProfile({
        ...profile,
        profileFlags: data.profileFlags ?? { ...(profile.profileFlags || {}), persona: selected },
      });
    } catch (e) {
      console.error('Error updating persona:', e);
    }
    setChoosing(null);
    setSheetOpen(false);
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + webBottomInset + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <Text style={styles.smallLabel}>Your PrePartum profile</Text>
          <Text style={styles.personaName}>{config.displayName}</Text>
          <Text style={styles.descriptionText}>{config.personaBadge.description}</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(350).duration(500)} style={styles.divider} />

        <Animated.View entering={FadeInDown.delay(450).duration(600)} style={styles.explanationWrap}>
          <Text style={styles.explanation}>{explanation}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(750).duration(500)} style={styles.buttons}>
          <Pressable
            onPress={handleBegin}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.88 }]}
            testID="persona-reveal-begin"
          >
            <Text style={styles.primaryBtnText}>This is me. Let's begin.</Text>
          </Pressable>

          <Pressable
            onPress={() => { tryHaptic(); setSheetOpen(true); }}
            hitSlop={12}
            testID="see-all-profiles"
          >
            <Text style={styles.seeAllLink}>See all 5 profiles</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setSheetOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>All 5 profiles</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
            {ALL_PERSONAS.map((key) => {
              const c = PERSONA_CONFIG[key];
              const isChosen = choosing === key;
              return (
                <View key={key} style={styles.personaRow}>
                  <View style={styles.personaRowText}>
                    <Text style={styles.personaRowName}>{c.displayName}</Text>
                    <Text style={styles.personaRowDesc}>{c.personaBadge.description}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleChoosePersona(key)}
                    style={({ pressed }) => [styles.chooseBtn, pressed && { opacity: 0.8 }]}
                    disabled={!!choosing}
                    testID={`choose-persona-${key}`}
                  >
                    {isChosen
                      ? <ActivityIndicator size="small" color="#72243E" />
                      : <Text style={styles.chooseBtnText}>Choose this one</Text>
                    }
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  },

  header: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  smallLabel: {
    fontSize: 12,
    color: '#9B8A99',
    fontFamily: 'Lato_400Regular',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  personaName: {
    fontSize: 28,
    color: '#5D5066',
    fontFamily: 'PlayfairDisplay_700Bold',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 15,
    color: '#9B8A99',
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },

  divider: {
    width: '60%',
    height: 1,
    backgroundColor: '#EDE4DF',
    marginBottom: 28,
  },

  explanationWrap: {
    marginBottom: 44,
  },
  explanation: {
    fontSize: 16,
    color: '#5D5066',
    fontFamily: 'Lato_400Regular',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },

  buttons: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#F5D6D6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    color: '#72243E',
    fontFamily: 'Lato_700Bold',
    letterSpacing: 0.2,
  },
  seeAllLink: {
    fontSize: 14,
    color: '#9B8A99',
    fontFamily: 'Lato_400Regular',
    textDecorationLine: 'underline',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: '75%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD4D0',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    color: '#5D5066',
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 16,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4DF',
    gap: 12,
  },
  personaRowText: {
    flex: 1,
    gap: 4,
  },
  personaRowName: {
    fontSize: 15,
    color: '#5D5066',
    fontFamily: 'Lato_700Bold',
  },
  personaRowDesc: {
    fontSize: 13,
    color: '#9B8A99',
    fontFamily: 'Lato_400Regular',
    lineHeight: 18,
  },
  chooseBtn: {
    backgroundColor: '#F5D6D6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 110,
    alignItems: 'center',
  },
  chooseBtnText: {
    fontSize: 13,
    color: '#72243E',
    fontFamily: 'Lato_700Bold',
  },
});
