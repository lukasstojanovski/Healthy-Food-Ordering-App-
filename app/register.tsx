import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to start your healthy journey</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                value={email} 
                onChangeText={setEmail} 
                style={styles.input} 
                autoCapitalize="none"
                placeholderTextColor="#999"
                placeholder="Enter your email"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <TextInput 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
                style={styles.input}
                placeholderTextColor="#999"
                placeholder="Create a password"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput 
                value={phone} 
                onChangeText={setPhone} 
                style={styles.input}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
                placeholder="Enter your phone number"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Address (Optional)</Text>
              <TextInput 
                value={address} 
                onChangeText={setAddress} 
                style={styles.input}
                placeholderTextColor="#999"
                placeholder="Enter your address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput 
                value={height} 
                onChangeText={setHeight} 
                style={styles.input}
                keyboardType="numeric"
                placeholderTextColor="#999"
                placeholder="Enter your height"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput 
                value={weight} 
                onChangeText={setWeight} 
                style={styles.input}
                keyboardType="numeric"
                placeholderTextColor="#999"
                placeholder="Enter your weight"
              />
            </View>

            <TouchableOpacity 
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/login')}
              style={styles.loginContainer}
            >
              <Text style={styles.loginText}>Already have an account? </Text>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
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
    lineHeight: 22,
  },
  formContainer: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  registerButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#666666',
    fontSize: 14,
  },
  loginLink: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
});
