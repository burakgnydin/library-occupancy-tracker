import './global.css';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';

// Modul seviyesinde, JS bundle'i yuklenir yuklenmez (React henuz hic render etmeden) - native
// splash ekrani (app.json'daki expo-splash-screen plugin config'i, logo.svg'den turetilmis
// splash-icon.png) authStore.hydrate() tamamlanana kadar acik kalir. Kapatma cagrisi
// AppNavigator'da, isHydrating false olunca yapilir (bkz. o dosyadaki yorum) - boylece
// kullanici splash'in ardindan doğrudan doğru ekrani (misafir/giris yapmis) gorur, araya
// Login/Dashboard gecisi sikismaz. .catch ile sessizce yutuluyor: web'de native splash API'si
// yok/no-op, bu kritik olmayan bir UI cilası, hata firlatip uygulamayi bozmasi gerekmiyor.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
