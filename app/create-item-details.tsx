import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, TextInput, Switch, Button, Alert, StyleSheet, ActivityIndicator } from "react-native";
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
    low_carb: false,
    high_protein: false,
    low_fat: false,
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
                  "low_carb": true/false,
                  "high_protein": true/false,
                  "low_fat": true/false,
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
          low_carb: result.low_carb ?? false,
          high_protein: result.high_protein ?? false,
          low_fat: result.low_fat ?? false,
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

      Alert.alert("Success", "Item created.");
      router.replace("/restaurant-dashboard");
    } catch (err) {
      Alert.alert("Error", "Failed to create item.");
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 20 }}>Analyzing item with ChatGPT...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Refine Item Details</Text>
      <TextInput
        placeholder="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        style={styles.input}
      />
      <Text style={styles.note}>Toggle ON if this food is ⚠️ NOT SAFE or matches dietary goals:</Text>
      {Object.entries(tags).map(([key, value]) => {
        const typedKey = key as keyof typeof tags;
        const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <View key={key} style={styles.switchRow}>
            <Text style={styles.label}>⚠️ {label}</Text>
            <Switch value={value} onValueChange={() => toggleTag(typedKey)} />
          </View>
        );
      })}

      <Button title="Save Item" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 8,
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  label: { fontSize: 16 },
  note: {
    fontStyle: "italic",
    color: "#666",
    marginBottom: 10,
    fontSize: 14,
  },
});


