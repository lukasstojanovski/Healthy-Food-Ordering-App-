import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { useCart } from '../src/context/CartContext';

export default function MenuScreen() {
  const { restaurantId } = useLocalSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const { addToCart, cartItems } = useCart();

  const fetchMenu = async () => {
    try {
      if (!restaurantId) return;

      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const profileSnap = await getDoc(doc(db, 'medical_profiles', uid));
      const profile = profileSnap.exists() ? profileSnap.data() : {};

      const restaurantSnap = await getDocs(
        query(collection(db, 'restaurants'), where('__name__', '==', restaurantId))
      );
      if (!restaurantSnap.empty) {
        setRestaurantName(restaurantSnap.docs[0].data().name);
      }

      const q = query(collection(db, 'food_items'), where('restaurantId', '==', restaurantId));
      const snap = await getDocs(q);
      const allItems = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      if (showAll) {
        setItems(allItems);
      } else {
        const filteredItems = allItems.filter((item) => {
          for (const condition in profile) {
            if (condition === 'maxCalories') {
              if (item.calories && item.calories > profile.maxCalories) {
                return false;
              }
            } else if (profile[condition] === true) {
              const fieldMap: Record<string, string> = {
                gluten_free: 'contains_gluten',
                lactose_free: 'contains_lactose',
                low_carb: 'contains_alot_of_carbs',
                low_fat: 'contains_alot_of_fat',
              };
              const fieldName = fieldMap[condition] || condition;
              if (item[fieldName] === true) return false;
            }
          }
          return true;
        });
        setItems(filteredItems);
      }

    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [restaurantId, showAll]);

  const renderItem = ({ item }: { item: any }) => {
    const warnings: string[] = [];

    if (item.contains_gluten) warnings.push("Gluten");
    if (item.contains_lactose) warnings.push("Lactose");
    if (item.nut_allergy) warnings.push("Nuts");
    if (item.cholesterol) warnings.push("High Cholesterol");
    if (item.diabetes) warnings.push("High Sugar");
    if (item.hypertension) warnings.push("High Sodium");
    if (item.contains_alot_of_carbs) warnings.push("Not Low Carb");
    if (item.contains_alot_of_fat) warnings.push("High Fat");

    const isSafe = warnings.length === 0;
    const quantityInCart = cartItems.find(i => i.id === item.id)?.quantity || 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>${item.price?.toFixed(2)}</Text>
        </View>

        <Text style={styles.ingredients}>Ingredients: {item.ingredients?.join(', ')}</Text>
        <Text style={styles.calories}>Calories: {item.calories ?? 'N/A'}</Text>

        {isSafe ? (
          <Text style={styles.safe}>✅ Safe for All</Text>
        ) : (
          <Text style={styles.warning}>⚠️ Contains: {warnings.join(', ')}</Text>
        )}

        <View style={styles.cartRow}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => addToCart(item)}
          >
            <Text style={styles.addButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          {quantityInCart > 0 && (
            <Text style={styles.cartCount}>🛒 {quantityInCart} in cart</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{restaurantName}'s Menu</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowAll(prev => !prev)}
        >
          <Text style={styles.filterButtonText}>
            {showAll ? "Show Safe Items Only" : "Show All Items"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity 
        style={styles.cartButton}
        onPress={() => router.push('/cart')}
      >
        <Text style={styles.cartButtonText}>Go to Cart 🛒</Text>
        {cartItems.length > 0 && (
          <View style={styles.cartCountBadge}>
            <Text style={styles.cartCountText}>{cartItems.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 16,
  },
  filterButton: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ingredients: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  calories: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  warning: {
    color: '#B22222',
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 8,
  },
  safe: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 8,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginRight: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cartCount: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  cartButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cartCountBadge: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0066CC',
  },
  cartCountText: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
});
