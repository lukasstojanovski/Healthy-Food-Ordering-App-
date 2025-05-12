import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');


  const handleCreateRestaurant = async () => {
    try {
      // Create Firebase Auth account for restaurant
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const restaurantId = userCred.user.uid;

      // Create restaurant record
      await setDoc(doc(db, 'users', restaurantId), {
        email,
        role: 'restaurant',
      });

      await setDoc(doc(db, 'restaurants', restaurantId), {
        name,
        cuisine,
        email,
        address,
        userId: restaurantId,
        approved: true,
      });

      Alert.alert('Restaurant account created!');
      setEmail('');
      setPassword('');
      setName('');
      setCuisine('');
      setAddress('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

    const router = useRouter();

    const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
    };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>

      <TextInput style={styles.input} placeholder="Restaurant Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Cuisine Type" value={cuisine} onChangeText={setCuisine} />
      <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} />

      <Button title="Create Restaurant Account" onPress={handleCreateRestaurant} />
      <Button title="Logout" onPress={handleLogout} />
    </View>

  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, marginBottom: 12, padding: 10, borderRadius: 6 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
});
