import React, { useState } from 'react';
import {
  View, Text, FlatList, Alert, StyleSheet, Modal, Pressable, TouchableOpacity, SafeAreaView
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        {cartItems.length > 0 && (
          <Text style={styles.subtitle}>{cartItems.length} items</Text>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => router.back()}
          >
            <Text style={styles.browseButtonText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.price}>${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                
                <Text style={styles.ingredients}>Ingredients: {item.ingredients?.join(', ')}</Text>
                
                <View style={styles.quantityRow}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => decreaseQuantity(item.id)}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => addToCart(item)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>${total.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.orderButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.orderButtonText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal
        transparent
        animationType="fade"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Payment Method</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => placeOrderWithMethod("Cash")}
            >
              <Text style={styles.modalButtonText}>💵 Pay Cash at Delivery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    backgroundColor: '#F5F5F5',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666666',
  },
  total: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  orderButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
});
