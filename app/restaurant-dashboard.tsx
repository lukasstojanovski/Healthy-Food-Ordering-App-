import { View, Text, FlatList, StyleSheet, Alert, Modal, TextInput, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./context/ThemeContext";

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("new");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [prepTimeInput, setPrepTimeInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const { colors, isDark } = useTheme();

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
            return { 
              ...order, 
              customerEmail: userData.email, 
              customerAddress: userData.address,
              customerPhone: userData.phone || "Not provided"
            };
          } catch {
            return { 
              ...order, 
              customerEmail: "Unknown", 
              customerAddress: "Unknown",
              customerPhone: "Unknown"
            };
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

  const renderTabBar = () => (
    <View style={[styles.statusFilters, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      {["new", "accepted", "completed"].map((status) => (
        <TouchableOpacity
          key={status}
          style={[
            styles.statusFilter,
            statusFilter === status && { backgroundColor: colors.primaryLight }
          ]}
          onPress={() => setStatusFilter(status)}
        >
          <Ionicons 
            name={
              status === 'new' ? 'time-outline' :
              status === 'accepted' ? 'checkmark-circle-outline' :
              'checkmark-done-circle-outline'
            }
            size={20}
            color={statusFilter === status ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.statusFilterText,
            { color: statusFilter === status ? colors.primary : colors.textSecondary }
          ]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Restaurant Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your orders and menu</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/create-item")}
        >
          <Text style={styles.addButtonText}>➕ Add Menu Item</Text>
        </TouchableOpacity>
      </View>

      {renderTabBar()}

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No {statusFilter} orders</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
                <Text style={[styles.total, { color: colors.text }]}>${item.total?.toFixed(2)}</Text>
              </View>

              <View style={styles.customerInfo}>
                <Text style={[styles.customerEmail, { color: colors.text }]}>👤 {item.customerEmail}</Text>
                <Text style={[styles.customerAddress, { color: colors.textSecondary }]}>📍 {item.customerAddress}</Text>
                <Text style={[styles.customerPhone, { color: colors.textSecondary }]}>📱 {item.customerPhone}</Text>
              </View>

              <View style={styles.itemsContainer}>
                {item.items?.map((food: any, i: number) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={[styles.itemName, { color: colors.text }]}>{food.name}</Text>
                    <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>× {food.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.buttonRow}>
                {item.status === "new" && (
                  <TouchableOpacity 
                    style={[styles.button, styles.acceptButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.buttonText}>Accept Order</Text>
                  </TouchableOpacity>
                )}
                {item.status === "accepted" && (
                  <TouchableOpacity 
                    style={[styles.button, styles.completeButton, { backgroundColor: '#2E7D32' }]}
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
        <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Enter Preparation Time</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>How many minutes will it take to prepare this order?</Text>
            
            <TextInput
              value={prepTimeInput}
              onChangeText={setPrepTimeInput}
              keyboardType="numeric"
              placeholder="e.g. 20"
              style={[styles.input, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholderTextColor={colors.textSecondary}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.textSecondary }]}
                onPress={() => {
                  setShowModal(false);
                  setPrepTimeInput("");
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={submitPrepTime}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={async () => {
          await signOut(auth);
          router.replace('/login');
        }}
      >
        <Text style={[styles.logoutButtonText, { color: colors.text }]}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  actions: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  statusFilter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
  },
  listContent: {
    padding: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
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
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerEmail: {
    fontSize: 16,
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 16,
  },
  customerPhone: {
    fontSize: 16,
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
    flex: 1,
  },
  itemQuantity: {
    fontSize: 16,
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
    padding: 24,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
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
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
