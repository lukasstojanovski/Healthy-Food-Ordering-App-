import { Stack, useRouter, useSegments } from "expo-router";
import { CartProvider } from "../src/context/CartContext";
import { TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const CartIconButton = () => (
    <TouchableOpacity onPress={() => router.push("/cart")} style={{ marginRight: 15 }}>
      <Ionicons name="cart-outline" size={24} color="black" />
    </TouchableOpacity>
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    const inAuthGroup = segments?.[0] === "login" || segments?.[0] === "register";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    }

    if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [segments, authChecked, isAuthenticated]);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <CartProvider>
      <Stack>
        <Stack.Screen
          name="menu"
          options={{
            title: "",
            headerRight: () => <CartIconButton />,
          }}
        />
      </Stack>
    </CartProvider>
  );
}
