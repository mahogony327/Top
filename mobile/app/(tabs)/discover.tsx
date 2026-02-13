import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { feedApi } from '../../src/services/api';

interface DiscoverItem {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  submissionCount: number;
  totalLikes: number;
  user: { username: string; displayName: string };
}

export default function Discover() {
  const [categories, setCategories] = useState<DiscoverItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await feedApi.discover();
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await feedApi.search(searchQuery);
      setSearchResults(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const renderCategory = ({ item }: { item: DiscoverItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/category/${item.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>{item.icon || '📁'}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardMeta}>@{item.user.username}</Text>
        </View>
      </View>
      {item.description && <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>}
      <View style={styles.stats}>
        <Text style={styles.stat}>{item.submissionCount} items</Text>
        <Text style={styles.stat}>❤️ {item.totalLikes}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search rankings..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {searchResults ? (
        <FlatList
          data={searchResults.categories || []}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <TouchableOpacity onPress={() => { setSearchResults(null); setSearchQuery(''); }}>
              <Text style={styles.clearSearch}>Clear search results</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadData} />}
          ListEmptyComponent={<Text style={styles.noResults}>No categories to discover yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', margin: 16, marginBottom: 0, borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, padding: 14, fontSize: 16 },
  list: { padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  cardMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  cardDesc: { fontSize: 14, color: '#6b7280', marginTop: 8 },
  stats: { flexDirection: 'row', marginTop: 12, gap: 16 },
  stat: { fontSize: 12, color: '#6b7280' },
  clearSearch: { color: '#0ea5e9', fontSize: 14, marginBottom: 12 },
  noResults: { textAlign: 'center', color: '#6b7280', paddingTop: 40 }
});
