import { Stack, useRouter, useSegments } from "expo-router";
import { CartProvider } from "../src/context/CartContext";
import { TouchableOpacity, View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { ThemeProvider, useTheme } from './context/ThemeContext';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();

  const HeaderButtons = () => (
    <View style={styles.headerButtons}>
      <TouchableOpacity 
        style={[styles.headerButton, { backgroundColor: colors.background }]}
        onPress={() => router.push("/profile")}
      >
        <Ionicons name="person-outline" size={24} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.headerButton, { backgroundColor: colors.background }]}
        onPress={() => router.push("/cart")}
      >
        <Ionicons name="cart-outline" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <CartProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTitle: () => null,
          headerRight: () => <HeaderButtons />,
          headerShadowVisible: false,
          headerBackVisible: true,
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            headerLeft: () => null,
          }}
        />
        <Stack.Screen name="menu" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="medical-form" />
        <Stack.Screen name="order-history" />
        <Stack.Screen name="restaurant-dashboard" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="create-item" />
        <Stack.Screen name="create-item-details" />
        <Stack.Screen 
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="register"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </CartProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
    marginRight: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
