import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function PrivacyPolicy() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.date}>Last updated: February 13, 2026</Text>

          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.text}>
            When you use Top, we collect the following information:
          </Text>
          <Text style={styles.listItem}>• Account information (email, username, display name)</Text>
          <Text style={styles.listItem}>• Content you create (categories, submissions, rankings)</Text>
          <Text style={styles.listItem}>• Usage data (how you interact with the app)</Text>

          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.text}>We use your information to:</Text>
          <Text style={styles.listItem}>• Provide and maintain the Top service</Text>
          <Text style={styles.listItem}>• Allow you to create and share your rankings</Text>
          <Text style={styles.listItem}>• Enable social features like following other users</Text>
          <Text style={styles.listItem}>• Improve and personalize your experience</Text>

          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <Text style={styles.text}>
            We do not sell your personal information. Your public rankings and profile 
            information may be visible to other users based on your privacy settings. 
            Private categories are only visible to you.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement appropriate security measures to protect your personal information. 
            Your password is encrypted and never stored in plain text.
          </Text>

          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <Text style={styles.text}>You have the right to:</Text>
          <Text style={styles.listItem}>• Access your personal data</Text>
          <Text style={styles.listItem}>• Update or correct your information</Text>
          <Text style={styles.listItem}>• Delete your account and associated data</Text>
          <Text style={styles.listItem}>• Control the privacy of your categories</Text>

          <Text style={styles.sectionTitle}>6. Contact Us</Text>
          <Text style={styles.text}>
            If you have questions about this Privacy Policy, please contact us at privacy@topranking.app
          </Text>

          <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. We will notify you of 
            any changes by posting the new Privacy Policy on this page and updating the 
            "Last updated" date.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 24,
    marginLeft: 8,
  },
});
