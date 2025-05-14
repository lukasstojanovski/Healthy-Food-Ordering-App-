import React, { useState } from 'react';
import {
  View, Text, FlatList, Button, Alert, StyleSheet, Modal, Pressable
} from 'react-native';
import { useCart } from "../src/context/CartContext";
import { auth, db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const { cartItems, clearCart, removeFromCart, addToCart, decreaseQuantity } = useCart();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity || 0), 0);

  const placeOrderWithMethod = async (paymentMethod: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      await addDoc(collection(db, 'orders'), {
        userId: uid,
        restaurantId: cartItems[0]?.restaurantId || null,
        items: cartItems,
        total,
        paymentMethod,
        status: "new",
        createdAt: serverTimestamp(),
      });

      setShowModal(false);
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
      <Button title="Place Order" onPress={() => setShowModal(true)} />

      {/* Payment Method Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Payment Method</Text>

            <Pressable
              style={styles.modalButton}
              onPress={() => placeOrderWithMethod("Cash")}
            >
              <Text style={styles.modalButtonText}>💵 Pay Cash at Delivery</Text>
            </Pressable>

            <Button title="Cancel" color="#999" onPress={() => setShowModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 10 },
  card: {
    borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 12
  },
  name: { fontSize: 18, fontWeight: '600' },
  total: {
    fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 15
  },
  quantityRow: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10
  },
  modalBackground: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)'
  },
  modalBox: {
    backgroundColor: 'white', padding: 25, borderRadius: 10, width: '80%', alignItems: 'center'
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalButton: {
    backgroundColor: '#007bff', padding: 12, borderRadius: 6, marginVertical: 8, width: '100%'
  },
  modalButtonText: {
    color: 'white', fontSize: 16, textAlign: 'center'
  }
});
