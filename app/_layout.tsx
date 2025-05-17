import { Tabs, Stack, useRouter, useSegments } from "expo-router";
import { CartProvider } from "../src/context/CartContext";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { doc, getDoc } from "firebase/firestore";

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { colors } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          console.log('User role:', role);
          setUserRole(role);
        }
      } else {
        console.log('No user logged in');
        setUserRole(null);
      }
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
      if (userRole === 'admin') {
        router.replace("/admin");
      } else if (userRole === 'restaurant') {
        router.replace("/restaurant-dashboard");
      } else {
        router.replace("/");
      }
    }

    if (isAuthenticated && userRole === 'restaurant') {
      const customerPages = ['index', 'cart', 'profile', 'menu', 'medical-form', 'order-history'];
      if (customerPages.includes(segments?.[0] || '')) {
        router.replace("/restaurant-dashboard");
      }
    }
  }, [segments, authChecked, isAuthenticated, userRole]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          animationDuration: 200,
          contentStyle: { backgroundColor: colors.background },
          presentation: 'card',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          animationTypeForReplace: 'push',
        }}
      >
        <Stack.Screen 
          name="login"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="register"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    );
  }

  if (userRole === 'admin') {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="admin" />
      </Stack>
    );
  }

  if (userRole === 'restaurant') {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="restaurant-dashboard" />
        <Stack.Screen name="create-item" />
      </Stack>
    );
  }

  return (
    <CartProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: "Cart",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "cart" : "cart-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="medical-form"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="order-history"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="restaurant-dashboard"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="create-item"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="create-item-details"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            href: null,
          }}
        />
      </Tabs>
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
});
