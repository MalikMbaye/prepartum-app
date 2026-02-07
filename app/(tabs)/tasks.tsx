import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'first-trimester', label: '1st Trimester' },
  { key: 'second-trimester', label: '2nd Trimester' },
  { key: 'third-trimester', label: '3rd Trimester' },
  { key: 'hospital-bag', label: 'Hospital Bag' },
  { key: 'partner-prep', label: 'Partner Prep' },
  { key: 'postpartum', label: 'Postpartum' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

function getCategoryColor(category: string): string {
  switch (category) {
    case 'first-trimester': return Colors.accentPink;
    case 'second-trimester': return Colors.accentBlue;
    case 'third-trimester': return Colors.accentPeach;
    case 'hospital-bag': return '#D4E2D4';
    case 'partner-prep': return '#D6D4E8';
    case 'postpartum': return '#E8D4D6';
    default: return Colors.border;
  }
}

interface TaskItemProps {
  task: {
    id: string;
    completed: boolean | null;
    task: {
      id: string;
      title: string;
      description: string | null;
      category: string;
      isTemplate: boolean | null;
    };
  };
  index: number;
  onToggle: (id: string) => void;
}

function TaskItem({ task, index, onToggle }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasDescription = !!task.task.description;
  const catColor = getCategoryColor(task.task.category);

  return (
    <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
      <View style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(task.id);
          }}
          style={styles.taskMainRow}
          testID={`task-toggle-${index}`}
        >
          <View style={[styles.checkbox, task.completed && styles.checkboxDone]}>
            {task.completed && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </View>
          <View style={styles.taskTextCol}>
            <View style={styles.taskTitleRow}>
              <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
              <Text style={[styles.taskText, task.completed && styles.taskTextDone]} numberOfLines={expanded ? undefined : 2}>
                {task.task.title}
              </Text>
            </View>
          </View>
          {hasDescription && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExpanded(!expanded);
              }}
              hitSlop={8}
              style={styles.expandButton}
            >
              <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textLight} />
            </Pressable>
          )}
        </Pressable>

        {expanded && hasDescription && (
          <View style={styles.descriptionWrap}>
            <Text style={styles.descriptionText}>{task.task.description}</Text>
          </View>
        )}

        {!task.task.isTemplate && (
          <View style={styles.customBadge}>
            <Text style={styles.customBadgeText}>Custom</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, refreshing, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState<CategoryKey>('all');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const filteredTasks = useMemo(() => {
    const filtered = activeTab === 'all' ? tasks : tasks.filter(t => t.task?.category === activeTab);
    const incomplete = filtered.filter(t => !t.completed);
    const complete = filtered.filter(t => t.completed);
    return { incomplete, complete, all: filtered };
  }, [tasks, activeTab]);

  const completedCount = filteredTasks.complete.length;
  const totalCount = filteredTasks.all.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Task Board</Text>
            <Text style={styles.subtitle}>Prepare at your own pace</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/add-task'); }}
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}
            testID="add-task-button"
          >
            <Ionicons name="add" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.key}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(cat.key); }}
              style={[styles.tabChip, activeTab === cat.key && styles.tabChipActive]}
              testID={`tab-${cat.key}`}
            >
              <Text style={[styles.tabText, activeTab === cat.key && styles.tabTextActive]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
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
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` as any }]} />
          </View>
          <Text style={styles.progressText}>
            {completedCount} of {totalCount} complete
          </Text>
        </View>

        {totalCount === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="check-circle" size={40} color={Colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyBody}>Tasks will appear here once your account is set up</Text>
          </View>
        ) : (
          <>
            {filteredTasks.incomplete.map((task, index) => (
              <TaskItem key={task.id} task={task} index={index} onToggle={toggleTask} />
            ))}

            {filteredTasks.complete.length > 0 && (
              <View style={styles.completedSection}>
                <View style={styles.completedDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.completedLabel}>Completed ({filteredTasks.complete.length})</Text>
                  <View style={styles.dividerLine} />
                </View>

                {filteredTasks.complete.map((task, index) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    index={filteredTasks.incomplete.length + index}
                    onToggle={toggleTask}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentPeach,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabContainer: {
    paddingVertical: 12,
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
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

  listContent: {
    paddingHorizontal: 20,
  },

  progressContainer: {
    marginBottom: 20,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  taskCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  taskCardCompleted: {
    opacity: 0.55,
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
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
  expandButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  descriptionWrap: {
    marginTop: 10,
    marginLeft: 44,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  descriptionText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  customBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.accentPeach,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  customBadgeText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },

  completedSection: {
    marginTop: 8,
  },
  completedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  completedLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 12,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
    color: Colors.textPrimary,
  },
  emptyBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
