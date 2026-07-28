import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import PrimaryButton from '../components/PrimaryButton';
import { checkIn, checkOut, getLibraryById, getMyCheckInStatus } from '../services/libraryService';
import { joinLibraryGroup, leaveLibraryGroup, onOccupancyUpdated } from '../services/signalRService';
import { getApiErrorMessage } from '../utils/apiError';
import { occupancyLabels, occupancyStyles } from '../utils/occupancyStyles';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { CheckInOutResult, Library } from '../types/library';

type DetailRouteProp = RouteProp<RootStackParamList, 'LibraryDetail'>;
type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LibraryDetail'>;

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

const FEEDBACK_DURATION_MS = 3200;

export default function LibraryDetailScreen() {
  const route = useRoute<DetailRouteProp>();
  const { libraryId } = route.params;
  const navigation = useNavigation<DetailNavigationProp>();
  const requireAuth = useRequireAuth();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [library, setLibrary] = useState<Library | null>(null);
  // Kullanicinin su an giris yapmis oldugu kutuphanenin id'si (hicbir yerde
  // degilse null) - GET /api/libraries/checkin-status'tan gelir, sadece
  // giris yapilmis kullanicilar icin anlamli.
  const [checkedInLibraryId, setCheckedInLibraryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // LibraryListScreen'in fetchPage'indeki istek-sirasi deseni: her load()
  // cagrisi bir sira numarasi alir, sadece EN GUNCEL cagrinin sonucu state'e
  // yazilir. handlePress de basarili bir check-in/check-out sonrasi bu sayaci
  // ilerletir - boylece daha once baslamis, hala uctaki bir load() cevabi
  // geri donup optimistik guncellemenin uzerine yazamaz.
  const requestIdRef = useRef(0);
  // Ekranda daha once basariyla gosterilmis kutuphane verisi var mi - varsa,
  // sonraki bir yenileme basarisiz olursa tam ekran hataya duşup mevcut
  // veriyi kaybetmek yerine mevcut veriyi koruyup kucuk bir uyari banner'i
  // gosteririz (sessizce eski veride kalmak yerine).
  const hasLoadedOnceRef = useRef(false);
  // Cift tiklamada handlePress'in ayni islemi iki kez baslatmasini engeller -
  // isSubmitting state'i asenkron oldugu icin (React henuz commit etmemisken)
  // tek basina yeterli degil, senkron kontrol icin ayri bir ref
  // (bkz. LibraryListScreen'deki isFetchingRef).
  const isSubmittingRef = useRef(false);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [libraryOutcome, statusOutcome] = await Promise.allSettled([
          getLibraryById(libraryId),
          isAuthenticated ? getMyCheckInStatus() : Promise.resolve(null),
        ]);

        if (requestId !== requestIdRef.current) return;

        if (libraryOutcome.status === 'fulfilled') {
          setLibrary(libraryOutcome.value);
          hasLoadedOnceRef.current = true;

          if (statusOutcome.status === 'fulfilled') {
            setCheckedInLibraryId(statusOutcome.value?.libraryId ?? null);
          } else if (isAuthenticated) {
            // Kutuphane verisi geldi ama giris durumu alinamadi - ekrani
            // bozmadan mevcut checkedInLibraryId'yi koruyup durumu bildiriyoruz.
            setFeedback({ type: 'error', message: 'Giriş durumunuz güncellenemedi. Bilgiler eski olabilir.' });
          }
        } else if (hasLoadedOnceRef.current) {
          // Daha once basariyla veri gosterilmisti - tam ekran hataya
          // dusmeyip mevcut veriyi koruyoruz, sadece gorunur bir uyari veriyoruz.
          setFeedback({
            type: 'error',
            message: getApiErrorMessage(libraryOutcome.reason, 'Kütüphane bilgileri güncellenemedi.'),
          });
        } else {
          setError(getApiErrorMessage(libraryOutcome.reason, 'Kütüphane bilgileri yüklenemedi. Lütfen tekrar deneyin.'));
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    })();
  }, [libraryId, isAuthenticated]);

  // Ekrana her donuste (orn. baska bir kutuphaneye bakip geri gelince) taze
  // veri cekilir - liste ekranindan farkli olarak burada doluluk/durum
  // guncelligi onemli.
  useFocusEffect(load);

  const handleOccupancyUpdated = useCallback(
    (update: CheckInOutResult) => {
      if (update.libraryId !== libraryId) return;
      // REST akisiyla ayni requestIdRef korumasi: gecikmeli (stale) bir HTTP
      // yaniti bu SignalR guncellemesinin uzerine yazamasin diye sayaci
      // ilerletiyoruz (bkz. handlePress'teki ayni mantik). Sadece agregat
      // doluluk alanlari guncelleniyor - bu event kimin check-in yaptigini
      // soylemiyor, checkedInLibraryId'ye dokunulmuyor.
      requestIdRef.current += 1;
      setLibrary((prev) =>
        prev
          ? {
              ...prev,
              currentOccupancy: update.currentOccupancy,
              occupancyPercentage: update.occupancyPercentage,
              occupancyStatus: update.occupancyStatus,
            }
          : prev,
      );
    },
    [libraryId],
  );

  // Ekran odaklandiginda kutuphane grubuna katilip canli guncellemeleri
  // dinler; ayrilirken/blur olurken hem gruptan cikar hem dinleyiciyi kaldirir
  // - baska bir kutuphaneye gecince bu ekranin guncellemelerini almaya devam
  // etmek (leak) veya ayni dinleyicinin ust uste binmesi boylece engellenir.
  useFocusEffect(
    useCallback(() => {
      joinLibraryGroup(libraryId);
      const unsubscribe = onOccupancyUpdated(handleOccupancyUpdated);

      return () => {
        unsubscribe();
        leaveLibraryGroup(libraryId);
      };
    }, [libraryId, handleOccupancyUpdated]),
  );

  useEffect(() => {
    navigation.setOptions({ title: library?.name ?? 'Kütüphane' });
  }, [navigation, library?.name]);

  useEffect(() => {
    if (!feedback) return;
    const timeoutId = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [feedback]);

  const isCheckedInHere = checkedInLibraryId === libraryId;
  const isFull = Boolean(library) && library!.currentOccupancy >= library!.capacity;
  const actionDisabled = isSubmitting || (isFull && !isCheckedInHere);

  // QrScannerScreen'de bir QR kod okutulduktan sonra cagrilir - asil check-in/
  // check-out API cagrisi (ve QR token dogrulamasi) burada degil, backend'de
  // yapilir (bkz. handlePress ve qrVerifiedAction/qrToken param'ini izleyen
  // useEffect). qrToken yanlissa checkIn/checkOut backend'in ValidationException
  // (400) mesajiyla reddedilir, catch blogu bunu feedback banner'inda gosterir.
  const performCheckInOrOut = useCallback(
    async (action: 'checkin' | 'checkout', qrToken: string) => {
      if (!library) return;
      // Senkron kilit: state commit'ini beklemeden hizli cift tiklamada
      // ikinci cagriyi hemen reddeder.
      if (isSubmittingRef.current) return;
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      try {
        const result = action === 'checkout' ? await checkOut(library.id, qrToken) : await checkIn(library.id, qrToken);
        // Bu basarili mutasyon, bu andan once baslamis olabilecek herhangi bir
        // arka plan load() cagrisini "eski" ilan eder - o cagri daha sonra
        // donerse requestIdRef.current artik farkli oldugu icin bu optimistik
        // guncellemenin uzerine yazamaz.
        requestIdRef.current += 1;
        setLibrary((prev) =>
          prev
            ? {
                ...prev,
                currentOccupancy: result.currentOccupancy,
                occupancyPercentage: result.occupancyPercentage,
                occupancyStatus: result.occupancyStatus,
              }
            : prev,
        );
        setCheckedInLibraryId(result.type === 'CheckIn' ? result.libraryId : null);
        setFeedback({
          type: 'success',
          message: result.type === 'CheckIn' ? 'Giriş kaydınız oluşturuldu.' : 'Çıkış kaydınız oluşturuldu.',
        });
      } catch (err) {
        setFeedback({ type: 'error', message: getApiErrorMessage(err) });
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [library],
  );

  // QrScannerScreen bir tarama sonrasi bu ekrana geri donup (navigation.popTo
  // ile) qrVerifiedAction + qrToken parametrelerini set eder - burada
  // yakalanip asil API cagrisi tetiklenir, sonra parametreler hemen
  // temizlenir ki ekrana baska bir odaklanmada (orn. geri gelince) tekrar
  // tetiklenmesin.
  useEffect(() => {
    const verifiedAction = route.params.qrVerifiedAction;
    const qrToken = route.params.qrToken;
    if (!verifiedAction || !qrToken) return;
    navigation.setParams({ qrVerifiedAction: undefined, qrToken: undefined });
    performCheckInOrOut(verifiedAction, qrToken);
  }, [route.params.qrVerifiedAction, route.params.qrToken, navigation, performCheckInOrOut]);

  const handlePress = () => {
    requireAuth(() => {
      if (!library) return;
      navigation.navigate('QrScanner', {
        libraryId: library.id,
        action: isCheckedInHere ? 'checkout' : 'checkin',
      });
    }, 'Giriş kaydı yapmak için önce giriş yapmalısın.');
  };

  if (isLoading && !library) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error && !library) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-danger-light">
          <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
        </View>
        <Text className="mb-1.5 text-center text-base font-semibold text-ink">Bir şeyler ters gitti</Text>
        <Text className="mb-5 text-center text-sm text-ink-muted">{error}</Text>
        <PrimaryButton label="Tekrar Dene" onPress={() => load()} />
      </View>
    );
  }

  if (!library) {
    return null;
  }

  const statusStyle = occupancyStyles[library.occupancyStatus];
  const fillPercentage = Math.min(100, Math.max(0, library.occupancyPercentage));

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Tablette icerik gerilmesin diye maksimum genislik + ortalama (bkz.
            CLAUDE.md responsive kurali, Login/Register'daki max-w-[480px] ile
            ayni mantik) - telefonda w-full zaten mevcut genislikten dar oldugu
            icin max-w-[640px] hicbir etki yapmaz. */}
        <View className="w-full max-w-[640px] self-center">
          <View
            className="mb-4 rounded-2xl bg-surface p-5"
            style={{
              shadowColor: colors.ink,
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text className="text-xl font-bold text-ink">{library.name}</Text>
            <View className="mt-2 flex-row items-start">
              <Ionicons name="location-outline" size={16} color={colors.inkMuted} style={{ marginTop: 2 }} />
              <Text className="ml-1.5 flex-1 text-sm text-ink-muted">
                {library.address}, {library.district} / {library.city}
              </Text>
            </View>
          </View>

          <View
            className="rounded-2xl bg-surface p-5"
            style={{
              shadowColor: colors.ink,
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-ink-muted">Doluluk Durumu</Text>
              <View className={`rounded-full border px-3 py-1 ${statusStyle.border} ${statusStyle.bg}`}>
                <Text className={`text-xs font-semibold ${statusStyle.text}`}>{occupancyLabels[library.occupancyStatus]}</Text>
              </View>
            </View>

            <Text className={`mt-3 text-5xl font-extrabold ${statusStyle.text}`}>%{library.occupancyPercentage}</Text>

            <View className="mt-4 h-3 overflow-hidden rounded-full bg-border">
              <View className="h-full rounded-full" style={{ width: `${fillPercentage}%`, backgroundColor: statusStyle.solid }} />
            </View>

            <View className="mt-3 flex-row items-center">
              <Ionicons name="people-outline" size={18} color={colors.inkMuted} />
              <Text className="ml-1.5 text-base text-ink-muted">
                <Text className="font-semibold text-ink">{library.currentOccupancy}</Text> / {library.capacity} kişi
              </Text>
            </View>

            {isCheckedInHere ? (
              <View className="mt-4 flex-row items-center rounded-xl bg-primary-light px-3 py-2.5">
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text className="ml-1.5 text-sm font-medium text-primary">Şu anda bu kütüphanedesin</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {feedback ? (
        <View className="absolute left-4 right-4 items-center" style={{ bottom: 100 }}>
          <View
            className={`w-full max-w-[640px] rounded-xl border px-4 py-3 ${
              feedback.type === 'success' ? 'border-success bg-success-light' : 'border-danger bg-danger-light'
            }`}
          >
            <Text className={`text-sm font-medium ${feedback.type === 'success' ? 'text-success' : 'text-danger'}`}>
              {feedback.message}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="items-center border-t border-border bg-surface px-4 pb-6 pt-4">
        <Pressable
          onPress={handlePress}
          disabled={actionDisabled}
          className={`h-14 w-full max-w-[640px] flex-row items-center justify-center rounded-2xl active:opacity-80 ${
            isCheckedInHere ? 'bg-danger' : 'bg-primary'
          } ${actionDisabled ? 'opacity-60' : ''}`}
          style={{
            shadowColor: isCheckedInHere ? colors.danger : colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={isCheckedInHere ? 'log-out-outline' : 'log-in-outline'} size={20} color="#FFFFFF" />
              <Text className="ml-2 text-base font-semibold text-white">
                {isFull && !isCheckedInHere ? 'Kütüphane Dolu' : isCheckedInHere ? 'Çıkış Yap' : 'Giriş Kaydı Yap'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
