import { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";

export default function CreateItem() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const router = useRouter();
  const { colors } = useTheme();

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Create New Menu Item</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Add basic information about your dish</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Item Name</Text>
              <TextInput
                placeholder="Enter item name"
                value={name}
                onChangeText={setName}
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                placeholder="Enter description and ingredients"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Price ($)</Text>
              <TextInput
                placeholder="Enter price"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border
                }]}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity 
              style={[styles.nextButton, { backgroundColor: colors.primary }]}
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
  },
  backButton: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  nextButton: {
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
