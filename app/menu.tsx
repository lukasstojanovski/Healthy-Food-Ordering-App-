import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Alert } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useCart } from '../src/context/CartContext';

export default function MenuScreen() {
  const { restaurantId } = useLocalSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [restaurantName, setRestaurantName] = useState('');
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const { addToCart } = useCart();

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
        const data = restaurantSnap.docs[0].data();
        setRestaurantName(data.name);
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
              const fieldName = condition === 'gluten_free' ? 'contains_gluten' : condition;
              if (item[fieldName] === true) {
                return false;
              }
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

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  useEffect(() => {
    fetchMenu();
  }, [restaurantId, showAll]);

  const renderItem = ({ item }: { item: any }) => {
    const warnings: string[] = [];

    if (item.contains_gluten) warnings.push("Gluten");
    if (item.lactose_free) warnings.push("Lactose");
    if (item.nut_allergy) warnings.push("Nuts");
    if (item.cholesterol) warnings.push("High Cholesterol");
    if (item.diabetes) warnings.push("High Sugar");
    if (item.hypertension) warnings.push("High Sodium");

    const isSafe = warnings.length === 0;

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>Ingredients: {item.ingredients?.join(', ')}</Text>
        <Text>Calories: {item.calories ?? 'N/A'}</Text>
        <Text>Price: ${item.price?.toFixed(2)}</Text>

        {isSafe ? (
          <Text style={styles.safe}>✅ Safe for All</Text>
        ) : (
          <Text style={styles.warning}>⚠️ Contains: {warnings.join(', ')}</Text>
        )}

        <Button title="Add to Cart" onPress={() => addToCart(item)} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{restaurantName}'s Menu</Text>

      <Button
        title={showAll ? "Show Safe Items Only" : "Show All Items"}
        onPress={() => setShowAll((prev) => !prev)}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 15 },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '600' },
  warning: {
    color: "#b22222",
    fontWeight: "500",
    marginVertical: 5,
  },
  safe: {
    color: "green",
    fontWeight: "500",
    marginVertical: 5,
  },
});
