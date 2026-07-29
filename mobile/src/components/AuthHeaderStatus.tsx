import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import ConfirmDialog from './ConfirmDialog';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { UserRole } from '../types/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Libraries'>;

const ROLE_LABELS: Record<UserRole, string> = {
  User: 'Kullanıcı',
  Admin: 'Yönetici',
  SuperAdmin: 'Süper Yönetici',
};

export default function AuthHeaderStatus() {
  const navigation = useNavigation<NavigationProp>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);

  if (!isAuthenticated) {
    return (
      <Pressable
        onPress={() => navigation.navigate('Login')}
        hitSlop={8}
        className="flex-row items-center rounded-full bg-primary-light px-3 py-1.5 active:opacity-70"
        style={{ marginRight: 4 }}
      >
        <Ionicons name="log-in-outline" size={16} color={colors.primary} />
        <Text className="ml-1 text-sm font-semibold text-primary">Giriş Yap</Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center" style={{ marginRight: 4 }}>
      <View className="mr-2 flex-row items-center rounded-full bg-primary-light px-2.5 py-1.5">
        <View className="mr-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Ionicons name="person" size={12} color="#FFFFFF" />
        </View>
        <Text className="text-xs font-semibold text-primary" numberOfLines={1}>
          {role ? ROLE_LABELS[role] : 'Hesabım'}
        </Text>
      </View>
      <Pressable onPress={() => setIsLogoutConfirmVisible(true)} hitSlop={8}>
        <Ionicons name="log-out-outline" size={22} color={colors.danger} />
      </Pressable>

      {isLogoutConfirmVisible ? (
        <ConfirmDialog
          title="Çıkış Yap"
          message="Çıkış yapmak istediğinize emin misiniz?"
          confirmText="Çıkış Yap"
          isDangerous
          onConfirm={() => {
            setIsLogoutConfirmVisible(false);
            logout();
          }}
          onCancel={() => setIsLogoutConfirmVisible(false)}
        />
      ) : null}
    </View>
  );
}
