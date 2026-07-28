import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Backend her zaman Metro'yu calistiran makinede, sabit 5200 portunda calisir
// (bkz. backend/CLAUDE.md - launchSettings.json'daki http profili). Metro'ya
// hangi IP'den baglanildiysa (LAN, Android emulator'in 10.0.2.2'si, web'de
// localhost...) backend de ayni makinede oldugu icin ayni host'ta olmali.
const BACKEND_PORT = '5200';
const API_PATH = '/api';

// Tunnel modunda (--tunnel) Metro'ya ngrok uzerinden, uzak bir tunel
// adresinden erisilir - hostUri/window.location.hostname artik yerel agdaki
// bir IP degil, bu tunel adresidir. Backend ayni tunel adresinde OLMADIGI
// icin (sadece Metro tunellenir, backend degil) otomatik turetme bu modda
// yanlis bir adrese isaret eder - EXPO_PUBLIC_API_BASE_URL'i manuel
// ayarlamak sarttir. Bunu daha once yasadik (bkz. .env'deki not) - bir daha
// sessizce ayni hataya dusulmesin diye erken bir uyari logluyoruz.
function warnIfTunnelHost(host: string): void {
  if (host.includes('exp.direct') || host.includes('ngrok')) {
    console.warn(
      `[apiBaseUrl] Tunnel modu tespit edildi (host: ${host}) - otomatik IP tespiti bu modda güvenilir değildir, ` +
        'backend Metro ile aynı tünel adresinde değildir. Lütfen EXPO_PUBLIC_API_BASE_URL değişkenini .env ' +
        'dosyasında bilgisayarınızın gerçek LAN IP\'sine (ör. http://192.168.x.x:5200/api) manuel olarak ayarlayın.',
    );
  }
}

// Web'de Constants.expoConfig.hostUri hep bos donuyor - bu SDK/Metro web
// derlemesinde ExponentConstants.web.ts, manifest'i "@expo/webpack-config"un
// enjekte ettigi process.env.APP_MANIFEST'ten okuyor, ama modern Expo Router
// tabanli web dev server bunu hic set etmiyor (dogrulandi: derlenen bundle'da
// APP_MANIFEST hicbir yerde gecmiyor). Bu yuzden web'de dogrudan tarayicinin
// kendi gordugu host'u (window.location.hostname) kullaniyoruz - bu zaten
// native'deki hostUri ile ayni bilgiyi, daha guvenilir bir kaynaktan verir.
function deriveDevApiBaseUrl(): string | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.location?.hostname) {
      return undefined;
    }
    warnIfTunnelHost(window.location.hostname);
    return `http://${window.location.hostname}:${BACKEND_PORT}${API_PATH}`;
  }

  // Constants.expoConfig.hostUri sadece "npx expo start" ile gelistirme
  // yapilirken (native: Expo Go/dev client) dolu olur - production build'de
  // (EAS/standalone) hep undefined doner.
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return undefined;
  }

  const host = hostUri.split(':')[0].split('/')[0];
  if (!host) {
    return undefined;
  }

  warnIfTunnelHost(host);
  return `http://${host}:${BACKEND_PORT}${API_PATH}`;
}

// Development: Metro'nun bagli oldugu host'tan API adresini otomatik turetir
// - .env'i elle guncelleme ihtiyacini ortadan kaldirir. EXPO_PUBLIC_API_BASE_URL
// yine de acikca doldurulmussa (orn. backend baska bir makinede calisiyorsa)
// once o kullanilir - otomatik turetme sadece bos birakildiginda devreye girer.
// Production build'de hostUri hicbir zaman dolu olmadigindan otomatik turetme
// hic calismaz ve EXPO_PUBLIC_API_BASE_URL (gercek domain) tek kaynak olarak kalir.
export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (__DEV__) {
    if (configured) {
      return configured;
    }

    const derived = deriveDevApiBaseUrl();
    if (derived) {
      return derived;
    }
  }

  if (!configured) {
    throw new Error(
      'API base URL belirlenemedi: Metro host bilgisi yok ve EXPO_PUBLIC_API_BASE_URL ayarlanmamis.',
    );
  }

  return configured;
}
