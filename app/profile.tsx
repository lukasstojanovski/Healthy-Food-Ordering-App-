import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';

export default function ProfileScreen() {
  const [address, setAddress] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAddress(data.address || '');
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      await updateDoc(doc(db, 'users', uid), { address });
      Alert.alert('Success', 'Address updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Delivery Address</Text>
            <TextInput
              placeholder="Enter your delivery location"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/medical-form')}
          >
            <Text style={styles.menuButtonText}>Update Medical Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => router.push('/order-history')}
          >
            <Text style={styles.menuButtonText}>View Order History</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  menuButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#B22222',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
