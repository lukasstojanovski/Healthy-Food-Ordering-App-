import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Switch } from 'react-native';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { useTheme } from './context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [address, setAddress] = useState('');
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your account settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Delivery Address</Text>
            <TextInput
              placeholder="Enter your delivery location"
              value={address}
              onChangeText={setAddress}
              style={[styles.input, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.themeToggle, { backgroundColor: colors.background }]}>
            <View style={styles.themeToggleContent}>
              <Ionicons 
                name={isDark ? "moon" : "sunny"} 
                size={24} 
                color={colors.primary} 
              />
              <Text style={[styles.themeToggleText, { color: colors.text }]}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? colors.background : colors.background}
            />
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/medical-form')}
          >
            <Text style={[styles.menuButtonText, { color: colors.text }]}>Update Medical Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: colors.background }]}
            onPress={() => router.push('/order-history')}
          >
            <Text style={[styles.menuButtonText, { color: colors.text }]}>View Order History</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: '#B22222' }]}
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
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeToggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
