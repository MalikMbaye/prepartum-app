import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const CATEGORY_COLORS: Record<string, string> = {
  mindset: Colors.accentPink,
  relationships: Colors.accentBlue,
  physical: Colors.accentPeach,
};

const CATEGORY_ICONS: Record<string, string> = {
  mindset: 'brain',
  relationships: 'people',
  physical: 'body',
};

export default function ScenarioIntroScreen() {
  const insets = useSafeAreaInsets();
  const { scenarioId } = useLocalSearchParams<{ scenarioId: string }>();
  const { scenarios, createRoleplaySession } = useApp();
  const [starting, setStarting] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const scenario = scenarios.find(s => s.id === scenarioId);

  if (!scenario) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Scenario not found</Text>
        </View>
      </View>
    );
  }

  const categoryColor = CATEGORY_COLORS[scenario.category || 'mindset'] || Colors.accentPink;
  const practicePoints = (scenario.practicePoints || []) as string[];

  async function handleStart() {
    setStarting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const session = await createRoleplaySession(scenario!.id);
      router.replace({ pathname: '/roleplay-chat', params: { sessionId: session.id } });
    } catch (e) {
      console.error('Error starting session:', e);
      setStarting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.closeRow}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500)}>
          <View style={[styles.categoryChip, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryChipText}>
              {scenario.category?.charAt(0).toUpperCase()}{scenario.category?.slice(1)}
            </Text>
          </View>

          <Text style={styles.title}>{scenario.title}</Text>
          <Text style={styles.description}>{scenario.description}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={18} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>The Scenario</Text>
          </View>
          <View style={styles.scenarioCard}>
            <Text style={styles.roleLabel}>You'll be speaking with:</Text>
            <Text style={styles.roleValue}>{scenario.role}</Text>
            <View style={styles.divider} />
            <Text style={styles.contextText}>{scenario.contextSetup}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="target" size={18} color={Colors.textPrimary} />
            <Text style={styles.sectionTitle}>What You'll Practice</Text>
          </View>
          {practicePoints.map((point, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(350 + index * 80).duration(400)} style={styles.practicePointRow}>
              <View style={[styles.pointDot, { backgroundColor: categoryColor }]}>
                <Text style={styles.pointDotText}>{index + 1}</Text>
              </View>
              <Text style={styles.practicePointText}>{point}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.tipsCard}>
          <Feather name="info" size={16} color={Colors.textSecondary} />
          <Text style={styles.tipsText}>
            This is a safe space to practice. There are no wrong answers. Respond naturally and the AI will adapt to help you improve your communication.
          </Text>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(600).duration(400)} style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <Pressable
          onPress={handleStart}
          disabled={starting}
          style={({ pressed }) => [styles.startButton, { backgroundColor: categoryColor }, pressed && { opacity: 0.9 }]}
          testID="start-roleplay-button"
        >
          {starting ? (
            <ActivityIndicator color={Colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="chatbubbles" size={20} color={Colors.textPrimary} />
              <Text style={styles.startButtonText}>Begin Practice</Text>
            </>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  categoryChipText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textPrimary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 36,
    marginBottom: 12,
  },
  description: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  scenarioCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleLabel: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 4,
  },
  roleValue: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  contextText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  practicePointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  pointDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  pointDotText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  practicePointText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
    flex: 1,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.canvas,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
