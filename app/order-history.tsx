import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={[
                styles.card,
                item.status === "new" && { borderColor: "orange", backgroundColor: "#FFF7E6" },
                item.status === "accepted" && { borderColor: "#1E90FF", backgroundColor: "#E6F0FF" },
                item.status === "completed" && { borderColor: "green", backgroundColor: "#E6FFE6" },
              ]}
          >
            <Text>Status: {item.status}</Text>
            {item.items.map((food: any, i: number) => (
              <Text key={i}>• {food.name} × {food.quantity}</Text>
            ))}
            <Text style={styles.total}>Total: ${item.total?.toFixed(2)}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 15, textAlign: 'center' },
  card: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  total: { marginTop: 5, fontWeight: 'bold' },
});
