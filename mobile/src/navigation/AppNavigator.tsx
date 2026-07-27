import { useEffect } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LibraryListScreen from '../screens/LibraryListScreen';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

export type AuthStackParamList = {
  Login: { infoMessage?: string } | undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Libraries: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HeaderLogoutButton() {
  const logout = useAuthStore((state) => state.logout);
  return (
    <Pressable onPress={() => logout()} hitSlop={8} style={{ marginRight: 12 }}>
      <Ionicons name="log-out-outline" size={22} color={colors.danger} />
    </Pressable>
  );
}

function AppStackNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="Libraries"
        component={LibraryListScreen}
        options={{ title: 'Kütüphaneler', headerRight: () => <HeaderLogoutButton /> }}
      />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>{isAuthenticated ? <AppStackNavigator /> : <AuthNavigator />}</NavigationContainer>
  );
}
