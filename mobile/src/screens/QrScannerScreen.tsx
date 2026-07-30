import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';

import StatusScreen from '../components/StatusScreen';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type ScannerRouteProp = RouteProp<RootStackParamList, 'QrScanner'>;
type ScannerNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QrScanner'>;

// Kamere/telefon boyutundan bagimsiz, makul bir tarama cercevesi - tablette
// dev bir kare olmasin diye hem genislige hem yuksekliğe gore sinirlanir
// (bkz. CLAUDE.md tablet/responsive kurali).
const MAX_FRAME_SIZE = 280;
// Ekranin kisa kenarinin yuzde kacinin tarama cercevesine ayrilacagi - kucuk
// telefonlarda cerceve ekrani kaplamasin, MAX_FRAME_SIZE ile birlikte ust siniri belirler.
const FRAME_SIZE_RATIO = 0.62;

export default function QrScannerScreen() {
  const { libraryId, action } = useRoute<ScannerRouteProp>().params;
  const navigation = useNavigation<ScannerNavigationProp>();
  const { width, height } = useWindowDimensions();

  const [permission, requestPermission] = useCameraPermissions();
  // onBarcodeScanned kare basina tekrar tekrar tetiklenebilir - senkron kilit
  // olmadan ayni QR icin defalarca navigasyon tetiklenir.
  const hasHandledRef = useRef(false);

  useEffect(() => {
    // Kamera aktifken (izin verilmisken) koyu arka plan uzerinde beyaz geri
    // oku daha iyi kontrast saglar; izin ekraninda ise normal acik tema.
    if (permission?.granted) {
      navigation.setOptions({ headerTransparent: true, headerTintColor: '#FFFFFF', headerTitle: '' });
    } else {
      navigation.setOptions({ headerTransparent: false, headerTintColor: colors.ink, headerTitle: 'Kamera İzni' });
    }
  }, [permission?.granted, navigation]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (hasHandledRef.current) return;
      hasHandledRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // navigate() yerine popTo() kullanilir: navigate(), hedef ekran
      // stack'te bitisik olmayan bir konumdaysa (List -> Detail -> Scanner
      // gibi) burada oldugu gibi MEVCUT LibraryDetail instance'ina donmek
      // yerine YENI bir instance push edebiliyor (React Navigation'in
      // belgelenmis, versiyona gore degisen "navigate to existing route"
      // belirsizligi) - bu da LibraryDetail'in state'inin (library, vb.)
      // sifirlanmasina, dolayisiyla qrVerifiedAction'i yakalayan effect'in
      // "library null" oldugu icin sessizce cikmasina yol aciyordu. popTo()
      // ise acikca "stack'teki mevcut LibraryDetail'e don, gerekirse
      // araya giren ekranlari (Scanner) kaldir" davranisini garanti eder.
      //
      // Okunan deger burada dogrulanmiyor - beklenen QR token'i bu ekranin
      // (ve genel/anonim API yanitlarinin) hic bilmemesi gerekiyor, aksi
      // halde dogrulama sadece bir "musteri tarafinda kontrol" tiyatrosuna
      // donusur. Ham deger oldugu gibi LibraryDetail'e tasinir, asil kontrol
      // backend'de yapilir (bkz. libraryService.checkIn/checkOut ->
      // OccupancyService.CheckInAsync/CheckOutAsync) - yanlis kod okutulursa
      // performCheckInOrOut'un catch blogu backend'in ValidationException
      // mesajini feedback banner'inda gosterir.
      navigation.popTo('LibraryDetail', { libraryId, qrVerifiedAction: action, qrToken: result.data });
    },
    [libraryId, action, navigation],
  );

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <StatusScreen
        icon="camera-outline"
        iconColor={colors.primary}
        iconBgClassName="bg-primary-light"
        title="Kamera erişimi gerekiyor"
        description={
          permission.canAskAgain ? (
            'Kütüphane girişindeki QR kodu okutabilmemiz için kameraya erişim izni istiyoruz. Bu izin sadece QR kod tarama sırasında kullanılır.'
          ) : (
            <>
              <Text className="text-center text-sm text-ink-muted">
                Kütüphane girişindeki QR kodu okutabilmemiz için kameraya erişim izni istiyoruz. Bu izin sadece QR
                kod tarama sırasında kullanılır.
              </Text>
              <Text className="mt-3 text-center text-sm text-danger">
                Kamera izni daha önce reddedildi. Devam etmek için ayarlardan izin vermeniz gerekiyor.
              </Text>
            </>
          )
        }
        actionLabel={permission.canAskAgain ? 'İzin Ver' : 'Ayarları Aç'}
        onAction={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
      />
    );
  }

  const frameSize = Math.min(MAX_FRAME_SIZE, Math.min(width, height) * FRAME_SIZE_RATIO);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        <View style={{ flexDirection: 'row', height: frameSize }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
          <View
            style={{
              width: frameSize,
              borderWidth: 3,
              borderColor: '#FFFFFF',
              borderRadius: 24,
            }}
          />
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      </View>

      <View className="absolute left-0 right-0 items-center px-8" style={{ top: '12%' }}>
        <Text className="text-center text-base font-semibold text-white">
          {action === 'checkout' ? 'Çıkış için QR kodu okut' : 'Giriş için QR kodu okut'}
        </Text>
        <Text className="mt-1.5 text-center text-sm text-white/80">
          Kütüphanenin QR kodunu çerçeve içine hizala
        </Text>
      </View>
    </View>
  );
}
