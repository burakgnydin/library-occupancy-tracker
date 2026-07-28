import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LibraryListScreen from '../screens/LibraryListScreen';
import LibraryDetailScreen from '../screens/LibraryDetailScreen';
import QrScannerScreen from '../screens/QrScannerScreen';
import AuthHeaderStatus from '../components/AuthHeaderStatus';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';

// Tek stack: LibraryListScreen misafir/giris yapmis herkes icin kok ekran.
// isAuthenticated artik "hangi stack gosterilecek" degil, "hangi eylemlere
// izin var" (bkz. useRequireAuth) icin kullaniliyor.
export type RootStackParamList = {
  Libraries: undefined;
  // qrVerifiedAction/qrToken: QrScannerScreen'in basarili bir tarama sonrasi bu
  // ekrana geri "sonuc" bildirme yontemi - LoginScreen'deki infoMessage
  // parametresiyle ayni desen (bkz. LibraryDetailScreen'de setParams ile
  // temizlenmesi). qrToken, kamerayla okunan ham deger - beklenen token'la
  // karsilastirma artik backend'de yapildigi icin (bkz. libraryService.checkIn/
  // checkOut) bu ekran/Scanner onu hic bilmiyor, sadece tasiyor.
  LibraryDetail: { libraryId: string; qrVerifiedAction?: 'checkin' | 'checkout'; qrToken?: string };
  QrScanner: { libraryId: string; action: 'checkin' | 'checkout' };
  Login: { infoMessage?: string } | undefined;
  Register: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
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
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShadowVisible: false }}>
        <RootStack.Screen
          name="Libraries"
          component={LibraryListScreen}
          options={{ title: 'Kütüphaneler', headerRight: () => <AuthHeaderStatus /> }}
        />
        <RootStack.Screen name="LibraryDetail" component={LibraryDetailScreen} options={{ title: 'Kütüphane' }} />
        <RootStack.Screen
          name="QrScanner"
          component={QrScannerScreen}
          // Ekranin kendisi izin durumuna gore header'i (transparan/koyu vs.
          // normal) dinamik olarak navigation.setOptions ile ayarliyor -
          // burasi sadece baslangic/varsayilan degeri.
          options={{ presentation: 'modal', title: 'QR Tara' }}
        />
        <RootStack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerTintColor: colors.ink,
          }}
        />
        <RootStack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: '',
            headerTintColor: colors.ink,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
