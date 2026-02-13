import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { usersApi } from '../../src/services/api';

interface Profile {
  username: string;
  displayName: string;
  bio: string | null;
  stats: { followers: number; following: number; categories: number };
  categories: Array<{ id: string; name: string; icon: string | null; submissionCount: number }>;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user?.username) {
      loadProfile();
    }
  }, [user?.username]);

  const loadProfile = async () => {
    try {
      const response = await usersApi.getProfile(user!.username);
      setProfile(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => {
        logout();
        router.replace('/(auth)/login');
      }}
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.displayName?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.stats.categories}</Text>
            <Text style={styles.statLabel}>Rankings</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Rankings</Text>
        {profile.categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.card} onPress={() => router.push(`/category/${cat.id}`)}>
            <Text style={styles.cardIcon}>{cat.icon || '📁'}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{cat.name}</Text>
              <Text style={styles.cardMeta}>{cat.submissionCount} items</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: 'white', padding: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#0ea5e9' },
  displayName: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  username: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  bio: { fontSize: 14, color: '#4b5563', marginTop: 12, textAlign: 'center' },
  stats: { flexDirection: 'row', marginTop: 20, gap: 32 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  cardIcon: { fontSize: 24, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, margin: 16, backgroundColor: 'white', borderRadius: 12, gap: 8 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' }
});
