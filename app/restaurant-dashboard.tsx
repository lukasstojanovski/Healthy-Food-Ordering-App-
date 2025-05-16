import { View, Text, FlatList, StyleSheet, Alert, Modal, TextInput, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
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
        <Text style={styles.title}>Restaurant Dashboard</Text>
        <Text style={styles.subtitle}>Manage your orders and menu</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push("/create-item")}
        >
          <Text style={styles.addButtonText}>➕ Add Menu Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["new", "accepted", "completed"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.tab,
              statusFilter === status && styles.activeTab
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[
              styles.tabText,
              statusFilter === status && styles.activeTabText
            ]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {statusFilter} orders</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: getStatusBackground(item.status) }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
                <Text style={styles.total}>${item.total?.toFixed(2)}</Text>
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerEmail}>👤 {item.customerEmail}</Text>
                <Text style={styles.customerAddress}>📍 {item.customerAddress}</Text>
              </View>

              <View style={styles.itemsContainer}>
                {item.items?.map((food: any, i: number) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName}>{food.name}</Text>
                    <Text style={styles.itemQuantity}>× {food.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.buttonRow}>
                {item.status === "new" && (
                  <TouchableOpacity 
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.buttonText}>Accept Order</Text>
                  </TouchableOpacity>
                )}
                {item.status === "accepted" && (
                  <TouchableOpacity 
                    style={[styles.button, styles.completeButton]}
                    onPress={() => updateStatus(item.id, "completed")}
                  >
                    <Text style={styles.buttonText}>Complete Order</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Preparation Time</Text>
            <Text style={styles.modalSubtitle}>How many minutes will it take to prepare this order?</Text>
            
            <TextInput
              value={prepTimeInput}
              onChangeText={setPrepTimeInput}
              keyboardType="numeric"
              placeholder="e.g. 20"
              style={styles.input}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setPrepTimeInput("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]}
                onPress={submitPrepTime}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={async () => {
          await signOut(auth);
          router.replace('/login');
        }}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  actions: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  addButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  activeTabText: {
    color: '#1A1A1A',
    fontWeight: '600',
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
  total: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerEmail: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 16,
    color: '#666666',
  },
  itemsContainer: {
    marginBottom: 16,
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#0066CC',
  },
  completeButton: {
    backgroundColor: '#2E7D32',
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  confirmButton: {
    backgroundColor: '#0066CC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
});
