import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';


export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      const q = query(collection(db, 'restaurants'), where('approved', '==', true));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRestaurants(list);
    };

    fetchRestaurants();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/menu?restaurantId=${item.id}`)} // future: dynamic menu per restaurant
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.cuisine}>Cuisine: {item.cuisine}</Text>
      <Text style={styles.address}>📍 {item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Button
  title="View Order History"
  onPress={() => router.push("/order-history")}
/>

      <Text style={styles.title}>Suggested Restaurants</Text>

      <FlatList
        data={restaurants}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: '600' },
  cuisine: { fontSize: 14, color: '#555' },
  address: { marginTop: 4, fontSize: 13, color: '#888' },
});
