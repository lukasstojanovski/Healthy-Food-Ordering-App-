import React, { useState } from 'react';
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
  
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
  
      if (!userSnap.exists()) {
        Alert.alert('User not found in Firestore');
        return;
      }
  
      const userData = userSnap.data();
      const role = userData.role;
  
      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'restaurant') {
        router.replace('/restaurant-dashboard');
      } else if (role === 'customer') {
        router.replace('/');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={48} color="#0066CC" />
          </View>
          <Text style={styles.logoText}>DietPal</Text>
          <Text style={styles.logoSubtext}>Your Healthy Food Companion</Text>
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
              placeholder="Enter your password"
            />
          </View>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/register')}
            style={styles.registerContainer}
          >
            <Text style={styles.registerText}>Don't have an account? </Text>
            <Text style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#666666',
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
  loginButton: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    color: '#666666',
    fontSize: 14,
  },
  registerLink: {
    color: '#0066CC',
    fontSize: 14,
    fontWeight: '600',
  },
});
