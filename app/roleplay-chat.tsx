import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

const CATEGORY_COLORS: Record<string, string> = {
  mindset: Colors.accentPink,
  relationships: Colors.accentBlue,
  physical: Colors.accentPeach,
};

interface ChatMessage {
  role: string;
  content: string;
}

function MessageBubble({ message, isUser, scenarioRole, categoryColor }: {
  message: ChatMessage;
  isUser: boolean;
  scenarioRole: string;
  categoryColor: string;
}) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: categoryColor }]}>
          <Ionicons name="person" size={14} color={Colors.textPrimary} />
        </View>
      )}
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && <Text style={styles.roleTag}>{scenarioRole}</Text>}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{message.content}</Text>
      </View>
    </Animated.View>
  );
}

export default function RoleplayChatScreen() {
  const insets = useSafeAreaInsets();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { roleplaySessions, sendRoleplayMessage, generateRoleplayFeedback } = useApp();
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const session = roleplaySessions.find(s => s.id === sessionId);
  const scenario = session?.scenario;
  const messages = (session?.messages || []) as ChatMessage[];
  const categoryColor = CATEGORY_COLORS[scenario?.category || 'mindset'] || Colors.accentPink;
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const canFinish = userMessageCount >= 2;

  async function handleSend() {
    if (!inputText.trim() || sending || !sessionId) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await sendRoleplayMessage(sessionId, text);
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  }

  async function handleFinish() {
    if (finishing || !sessionId) return;
    setFinishing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await generateRoleplayFeedback(sessionId);
      router.replace({ pathname: '/roleplay-feedback', params: { sessionId } });
    } catch (e) {
      console.error('Error generating feedback:', e);
      setFinishing(false);
    }
  }

  if (!session || !scenario) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Session not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + webTopInset }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{scenario.title}</Text>
          <Text style={styles.headerSubtitle}>Speaking with {scenario.role}</Text>
        </View>
        {canFinish && (
          <Pressable onPress={handleFinish} disabled={finishing} hitSlop={12} style={styles.finishButton}>
            {finishing ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Feather name="check-circle" size={24} color={Colors.textPrimary} />
            )}
          </Pressable>
        )}
        {!canFinish && <View style={{ width: 24 }} />}
      </View>

      {finishing && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.finishingBanner}>
          <ActivityIndicator size="small" color={Colors.textPrimary} />
          <Text style={styles.finishingText}>Analyzing your conversation...</Text>
        </Animated.View>
      )}

      <View style={styles.contextBanner}>
        <Feather name="info" size={14} color={Colors.textSecondary} />
        <Text style={styles.contextBannerText} numberOfLines={2}>
          {scenario.contextSetup}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isUser={item.role === 'user'}
            scenarioRole={scenario.role || 'AI'}
            categoryColor={categoryColor}
          />
        )}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          sending ? (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.messageRow]}>
              <View style={[styles.avatar, { backgroundColor: categoryColor }]}>
                <Ionicons name="person" size={14} color={Colors.textPrimary} />
              </View>
              <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Colors.textSecondary} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </Animated.View>
          ) : null
        }
      />

      <View style={[styles.inputArea, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 8) }]}>
        {canFinish && !finishing && (
          <Pressable onPress={handleFinish} style={styles.endConversationButton}>
            <Text style={styles.endConversationText}>End & Get Feedback</Text>
          </Pressable>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your response..."
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={500}
            editable={!sending && !finishing}
            testID="roleplay-input"
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending || finishing}
            style={({ pressed }) => [
              styles.sendButton,
              { backgroundColor: inputText.trim() ? categoryColor : Colors.border },
              pressed && { opacity: 0.8 },
            ]}
            testID="send-message-button"
          >
            <Ionicons name="send" size={18} color={inputText.trim() ? Colors.textPrimary : Colors.textLight} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 16,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  finishButton: {
    padding: 4,
  },
  finishingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: Colors.accentPeach,
  },
  finishingText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
  },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  contextBannerText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: Colors.textPrimary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  roleTag: {
    fontFamily: 'Lato_700Bold',
    fontSize: 11,
    color: Colors.textLight,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  messageText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 21,
  },
  userMessageText: {
    color: Colors.white,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.canvas,
  },
  endConversationButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  endConversationText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
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
