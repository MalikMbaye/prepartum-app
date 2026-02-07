import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

type MemoryType = 'note' | 'photo';

const PREDEFINED_TAGS = ['First Kick', 'Doctor Visit', 'Milestone', 'Feeling Grateful', 'Partner Moment'];

export default function NewMemoryScreen() {
  const insets = useSafeAreaInsets();
  const { addMemory } = useApp();
  const [memoryType, setMemoryType] = useState<MemoryType>('note');
  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  function toggleTag(tag: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function addCustomTag() {
    const tag = customTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          setPhotoUri(`data:${mimeType};base64,${asset.base64}`);
        } else {
          setPhotoUri(asset.uri);
        }
      }
    } catch (e) {
      console.error('Error picking image:', e);
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        base64: true,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          setPhotoUri(`data:${mimeType};base64,${asset.base64}`);
        } else {
          setPhotoUri(asset.uri);
        }
      }
    } catch (e) {
      console.error('Error taking photo:', e);
    }
  }

  const canSave = memoryType === 'note' ? content.trim().length > 0 : (photoUri !== null || content.trim().length > 0);

  async function handleSave() {
    if (!canSave || isSaving) return;
    setIsSaving(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addMemory({
        content: content.trim() || (memoryType === 'photo' ? 'Photo memory' : ''),
        type: memoryType,
        tags,
        mediaUrl: photoUri || undefined,
      });
      setSaved(true);
      setTimeout(() => router.back(), 1500);
    } catch (e) {
      console.error('Error saving memory:', e);
      setIsSaving(false);
    }
  }

  if (saved) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.savedContainer}>
          <Animated.View entering={ZoomIn.delay(200).duration(400)}>
            <View style={styles.savedCircle}>
              <Ionicons name="checkmark" size={32} color={Colors.textPrimary} />
            </View>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(400).duration(400)} style={styles.savedTitle}>
            Memory saved
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(550).duration(400)} style={styles.savedBody}>
            This moment is now preserved in your memory bank
          </Animated.Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Memory</Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || isSaving}
          style={({ pressed }) => [
            styles.saveButton,
            (!canSave || isSaving) && { opacity: 0.4 },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Memory'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Type</Text>
          <View style={styles.typeRow}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMemoryType('note'); }}
              style={[styles.typeCard, memoryType === 'note' && styles.typeCardActive]}
            >
              <View style={[styles.typeIconWrap, memoryType === 'note' && { backgroundColor: Colors.accentPeach }]}>
                <Feather name="edit-3" size={20} color={Colors.textPrimary} />
              </View>
              <Text style={[styles.typeLabel, memoryType === 'note' && styles.typeLabelActive]}>Note</Text>
            </Pressable>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMemoryType('photo'); }}
              style={[styles.typeCard, memoryType === 'photo' && styles.typeCardActive]}
            >
              <View style={[styles.typeIconWrap, memoryType === 'photo' && { backgroundColor: Colors.accentPink }]}>
                <Feather name="camera" size={20} color={Colors.textPrimary} />
              </View>
              <Text style={[styles.typeLabel, memoryType === 'photo' && styles.typeLabelActive]}>Photo</Text>
            </Pressable>
          </View>

          {memoryType === 'photo' && (
            <>
              {photoUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    style={styles.removePhotoButton}
                  >
                    <Feather name="x" size={16} color={Colors.white} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.photoActions}>
                  <Pressable
                    onPress={takePhoto}
                    style={({ pressed }) => [styles.photoActionButton, pressed && { opacity: 0.9 }]}
                  >
                    <Feather name="camera" size={22} color={Colors.textPrimary} />
                    <Text style={styles.photoActionText}>Take Photo</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickImage}
                    style={({ pressed }) => [styles.photoActionButton, pressed && { opacity: 0.9 }]}
                  >
                    <Feather name="image" size={22} color={Colors.textPrimary} />
                    <Text style={styles.photoActionText}>Choose from Library</Text>
                  </Pressable>
                </View>
              )}

              <Text style={styles.sectionLabel}>Caption</Text>
            </>
          )}

          <TextInput
            style={[styles.contentInput, memoryType === 'photo' && { minHeight: 80 }]}
            value={content}
            onChangeText={setContent}
            placeholder={memoryType === 'photo' ? 'Add a caption...' : 'What do you want to remember?'}
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
            autoFocus={memoryType === 'note'}
            testID="memory-content-input"
          />

          <Text style={styles.sectionLabel}>Tags</Text>
          <View style={styles.predefinedTags}>
            {PREDEFINED_TAGS.map(tag => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.preTag, tags.includes(tag) && styles.preTagActive]}
              >
                <Text style={[styles.preTagText, tags.includes(tag) && styles.preTagTextActive]}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.customTagRow}>
            <TextInput
              style={styles.customTagInput}
              value={customTag}
              onChangeText={setCustomTag}
              placeholder="Add custom tag..."
              placeholderTextColor={Colors.textLight}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
            />
            {customTag.trim() ? (
              <Pressable onPress={addCustomTag} style={styles.addTagBtn}>
                <Ionicons name="add" size={18} color={Colors.textPrimary} />
              </Pressable>
            ) : null}
          </View>

          {tags.filter(t => !PREDEFINED_TAGS.includes(t)).length > 0 && (
            <View style={styles.customTagsDisplay}>
              {tags.filter(t => !PREDEFINED_TAGS.includes(t)).map(tag => (
                <Pressable key={tag} onPress={() => toggleTag(tag)} style={styles.customTagBadge}>
                  <Text style={styles.customTagBadgeText}>{tag}</Text>
                  <Feather name="x" size={12} color={Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
          )}
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
  headerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.accentPink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  typeCardActive: {
    borderColor: Colors.textPrimary,
  },
  typeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontFamily: 'Lato_700Bold',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  typeLabelActive: {
    color: Colors.textPrimary,
  },

  photoActions: {
    gap: 10,
    marginBottom: 20,
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoActionText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  photoPreviewWrap: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.border,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contentInput: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 26,
    minHeight: 140,
    backgroundColor: Colors.cardBg,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
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
  customTagsDisplay: {
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

  savedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  savedCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accentPink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  savedTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  savedBody: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
