import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const q = query(
        collection(db, "orders"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#FFA500';
      case 'accepted':
        return '#0066CC';
      case 'completed':
        return '#2E7D32';
      default:
        return '#1A1A1A';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'new':
        return '#FFF7E6';
      case 'accepted':
        return '#E6F0FF';
      case 'completed':
        return '#E6FFE6';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.subtitle}>Track your past and current orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            let deliveryTimeText = null;

            if (item.createdAt && item.prepTimeMinutes && item.status !== "completed") {
              const orderDate = item.createdAt.toDate?.() ?? new Date(item.createdAt.seconds * 1000);
              const estimatedDeliveryDate = new Date(orderDate.getTime() + (item.prepTimeMinutes + 15) * 60000);

              deliveryTimeText = `🚚 Estimated Delivery: ${estimatedDeliveryDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}`;
            }

            return (
              <View style={[styles.card, { backgroundColor: getStatusBackground(item.status) }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                  <Text style={styles.date}>
                    {item.createdAt?.toDate?.().toLocaleDateString() ?? 
                     new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.itemsContainer}>
                  {item.items.map((food: any, i: number) => (
                    <View key={i} style={styles.itemRow}>
                      <Text style={styles.itemName}>{food.name}</Text>
                      <Text style={styles.itemQuantity}>× {food.quantity}</Text>
                    </View>
                  ))}
                </View>

                {deliveryTimeText && (
                  <Text style={styles.delivery}>{deliveryTimeText}</Text>
                )}

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.total}>${item.total?.toFixed(2)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
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
  },
  listContent: {
    padding: 24,
  },
  card: {
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
    marginBottom: 12,
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#666666',
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 8,
  },
  delivery: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666666',
  },
  total: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
