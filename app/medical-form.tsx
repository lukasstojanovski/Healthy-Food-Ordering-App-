import { View, Text, Switch, Button, TextInput } from "react-native";
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
    <View style={{ padding: 20 }}>
      {Object.entries(profile).map(([key, value]) => {
        const k = key as keyof typeof profile;
        return (
          <View
            key={k}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 10,
            }}
          >
            <Text>
              {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Text>
            <Switch value={value} onValueChange={() => toggleSwitch(k)} />
          </View>
        );
      })}

      <View style={{ marginVertical: 20 }}>
        <Text>Maximum Calories per Meal</Text>
        <TextInput
          value={maxCalories}
          onChangeText={setMaxCalories}
          placeholder="e.g. 600"
          keyboardType="numeric"
          style={{
            borderBottomWidth: 1,
            paddingVertical: 5,
            fontSize: 16,
          }}
        />
      </View>

      <Button title="Save Profile" onPress={saveProfile} />
    </View>
  );
}
