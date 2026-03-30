import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: March 30, 2026</Text>

        <Text style={styles.intro}>
          PrePartum is a prenatal wellness tool designed to support your emotional and mental preparation for motherhood. Your privacy matters deeply to us.
        </Text>

        <Text style={styles.sectionTitle}>What We Collect</Text>
        <Text style={styles.body}>
          We collect the information you provide when using PrePartum, including:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• Your name and email address</Text>
          <Text style={styles.listItem}>• Your due date and pregnancy week</Text>
          <Text style={styles.listItem}>• Intake questionnaire responses</Text>
          <Text style={styles.listItem}>• Daily reflection answers and journal entries</Text>
          <Text style={styles.listItem}>• Photos and voice recordings you add to your memory bank</Text>
          <Text style={styles.listItem}>• A unique user ID generated when you create your account</Text>
        </View>

        <Text style={styles.sectionTitle}>Why We Collect It</Text>
        <Text style={styles.body}>
          We use your information to personalize your experience, deliver relevant daily reflections, power the app's features, and improve the quality of the content we provide. We do not use your data for advertising.
        </Text>

        <Text style={styles.sectionTitle}>Who We Share It With</Text>
        <Text style={styles.body}>
          We share your data only with the third-party services required to operate the app:
        </Text>
        <View style={styles.list}>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Neon (database storage)</Text> — your data is stored securely in a hosted PostgreSQL database</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Anthropic</Text> — used only for the AI roleplay feature, and only the content of that conversation is shared</Text>
          <Text style={styles.listItem}>• <Text style={styles.bold}>Apple / Google</Text> — for app distribution through their respective stores</Text>
        </View>
        <Text style={styles.body}>
          We never sell your data. We never share your personal information with advertisers or data brokers.
        </Text>

        <Text style={styles.sectionTitle}>How Long We Keep It</Text>
        <Text style={styles.body}>
          We retain your data for as long as your account exists. If you delete your account, all of your personal data is permanently deleted from our systems within 30 days.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.body}>
          You can delete all your data at any time from the Settings screen in the app. You may also request a copy of your data or ask us to correct inaccurate information by contacting us.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy or how your data is handled, please contact us at{' '}
          <Text style={styles.link}>privacy@prepartumapp.com</Text>.
        </Text>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            PrePartum is a wellness tool, not a medical application. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns during pregnancy.
          </Text>
        </View>

        <Pressable
          onPress={() => Linking.openURL(`https://${process.env.EXPO_PUBLIC_DOMAIN}/privacy`)}
          style={styles.webLinkRow}
        >
          <Text style={styles.webLinkText}>
            View full version at {process.env.EXPO_PUBLIC_DOMAIN}/privacy
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
  bold: {
    fontFamily: 'Lato_700Bold',
  },
  link: {
    color: '#7B6E8E',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    backgroundColor: Colors.accentPeach,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  disclaimerText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
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
