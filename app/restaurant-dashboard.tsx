import { View, Text, FlatList, StyleSheet, Button, Alert } from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { updateDoc, doc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { signOut } from "firebase/auth";
import { getDoc } from "firebase/firestore";



export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("new");
  const router = useRouter();


  const uid = auth.currentUser?.uid;
  const filteredOrders = orders.filter((order) => order.status === statusFilter);


  useEffect(() => {
    if (!uid) return;
  
    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", uid),
      orderBy("createdAt", "desc")
    );
  
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const orderDocs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
  
      // Fetch user data for each order (email and address)
      const enrichedOrders = await Promise.all(
        orderDocs.map(async (order) => {
          try {
            const userSnap = await getDoc(doc(db, "users", order.userId));
            const userData = userSnap.exists() ? userSnap.data() : {};
            return { ...order, customerEmail: userData.email, customerAddress: userData.address };
          } catch {
            return { ...order, customerEmail: "Unknown", customerAddress: "Unknown" };
          }
        })
      );
  
      setOrders(enrichedOrders);
    });
  
    return unsubscribe;
  }, [uid]);
  

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
    } catch (err) {
      Alert.alert("Error", "Could not update order status.");
    }
  };

  return (
    
    <View style={styles.container}>
        <Text style={styles.title}>📦 New Orders</Text>
        <Button title="➕ Add New Menu Item" onPress={() => router.push("/create-item")} />

      <View style={styles.tabs}>
  {["new", "accepted", "completed"].map((status) => (
    <Button
      key={status}
      title={status.toUpperCase()}
      onPress={() => setStatusFilter(status)}
      color={statusFilter === status ? "black" : "#aaa"}
    />
  ))}
</View>
      <FlatList
      
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
  style={[
    styles.card,
    item.status === "new" && { borderColor: "orange", backgroundColor: "#FFF7E6" },
    item.status === "accepted" && { borderColor: "#1E90FF", backgroundColor: "#E6F0FF" },
    item.status === "completed" && { borderColor: "green", backgroundColor: "#E6FFE6" },
  ]}
>
  <Text style={styles.bold}>Total: ${item.total?.toFixed(2)}</Text>
  <Text>Status: {item.status}</Text>
  <Text>👤 {item.customerEmail}</Text>
  <Text>📍 {item.customerAddress}</Text>

  {item.items?.map((food: any, i: number) => (
    <Text key={i}>• {food.name} × {food.quantity}</Text>
  ))}

  <View style={styles.buttonRow}>
    {item.status === "new" && (
      <Button title="Accept" onPress={() => updateStatus(item.id, "accepted")} />
    )}
    {item.status === "accepted" && (
      <Button title="Complete" onPress={() => updateStatus(item.id, "completed")} />
    )}
  </View>
</View>


        )}
      />
<Button title="Logout" onPress={async () => {
  await signOut(auth);
  router.replace('/login');
}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, marginBottom: 10, textAlign: "center" },
  card: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  bold: { fontWeight: "bold", fontSize: 16 },
  time: { marginTop: 8, fontSize: 12, color: "#888" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  }
});
