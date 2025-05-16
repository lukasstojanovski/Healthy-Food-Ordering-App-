import { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function CreateItem() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const router = useRouter();

  const handleNext = () => {
    if (!name || !description || !price) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Error", "Please enter a valid price.");
      return;
    }

    router.push({
      pathname: "/create-item-details",
      params: {
        name,
        description,
        price,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create New Menu Item</Text>
            <Text style={styles.subtitle}>Add basic information about your dish</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name</Text>
              <TextInput
                placeholder="Enter item name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                placeholder="Enter description and ingredients"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                placeholder="Enter price"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholderTextColor="#999999"
              />
            </View>

            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Continue to Details</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
