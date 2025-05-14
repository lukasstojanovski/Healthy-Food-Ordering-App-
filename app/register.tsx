import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useRouter } from 'expo-router';
import { setDoc, doc } from 'firebase/firestore';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !phone || !height || !weight) {
      Alert.alert('Missing Fields', 'Please fill out all required fields.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        email: email.toLowerCase(),
        role: 'customer',
        phone,
        address,
        height: parseInt(height),
        weight: parseInt(weight),
        goal,
        createdAt: new Date().toISOString(),
      });

      router.replace('/medical-form');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <TextInput placeholder="Phone Number" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
      <TextInput placeholder="Address (optional)" value={address} onChangeText={setAddress} style={styles.input} />
      <TextInput placeholder="Height (cm)" value={height} onChangeText={setHeight} style={styles.input} keyboardType="numeric" />
      <TextInput placeholder="Weight (kg)" value={weight} onChangeText={setWeight} style={styles.input} keyboardType="numeric" />
      
      <Button title="Register" onPress={handleRegister} />

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  input: { borderWidth: 1, marginVertical: 10, padding: 10, borderRadius: 5 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  link: { marginTop: 15, textAlign: 'center', color: 'blue' },
});
