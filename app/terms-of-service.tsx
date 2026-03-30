import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const webBottomInset = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-down" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: March 30, 2026</Text>

        <Text style={styles.intro}>
          By using PrePartum, you agree to these Terms of Service. Please read them carefully.
        </Text>

        <Text style={styles.sectionTitle}>What PrePartum Is</Text>
        <Text style={styles.body}>
          PrePartum is a prenatal wellness application designed to support your mental and emotional preparation for motherhood. It provides daily reflections, journaling tools, a memory bank, task checklists, self-discovery quizzes, and AI-assisted practice conversations.
        </Text>
        <Text style={styles.body}>
          PrePartum is not a medical application. It is not a substitute for professional mental health care, therapy, obstetric care, or any other medical or clinical service. If you are experiencing a mental health crisis or a medical emergency, please contact a qualified professional or emergency services immediately.
        </Text>

        <Text style={styles.sectionTitle}>Your Content</Text>
        <Text style={styles.body}>
          You own your journal entries, voice notes, memories, and all other content you create within PrePartum. We store your content on your behalf to provide the service. We do not claim ownership of anything you write, record, or upload.
        </Text>
        <Text style={styles.body}>
          By using the app, you grant PrePartum a limited license to store and display your content solely for the purpose of providing the service to you.
        </Text>

        <Text style={styles.sectionTitle}>Acceptable Use</Text>
        <Text style={styles.body}>
          You agree to use PrePartum only for its intended personal wellness purposes. You agree not to:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Attempt to access or misuse another user's account or data</Text>
          <Text style={styles.listItem}>• Reverse engineer, copy, or redistribute any part of the app</Text>
          <Text style={styles.listItem}>• Use the app in any way that violates applicable laws</Text>
          <Text style={styles.listItem}>• Use the AI roleplay feature to generate harmful or abusive content</Text>
        </View>

        <Text style={styles.sectionTitle}>Limitation of Liability</Text>
        <Text style={styles.body}>
          PrePartum is provided "as is" without warranties of any kind. We are not liable for any health outcomes, decisions you make based on app content, or any indirect, incidental, or consequential damages arising from your use of the app.
        </Text>
        <Text style={styles.body}>
          The wellness content in PrePartum is for informational and reflective purposes only. Always consult a qualified healthcare provider for medical questions during your pregnancy.
        </Text>

        <Text style={styles.sectionTitle}>Account Deletion</Text>
        <Text style={styles.body}>
          You may delete your account and all associated data at any time from the Settings screen. Upon deletion, your data will be permanently removed from our systems within 30 days.
        </Text>

        <Text style={styles.sectionTitle}>Governing Law</Text>
        <Text style={styles.body}>
          These Terms of Service are governed by the laws of the State of California, without regard to its conflict of law provisions.
        </Text>

        <Text style={styles.sectionTitle}>Changes to These Terms</Text>
        <Text style={styles.body}>
          We may update these Terms from time to time. We will notify you of significant changes through the app. Continued use of PrePartum after changes are posted constitutes your acceptance of the updated Terms.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          For questions about these Terms, please contact us at{' '}
          <Text style={styles.link}>support@prepartumapp.com</Text>.
        </Text>

        <Pressable
          onPress={() => Linking.openURL(`https://${process.env.EXPO_PUBLIC_DOMAIN}/terms`)}
          style={styles.webLinkRow}
        >
          <Text style={styles.webLinkText}>
            View full version at {process.env.EXPO_PUBLIC_DOMAIN}/terms
          </Text>
        </Pressable>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accentPink,
    backgroundColor: Colors.canvas,
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 18,
    color: Colors.textPrimary,
  },
  backBtn: {
    width: 36,
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  lastUpdated: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 20,
  },
  intro: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 17,
    color: Colors.textPrimary,
    marginBottom: 10,
    marginTop: 8,
  },
  body: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary ?? Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  list: {
    marginBottom: 12,
    gap: 6,
  },
  listItem: {
    fontFamily: 'Lato_400Regular',
    fontSize: 15,
    color: Colors.textSecondary ?? Colors.textPrimary,
    lineHeight: 24,
    paddingLeft: 4,
  },
  link: {
    color: '#7B6E8E',
    textDecorationLine: 'underline',
  },
  webLinkRow: {
    marginTop: 28,
    alignItems: 'center',
  },
  webLinkText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 11,
    color: '#9B8A99',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
