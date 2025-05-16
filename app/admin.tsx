import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Alert, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
    if (!email || !password || !name || !cuisine || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

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

      Alert.alert('Success', 'Restaurant account created successfully!');
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Admin Panel</Text>
            <Text style={styles.subtitle}>Create new restaurant accounts</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Restaurant Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter restaurant name" 
                value={name} 
                onChangeText={setName}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisine Type</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter cuisine type" 
                value={cuisine} 
                onChangeText={setCuisine}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter restaurant address" 
                value={address} 
                onChangeText={setAddress}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter email address" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter password" 
                value={password} 
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#999999"
              />
            </View>

            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleCreateRestaurant}
            >
              <Text style={styles.createButtonText}>Create Restaurant Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F5F5F5',
  },
  createButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
