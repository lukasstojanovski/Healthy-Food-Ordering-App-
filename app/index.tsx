import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Modal, Pressable, TextInput } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, onSnapshot, doc, getDoc, DocumentData } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { signOut } from 'firebase/auth';

interface Order {
  id: string;
  status: string;
  total: number;
  estimatedDelivery?: string;
  restaurantId: string;
  restaurantName: string;
}

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const q = query(collection(db, 'restaurants'), where('approved', '==', true));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRestaurants(list);
        setFilteredRestaurants(list);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRestaurants(restaurants);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.cuisine.toLowerCase().includes(query)
    );
    setFilteredRestaurants(filtered);
  }, [searchQuery, restaurants]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      where('status', 'in', ['new', 'accepted'])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const orders = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const orderData = docSnapshot.data();
          const restaurantDoc = await getDoc(doc(db, 'restaurants', orderData.restaurantId));
          const restaurantData = restaurantDoc.exists() ? restaurantDoc.data() as DocumentData : {};
          return {
            id: docSnapshot.id,
            ...orderData,
            restaurantName: restaurantData.name || 'Unknown Restaurant'
          } as Order;
        })
      );
      setActiveOrders(orders);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/menu?restaurantId=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <View style={[styles.cuisineBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.cuisine, { color: colors.primary }]}>{item.cuisine}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={[styles.address, { color: colors.textSecondary }]}>{item.address}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewMenuButton}
            onPress={() => router.push(`/menu?restaurantId=${item.id}`)}
          >
            <Text style={[styles.viewMenuText, { color: colors.primary }]}>View Menu</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderActiveOrder = ({ item }: { item: Order }) => (
    <View style={[styles.activeOrderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.activeOrderContent}>
        <View style={styles.activeOrderHeader}>
          <View style={styles.restaurantInfo}>
            <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
            <Text style={[styles.activeOrderRestaurant, { color: colors.text }]}>{item.restaurantName}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'accepted' ? colors.primaryLight : '#FFF4E6' }
          ]}>
            <Text style={[
              styles.activeOrderStatus,
              { color: item.status === 'accepted' ? colors.primary : '#FFA500' }
            ]}>
              {item.status === 'accepted' ? 'Preparing' : 'Pending'}
            </Text>
          </View>
        </View>
        <View style={styles.activeOrderDetails}>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
            <Text style={[styles.activeOrderTotal, { color: colors.text }]}>${item.total?.toFixed(2)}</Text>
          </View>
          {item.estimatedDelivery && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.activeOrderTime, { color: colors.textSecondary }]}>
                {new Date(item.estimatedDelivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading restaurants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Find healthy food near you</Text>
        </View>
        <View style={[styles.headerDecoration, { backgroundColor: colors.primary }]} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search restaurants or cuisines..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredRestaurants}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="restaurant-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>No restaurants found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try adjusting your search
            </Text>
          </View>
        }
      />

      {activeOrders.length > 0 && (
        <TouchableOpacity
          style={[styles.activeOrdersButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.activeOrdersButtonContent}>
            <Ionicons name="time-outline" size={24} color="#FFFFFF" />
            <Text style={styles.activeOrdersButtonText}>Active Orders</Text>
            <View style={styles.activeOrdersBadge}>
              <Text style={styles.activeOrdersBadgeText}>{activeOrders.length}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {userRole === 'admin' && (
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <View style={styles.logoutButtonContent}>
            <Ionicons name="log-out-outline" size={24} color={colors.text} />
            <Text style={[styles.logoutButtonText, { color: colors.text }]}>Logout</Text>
          </View>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Active Orders</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeButton, { backgroundColor: colors.background }]}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={activeOrders}
              keyExtractor={item => item.id}
              renderItem={renderActiveOrder}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  headerDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#0066CC',
    opacity: 0.1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  listContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  cuisineBadge: {
    backgroundColor: '#E6F0FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  cuisine: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: 14,
    color: '#666666',
  },
  viewMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMenuText: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
  activeOrdersButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: '#0066CC',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  activeOrdersButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  activeOrdersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeOrdersBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  activeOrdersBadgeText: {
    color: '#0066CC',
    fontSize: 12,
    fontWeight: '700',
  },
  profileButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0066CC',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  modalList: {
    paddingHorizontal: 24,
  },
  activeOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  activeOrderContent: {
    padding: 20,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeOrderRestaurant: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeOrderStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeOrderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalContainer: {
    gap: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
  },
  activeOrderTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeOrderTime: {
    fontSize: 14,
    color: '#666666',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
