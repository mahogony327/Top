import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { categoriesApi, submissionsApi } from '../../src/services/api';

interface Submission {
  id: string;
  title: string;
  description: string | null;
  rank: number;
  likeCount: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  maxItems: number;
  isOwner: boolean;
  user: { username: string };
  submissions: Submission[];
}

export default function CategoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await categoriesApi.get(id);
      setCategory(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Category not found');
      router.back();
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !category) return;

    try {
      const response = await submissionsApi.create({
        categoryId: category.id,
        title: newTitle,
        description: newDescription || undefined
      });
      setCategory({
        ...category,
        submissions: [...category.submissions, { ...response.data, likeCount: 0 }]
      });
      setShowAddModal(false);
      setNewTitle('');
      setNewDescription('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add');
    }
  };

  const handleDelete = (subId: string) => {
    Alert.alert('Remove', 'Remove this from your rankings?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await submissionsApi.delete(subId);
            if (category) {
              setCategory({
                ...category,
                submissions: category.submissions.filter(s => s.id !== subId).map((s, i) => ({ ...s, rank: i + 1 }))
              });
            }
          } catch {
            Alert.alert('Error', 'Failed to remove');
          }
        }
      }
    ]);
  };

  const renderSubmission = ({ item }: { item: Submission }) => (
    <TouchableOpacity
      style={styles.item}
      onLongPress={() => category?.isOwner && handleDelete(item.id)}
    >
      <Text style={styles.rank}>#{item.rank}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.description && <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>}
      </View>
      <Text style={styles.likes}>❤️ {item.likeCount}</Text>
    </TouchableOpacity>
  );

  if (!category) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: category.name,
        headerBackTitle: 'Back'
      }} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>{category.icon || '📁'}</Text>
          <Text style={styles.title}>{category.name}</Text>
          {category.description && <Text style={styles.desc}>{category.description}</Text>}
          {!category.isOwner && <Text style={styles.author}>by @{category.user.username}</Text>}
        </View>

        <FlatList
          data={category.submissions}
          keyExtractor={(item) => item.id}
          renderItem={renderSubmission}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyText}>No rankings yet</Text>
            </View>
          }
        />

        {category.isOwner && category.submissions.length < category.maxItems && (
          <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        )}

        <Modal visible={showAddModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Add to Rankings</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                value={newTitle}
                onChangeText={setNewTitle}
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                  <Text style={styles.addText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: 'white', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  desc: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  author: { fontSize: 12, color: '#0ea5e9', marginTop: 8 },
  list: { padding: 16 },
  item: { backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  rank: { fontSize: 20, fontWeight: 'bold', color: '#0ea5e9', width: 40 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  itemDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  likes: { fontSize: 14, color: '#6b7280' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#6b7280' },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#0ea5e9', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 20 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', marginTop: 12 },
  cancelBtn: { flex: 1, padding: 16, alignItems: 'center' },
  cancelText: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
  addBtn: { flex: 1, backgroundColor: '#0ea5e9', borderRadius: 12, padding: 16, alignItems: 'center' },
  addText: { color: 'white', fontSize: 16, fontWeight: '600' }
});
