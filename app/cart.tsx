import React from 'react';
import { View, Text, FlatList, Button, Alert, StyleSheet } from 'react-native';
import { useCart } from "../src/context/CartContext";
import { auth, db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function CartScreen() {
    const { cartItems, clearCart, removeFromCart, addToCart, decreaseQuantity } = useCart();

    const router = useRouter();

  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity || 0), 0);


  const handlePlaceOrder = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      await addDoc(collection(db, 'orders'), {
        userId: uid,
        restaurantId: cartItems[0]?.restaurantId || null,
        items: cartItems,
        total,
        status: "new", // 👈 added status field
        createdAt: serverTimestamp(),
      });
      

      Alert.alert('Order placed!');
      clearCart();
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Order failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Cart</Text>
      <FlatList
  data={cartItems}
  keyExtractor={(_, i) => i.toString()}
  renderItem={({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>Ingredients: {item.ingredients?.join(', ')}</Text>
      <Text>Price: ${item.price?.toFixed(2)}</Text>
      <Text>Quantity: {item.quantity}</Text>
      <View style={styles.quantityRow}>
        <Button title="−" onPress={() => decreaseQuantity(item.id)} />
        <View style={{ width: 10 }} />
        <Button title="+" onPress={() => addToCart(item)} />
      </View>
    </View>
  )}
/>
      <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      <Button title="Place Order" onPress={handlePlaceOrder} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 10 },
  card: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '600' },
  total: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 15 },
  quantityRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10,}
});
