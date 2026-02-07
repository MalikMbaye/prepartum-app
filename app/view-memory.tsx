import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const PREDEFINED_TAGS = ['First Kick', 'Doctor Visit', 'Milestone', 'Feeling Grateful', 'Partner Moment'];

export default function ViewMemoryScreen() {
  const insets = useSafeAreaInsets();
  const { memoryId } = useLocalSearchParams<{ memoryId: string }>();
  const { memories, updateMemory, deleteMemory } = useApp();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const memory = memories.find(m => m.id === memoryId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(memory?.content || '');
  const [editTags, setEditTags] = useState<string[]>(memory?.tags || []);
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (memory) {
      setEditContent(memory.content);
      setEditTags(memory.tags || []);
    }
  }, [memory?.content, memory?.tags]);

  if (!memory) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Memory not found</Text>
          <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
            <Text style={styles.goBackText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isPhoto = memory.type === 'photo' && memory.mediaUrl;
  const dateStr = memory.createdAt
    ? new Date(memory.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  function toggleTag(tag: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function addCustomTagEntry() {
    const tag = customTag.trim();
    if (tag && !editTags.includes(tag)) {
      setEditTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  }

  async function handleSaveEdit() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateMemory(memory!.id, {
        content: editContent.trim(),
        tags: editTags,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } catch (e) {
      console.error('Error updating memory:', e);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === 'web') {
      if (confirm('Delete this memory? This cannot be undone.')) {
        deleteMemory(memory!.id);
        router.back();
      }
    } else {
      Alert.alert(
        'Delete Memory',
        'Are you sure? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteMemory(memory!.id);
              router.back();
            },
          },
        ]
      );
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <Pressable
                onPress={() => { setIsEditing(false); setEditContent(memory.content); setEditTags(memory.tags || []); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={isSaving}
                style={[styles.saveEditBtn, isSaving && { opacity: 0.4 }]}
              >
                <Text style={styles.saveEditText}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsEditing(true); }} hitSlop={8}>
                <Feather name="edit-2" size={20} color={Colors.textPrimary} />
              </Pressable>
              <Pressable onPress={handleDelete} hitSlop={8}>
                <Feather name="trash-2" size={20} color={Colors.error} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)}>
            <Text style={styles.dateText}>{dateStr}</Text>
          </Animated.View>

          {isPhoto && (
            <Animated.View entering={FadeInUp.delay(200).duration(400)}>
              <Image source={{ uri: memory.mediaUrl! }} style={styles.fullPhoto} resizeMode="cover" />
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                textAlignVertical="top"
                autoFocus
              />
            ) : (
              <Text style={styles.contentText}>{memory.content}</Text>
            )}
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)}>
            {isEditing ? (
              <>
                <Text style={styles.sectionLabel}>Tags</Text>
                <View style={styles.predefinedTags}>
                  {PREDEFINED_TAGS.map(tag => (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.preTag, editTags.includes(tag) && styles.preTagActive]}
                    >
                      <Text style={[styles.preTagText, editTags.includes(tag) && styles.preTagTextActive]}>{tag}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.customTagRow}>
                  <TextInput
                    style={styles.customTagInput}
                    value={customTag}
                    onChangeText={setCustomTag}
                    placeholder="Custom tag..."
                    placeholderTextColor={Colors.textLight}
                    onSubmitEditing={addCustomTagEntry}
                    returnKeyType="done"
                  />
                  {customTag.trim() ? (
                    <Pressable onPress={addCustomTagEntry} style={styles.addTagBtn}>
                      <Ionicons name="add" size={18} color={Colors.textPrimary} />
                    </Pressable>
                  ) : null}
                </View>

                {editTags.filter(t => !PREDEFINED_TAGS.includes(t)).length > 0 && (
                  <View style={styles.customTagsRow}>
                    {editTags.filter(t => !PREDEFINED_TAGS.includes(t)).map(tag => (
                      <Pressable key={tag} onPress={() => toggleTag(tag)} style={styles.customTagBadge}>
                        <Text style={styles.customTagBadgeText}>{tag}</Text>
                        <Feather name="x" size={12} color={Colors.textSecondary} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            ) : (
              (memory.tags || []).length > 0 && (
                <View style={styles.tagsDisplay}>
                  {(memory.tags || []).map((tag, i) => (
                    <View key={i} style={styles.displayTag}>
                      <Text style={styles.displayTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  saveEditBtn: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveEditText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  dateText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  fullPhoto: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    marginBottom: 24,
    backgroundColor: Colors.border,
  },
  contentText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 28,
    marginBottom: 24,
  },
  editInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 160,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  predefinedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  preTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preTagActive: {
    backgroundColor: Colors.accentPink,
    borderColor: Colors.accentPink,
  },
  preTagText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  preTagTextActive: {
    color: Colors.textPrimary,
    fontFamily: 'Lato_700Bold',
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customTagInput: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addTagBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customTagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customTagBadgeText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  displayTag: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  displayTagText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  goBackBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.accentPink,
    borderRadius: 20,
  },
  goBackText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
});
