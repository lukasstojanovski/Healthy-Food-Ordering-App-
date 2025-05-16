import { View, Text, FlatList, StyleSheet, Button, Alert, Modal, TextInput } from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("new");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [prepTimeInput, setPrepTimeInput] = useState("");
  const [showModal, setShowModal] = useState(false);
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

  const handleAccept = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowModal(true);
  };
  
  const submitPrepTime = async () => {
    const prepMinutes = parseInt(prepTimeInput);
    if (isNaN(prepMinutes) || prepMinutes <= 0) {
      Alert.alert("Invalid input", "Please enter a valid number.");
      return;
    }

    const estimatedDelivery = new Date(Date.now() + (prepMinutes + 15) * 60000).toISOString();

    try {
      await updateDoc(doc(db, "orders", selectedOrderId!), {
        status: "accepted",
        prepTimeMinutes: prepMinutes,
        estimatedDelivery,
      });
      setShowModal(false);
      setPrepTimeInput("");
    } catch (err) {
      Alert.alert("Error", "Could not update order.");
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });
    } catch {
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
                <Button title="Accept" onPress={() => handleAccept(item.id)} />
              )}
              {item.status === "accepted" && (
                <Button title="Complete" onPress={() => updateStatus(item.id, "completed")} />
              )}
            </View>
          </View>
        )}
      />

      {/* Preparation Time Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter preparation time (min):</Text>
            <TextInput
              value={prepTimeInput}
              onChangeText={setPrepTimeInput}
              keyboardType="numeric"
              placeholder="e.g. 20"
              style={styles.input}
            />
            <Button title="Confirm" onPress={submitPrepTime} />
          </View>
        </View>
      </Modal>

      <Button
        title="Logout"
        onPress={async () => {
          await signOut(auth);
          router.replace('/login');
        }}
      />
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
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 30,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
});
