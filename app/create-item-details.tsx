import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, TextInput, Switch, Alert, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import Constants from 'expo-constants';

export default function CreateItemDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name, description, price } = params;
  const apiKey = Constants.expoConfig?.extra?.openaiApiKey;

  const [calories, setCalories] = useState("");
  const [tags, setTags] = useState({
    cholesterol: false,
    diabetes: false,
    contains_gluten: false,
    hypertension: false,
    contains_lactose: false,
    nut_allergy: false,
    contains_alot_of_carbs: false,
    contains_alot_of_fat: false,
  });
  const [loading, setLoading] = useState(true);

  const toggleTag = (key: keyof typeof tags) => {
    setTags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const generateHealthData = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "user",
                content: `Analyze the following food description for health restrictions:\n\n"${description}"\n\nReturn a JSON object with:\n{
                  "cholesterol": true/false, // true = NOT safe for high cholesterol
                  "diabetes": true/false,    // true = NOT safe for diabetics
                  "contains_gluten": true/false, // true = contains gluten
                  "hypertension": true/false, // true = NOT safe for high blood pressure
                  "contains_lactose": true/false, // true = contains dairy
                  "nut_allergy": true/false, // true = contains peanuts, tree nuts, or traces
                  "calories": number // estimated for FULL meal
                  "contains_alot_of_carbs": true/false,
                  "contains_alot_of_fat": true/false,
                  "calories": number
}\n\nBe strict. Assume peanut sauce contains gluten and nuts unless stated otherwise. Estimate calories for the *full meal*, not per portion.`
              },
            ],
            temperature: 0.4,
          }),
        });

        const json = await response.json();
        if (!response.ok) throw new Error("OpenAI API error");

        const rawText = json.choices?.[0]?.message?.content;
        const jsonText = rawText?.match(/{[\s\S]*}/)?.[0];
        if (!jsonText) throw new Error("Invalid GPT response");

        const result = JSON.parse(jsonText);
        console.log("Parsed GPT tags:", result);

        setTags({
          cholesterol: result.cholesterol ?? false,
          diabetes: result.diabetes ?? false,
          contains_gluten: result.contains_gluten ?? false,
          hypertension: result.hypertension ?? false,
          contains_lactose: result.contains_lactose ?? false,
          nut_allergy: result.nut_allergy ?? false,
          contains_alot_of_carbs: result.contains_alot_of_carbs ?? false,
          contains_alot_of_fat: result.contains_alot_of_fat ?? false,
        });

        setCalories(String(result.calories ?? ""));
      } catch (err) {
        console.error("GPT request failed:", err);
        Alert.alert("Error", "Could not analyze item with AI.");
      }
      setLoading(false);
    };

    generateHealthData();
  }, []);

  const handleSubmit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !name || !price || !calories) {
      Alert.alert("Error", "Please fill out all required fields.");
      return;
    }

    if (isNaN(Number(calories)) || Number(calories) <= 0) {
      Alert.alert("Error", "Please enter a valid calorie count.");
      return;
    }

    try {
      await addDoc(collection(db, "food_items"), {
        name,
        description,
        price: parseFloat(price as string),
        calories: parseInt(calories),
        restaurantId: uid,
        ...tags,
        allowed: true,
      });

      Alert.alert("Success", "Item created successfully!");
      router.replace("/restaurant-dashboard");
    } catch (err) {
      Alert.alert("Error", "Failed to create item.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
          <Text style={styles.loadingText}>Analyzing item with AI...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Refine Item Details</Text>
            <Text style={styles.subtitle}>Review and adjust health information</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Calories</Text>
              <TextInput
                placeholder="Enter calorie count"
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health Restrictions</Text>
              <Text style={styles.note}>Toggle ON if this food is ⚠️ NOT SAFE or matches dietary goals</Text>
              
              <View style={styles.tagsContainer}>
                {Object.entries(tags).map(([key, value]) => {
                  const typedKey = key as keyof typeof tags;
                  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <View key={key} style={styles.switchRow}>
                      <Text style={styles.switchLabel}>⚠️ {label}</Text>
                      <Switch 
                        value={value} 
                        onValueChange={() => toggleTag(typedKey)}
                        trackColor={{ false: '#E0E0E0', true: '#0066CC' }}
                        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Save Menu Item</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
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
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  tagsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    marginRight: 16,
  },
  submitButton: {
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


