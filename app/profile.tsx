import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.label}>Address / Location</Text>
      <TextInput
        placeholder="Enter your location"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />

      <Button title="Save Address" onPress={handleSave} />

      <View style={{ height: 20 }} />
      <Button title="Update Medical Profile" onPress={() => router.push('/medical-form')} />

      <View style={{ height: 20 }} />
      <Button title="View Order History" onPress={() => router.push('/order-history')} />

      <View style={{ height: 20 }} />
      <Button title="Logout" color="#b22222" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  label: { marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
});
