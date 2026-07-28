import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DEFAULT_MESSAGE = 'Bu işlem için giriş yapmalısın.';

// Giris yapilmamissa action'i calistirmak yerine Login ekranina yonlendirir.
// Tek stack yapisinda Login her zaman mevcut ekranin ustune push/modal olarak
// acildigi icin geri gitmek (swipe/back) kullaniciyi otomatik olarak kaldigi
// yere dondurur - ayri bir "returnTo" mekanizmasina gerek yok.
export function useRequireAuth() {
  const navigation = useNavigation<RootNavigationProp>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useCallback(
    (action: () => void, infoMessage: string = DEFAULT_MESSAGE) => {
      if (!isAuthenticated) {
        navigation.navigate('Login', { infoMessage });
        return;
      }
      action();
    },
    [isAuthenticated, navigation],
  );
}
