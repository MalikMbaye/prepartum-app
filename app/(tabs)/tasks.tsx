import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { getTaskCategoryLabel } from '@/lib/tasks-data';

type TabType = 'first-trimester' | 'second-trimester' | 'third-trimester' | 'general';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('first-trimester');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const filteredTasks = tasks.filter(t => t.category === activeTab);
  const completedCount = filteredTasks.filter(t => t.completed).length;
  const totalCount = filteredTasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  const tabs: { key: TabType; label: string; short: string }[] = [
    { key: 'first-trimester', label: 'First Trimester', short: '1st' },
    { key: 'second-trimester', label: 'Second Trimester', short: '2nd' },
    { key: 'third-trimester', label: 'Third Trimester', short: '3rd' },
    { key: 'general', label: 'Anytime', short: 'Any' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Preparation Board</Text>
      <Text style={styles.subtitle}>Your readiness checklist</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={styles.tabContent}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
            style={[styles.tabChip, activeTab === tab.key && styles.tabChipActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.short}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={styles.progressText}>{completedCount} of {totalCount} complete</Text>
      </View>

      {filteredTasks.map((task, index) => (
        <Animated.View key={task.id} entering={FadeInDown.delay(index * 50).duration(400)}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTask(task.id);
            }}
            style={({ pressed }) => [
              styles.taskCard,
              task.completed && styles.taskCardCompleted,
              pressed && { opacity: 0.95 },
            ]}
          >
            <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
              {task.completed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={[styles.taskText, task.completed && styles.taskTextDone]}>
              {task.title}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
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
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  tabRow: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  tabText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentPink,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 14,
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 21,
  },
  taskTextDone: {
    textDecorationLine: 'line-through' as const,
    color: Colors.textSecondary,
  },
});
