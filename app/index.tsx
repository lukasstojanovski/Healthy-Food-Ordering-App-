import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const q = query(collection(db, 'restaurants'), where('approved', '==', true));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRestaurants(list);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/menu?restaurantId=${item.id}`)}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.cuisine}>{item.cuisine}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Ionicons name="location-outline" size={16} color="#666666" />
          <Text style={styles.address}>{item.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Loading restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>Find healthy food near you</Text>
      </View>

      {restaurants.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>No restaurants available</Text>
          <Text style={styles.emptySubtext}>Check back later for updates</Text>
        </View>
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity 
        style={styles.profileButton}
        onPress={() => router.push('/profile')}
      >
        <Ionicons name="person-outline" size={20} color="#FFFFFF" />
        <Text style={styles.profileButtonText}>Profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 14,
    color: '#666666',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
  },
  profileButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
