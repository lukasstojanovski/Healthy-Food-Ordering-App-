import { View, Text, Switch, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function MedicalForm() {
  const [profile, setProfile] = useState({
    diabetes: false,
    gluten_free: false,
    nut_allergy: false,
    lactose_free: false,
    hypertension: false,
    cholesterol: false,
    low_carb: false,
    high_protein: false,
    low_fat: false,
  });

  const [maxCalories, setMaxCalories] = useState("");

  const toggleSwitch = (key: keyof typeof profile) => {
    setProfile((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const saveProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const dataToSave = {
      ...profile,
      maxCalories: maxCalories ? parseInt(maxCalories) : null,
    };

    await setDoc(doc(db, "medical_profiles", uid), dataToSave, { merge: true });
    alert("Medical profile saved.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Profile</Text>
        <Text style={styles.subtitle}>Set your dietary preferences and restrictions</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
          {Object.entries(profile).map(([key, value]) => {
            const k = key as keyof typeof profile;
            return (
              <View key={k} style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
                <Switch 
                  value={value} 
                  onValueChange={() => toggleSwitch(k)}
                  trackColor={{ false: '#E0E0E0', true: '#1A1A1A' }}
                  thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Calorie Limit</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Maximum Calories per Meal</Text>
            <TextInput
              value={maxCalories}
              onChangeText={setMaxCalories}
              placeholder="e.g. 600"
              keyboardType="numeric"
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveProfile}
        >
          <Text style={styles.saveButtonText}>Save Profile</Text>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  switchLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
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
    margin: 24,
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
});
