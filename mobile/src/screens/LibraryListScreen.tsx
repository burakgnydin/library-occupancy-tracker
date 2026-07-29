import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import ActiveCheckInBanner from '../components/ActiveCheckInBanner';
import LibraryCard from '../components/LibraryCard';
import PrimaryButton from '../components/PrimaryButton';
import { getLibraries, getMyCheckInStatus } from '../services/libraryService';
import { joinLibraryGroup, leaveLibraryGroup, onOccupancyUpdated } from '../services/signalRService';
import { useAuthStore } from '../store/authStore';
import { getApiErrorMessage } from '../utils/apiError';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { CheckInOutResult, Library, MyCheckInStatus } from '../types/library';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Libraries'>;

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
// Bu projenin responsive tasarim kurali icin referans tablet breakpoint'i (bkz. CLAUDE.md).
const TABLET_BREAKPOINT = 768;

type FetchMode = 'initial' | 'refresh' | 'more' | 'silent';

export default function LibraryListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const numColumns = width >= TABLET_BREAKPOINT ? 2 : 1;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [items, setItems] = useState<Library[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Şu An Buradayım" banner'ı icin - misafirlerde hic cagrilmaz (backend zaten
  // [Authorize]). Bu, liste sayfalamasindan tamamen bagimsiz, ayri bir veri
  // kaynagi oldugu icin fetchPage'in requestId/mode mekanizmasina dahil
  // edilmiyor; hatasi da sessiz (bu "nice to have" bir ozet, REST akisinin
  // geri kalanini bozmamali - bkz. LibraryDetailScreen'deki ayni felsefe).
  const [checkInStatus, setCheckInStatus] = useState<MyCheckInStatus | null>(null);

  // Debounce'lu arama + arka arkaya gelen istekler yuzunden eski bir yanitin
  // daha yeni bir aramanin sonucunu ezmesini onlemek icin istek sirasi takibi.
  const requestIdRef = useRef(0);
  // isLoading/isRefreshing/isLoadingMore state'leri asenkron oldugu icin (React
  // henuz commit etmemisken) hizli art arda onEndReached tetiklemelerinde tek
  // basina yeterli bir kilit degil - senkron kontrol icin ayri bir ref.
  const isFetchingRef = useRef(false);
  // Hangi islemin (initial/refresh/more) basarisiz oldugunu tutar - retry bu
  // degere gore dogru islemi tekrar dener (orn. refresh hatasinda "sonraki
  // sayfa" degil, refresh'in kendisi tekrar denenir).
  const lastFailedModeRef = useRef<FetchMode | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const fetchPage = useCallback(
    async (targetPage: number, mode: FetchMode) => {
      const requestId = ++requestIdRef.current;
      isFetchingRef.current = true;

      if (mode === 'initial') setIsLoading(true);
      if (mode === 'refresh') setIsRefreshing(true);
      if (mode === 'more') setIsLoadingMore(true);
      // 'silent' (odaklanmada arka plan senkronu) hicbir loading gostergesini
      // tetiklemez - kullanici fark etmeden calisir. Onceki bir hatayi da
      // simdiden temizlemiyoruz (basarili olursa asagida temizlenir, basarisiz
      // olursa mevcut hata/veri durumuna dokunmadan sessizce vazgeciyoruz).
      if (mode !== 'silent') setError(null);

      try {
        const result = await getLibraries({
          search: debouncedSearch || undefined,
          pageNumber: targetPage,
          pageSize: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        lastFailedModeRef.current = null;
        setError(null);
        setItems((prev) => (mode === 'more' ? [...prev, ...result.items] : result.items));
        setPageNumber(result.pageNumber);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        // Sessiz senkron basarisiz olursa kullaniciyi rahatsiz etmeyiz -
        // mevcut liste/hata durumu neyse oyle kalir, bir sonraki odaklanmada
        // tekrar denenir (bkz. asagidaki useFocusEffect).
        if (mode === 'silent') return;
        lastFailedModeRef.current = mode;
        setError(getApiErrorMessage(err, 'Kütüphaneler yüklenemedi. Lütfen tekrar deneyin.'));
      } finally {
        // Bu istek zaten daha yeni bir istek tarafindan gecersiz kilinmissa
        // (requestId uyusmuyor), isFetchingRef'i simdi false yapmak o daha
        // yeni istek hala uctayken yanlislikla "bosta" gibi gostermek olur -
        // sadece guncel/son istek kilidi acar.
        if (requestId !== requestIdRef.current) return;
        isFetchingRef.current = false;
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch],
  );

  useEffect(() => {
    fetchPage(1, 'initial');
  }, [fetchPage]);

  // fetchPage'in en guncel halini bir ref'te tutuyoruz ki asagidaki
  // useFocusEffect'in dependency array'i BOS kalabilsin. Eger fetchPage'i
  // dogrudan bagimlilik olarak versek, arama metni her degistiginde
  // (debouncedSearch degisip fetchPage yeniden olusunca) bu efekt de -ekran
  // zaten odaktayken- tekrar tetiklenir ve yukaridaki 'initial' fetch'iyle
  // CAKISAN gereksiz bir 'silent' istek daha atardik. Bos dependency array,
  // bu callback'in SADECE gercek focus/blur gecislerinde calismasini saglar.
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  }, [fetchPage]);

  // Ekrana her donuste (orn. bir kutuphanede check-in yapip detaydan geri
  // gelince) mevcut arama/filtre durumuyla ilk sayfayi sessizce yeniden ceker.
  // SignalR zaten anlik guncelleme sagliyor (bkz. handleOccupancyUpdated) -
  // bu, ekran arka plandayken kacirilmis olabilecek guncellemeleri (SignalR
  // baglantisi kopmus/henuz kurulmamis olabilir) yakalayan bir guvenlik agi.
  // Ilk mount'ta yukaridaki 'initial' fetch zaten calistigi icin, ilk
  // odaklanmayi atlayip sadece SONRAKI odaklanmalarda calisiyoruz.
  const hasFocusedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }
      // Zaten devam eden bir istek varsa (orn. arama sonucu hala geliyor)
      // ustune bir tane daha eklemeye gerek yok - o istek zaten taze veriyi
      // getirecek.
      if (isFetchingRef.current) return;
      fetchPageRef.current(1, 'silent');
    }, []),
  );

  const handleRefresh = useCallback(() => {
    fetchPage(1, 'refresh');
  }, [fetchPage]);

  const handleEndReached = useCallback(() => {
    // isFetchingRef senkron oldugu icin, hizli art arda tetiklenen
    // onEndReached cagrilarinin (React state commit'i beklemeden) ayni
    // sayfayi iki kez istemesini engeller - state kontrolu buna EK bir katman.
    if (isFetchingRef.current) return;
    if (isLoading || isRefreshing || isLoadingMore || error) return;
    if (pageNumber >= totalPages) return;
    fetchPage(pageNumber + 1, 'more');
  }, [isLoading, isRefreshing, isLoadingMore, error, pageNumber, totalPages, fetchPage]);

  const handleRetry = useCallback(() => {
    switch (lastFailedModeRef.current) {
      case 'refresh':
        fetchPage(1, 'refresh');
        break;
      case 'more':
        fetchPage(pageNumber + 1, 'more');
        break;
      default:
        fetchPage(1, 'initial');
    }
  }, [pageNumber, fetchPage]);

  // Stabil referans - renderItem'in her cagrisinda yeniden olusturulmuyor,
  // boylece LibraryCard'a gecen prop degismiyor ve React.memo etkili kaliyor
  // (navigation nesnesinin kendisi React Navigation tarafindan stabil tutulur).
  const handleCardPress = useCallback(
    (libraryId: string) => navigation.navigate('LibraryDetail', { libraryId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Library>) => (
      <View style={{ flex: 1 }}>
        <LibraryCard library={item} onPressLibrary={handleCardPress} />
      </View>
    ),
    [handleCardPress],
  );
  const keyExtractor = useCallback((item: Library) => item.id, []);

  // ActiveCheckInBanner primitive prop'lar aldigi ve memo() ile sarili oldugu
  // icin (bkz. ActiveCheckInBanner.tsx), bu elemani da checkInStatus'un
  // ilgili alanlari degismedigi surece ayni referansla dondurup LibraryListScreen'in
  // her render'inda (orn. arama kutusuna yazarken) gereksiz yeniden render'ini
  // engelliyoruz.
  const checkInBannerElement = useMemo(
    () => (
      <ActiveCheckInBanner
        libraryId={checkInStatus?.libraryId ?? null}
        libraryName={checkInStatus?.libraryName ?? null}
        checkedInAt={checkInStatus?.checkedInAt ?? null}
        onPressLibrary={handleCardPress}
      />
    ),
    [checkInStatus?.libraryId, checkInStatus?.libraryName, checkInStatus?.checkedInAt, handleCardPress],
  );

  // Sadece o kaydi guncelleyerek tum listeyi yeniden cekmeden doluluk
  // gostergesini taze tutar - degismeyen kartlar icin ayni referansi
  // dondurdugunden LibraryCard'in React.memo'su gereksiz yere tetiklenmez.
  //
  // LibraryDetailScreen'deki handleOccupancyUpdated ile ayni requestIdRef
  // korumasi: sayaci ilerleterek, bu SignalR guncellemesinden ONCE baslamis
  // ama HENUZ uctaki bir fetchPage (silent/refresh/more) yaniti geri
  // dondugunde, o yanitin (daha eski bir DB anindan geldigi icin gorece
  // "bayat" olabilecek) tam array replace'i bu az once uygulanan taze
  // degerin uzerine yazamasin diye - fetchPage'in basari bloğu zaten
  // requestId !== requestIdRef.current kontrolunu yapiyor, burada sadece
  // sayaci ilerletmek yeterli.
  const handleOccupancyUpdated = useCallback((update: CheckInOutResult) => {
    requestIdRef.current += 1;
    setItems((prev) =>
      prev.map((item) =>
        item.id === update.libraryId
          ? {
              ...item,
              currentOccupancy: update.currentOccupancy,
              occupancyPercentage: update.occupancyPercentage,
              occupancyStatus: update.occupancyStatus,
            }
          : item,
      ),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onOccupancyUpdated(handleOccupancyUpdated);
      return unsubscribe;
    }, [handleOccupancyUpdated]),
  );

  // Ekrana her odaklanmada (ilk mount dahil) taze check-in durumu ceker -
  // ornegin LibraryDetailScreen'den check-out yapip geri donunce banner bu
  // sayede otomatik kaybolur, baska bir cihazdan check-in yapilmissa da
  // burada gorunur. SignalR'daki OccupancyUpdated event'i sadece agregat
  // doluluk sayilarini tasir, "kim check-in yapti" bilgisini icermedigi icin
  // bu durumun kaynagi hep REST + focus-refresh olmali.
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setCheckInStatus(null);
        return;
      }
      let isActive = true;
      getMyCheckInStatus()
        .then((status) => {
          if (isActive) setCheckInStatus(status);
        })
        .catch((err) => {
          // Kullaniciya gorunur bir hata gostermiyoruz (bu ikincil bir ozellik,
          // banner sadece bir sonraki odaklanmada sessizce tekrar denenir) -
          // ama signalRService.ts'deki ayni felsefeyle en azindan gelistirici/log
          // seviyesinde fark edilebilir olsun diye uyari basiyoruz.
          console.warn('[checkin-status] Güncellenemedi:', err);
        });
      return () => {
        isActive = false;
      };
    }, [isAuthenticated]),
  );

  // ID kumesinin stabil bir temsili - useFocusEffect'in bagimliligi bu olsun
  // diye, `items`'in kendisi degil. `items` referansi hem sayfalama/aramada
  // HEM DE her tek handleOccupancyUpdated cagrisinda (yukarida, sadece bir
  // kaydin icerigini guncelleyen .map()) degisiyor - eger asagidaki effect
  // dogrudan `items`'e bagli olsaydi, listede goruntulenen kutuphaneler HIC
  // degismese bile her doluluk guncellemesinde (potansiyel olarak sik sik)
  // tum gruplardan ayrilip yeniden katilma (leave+join) tetiklenirdi. Bu
  // string sadece gercekten farkli bir ID kumesi olustugunda (sayfa/arama
  // degisince) degisir.
  const visibleLibraryIdsKey = useMemo(
    () =>
      items
        .map((item) => item.id)
        .sort()
        .join(','),
    [items],
  );

  // O an listede yuklu olan kutuphanelerin gruplarina katilir - arama/
  // sayfalama ile items degistikce fark otomatik senkronlanir. Basitlik icin
  // "gorunur" degil "yuklu" kayitlar baz alinir (viewport takibi icin
  // FlatList'in onViewableItemsChanged'i gerekirdi) - tipik sayfa
  // boyutlarinda (10-birkaç sayfa) performans sorunu yaratmaz.
  useFocusEffect(
    useCallback(() => {
      const currentIds = visibleLibraryIdsKey ? visibleLibraryIdsKey.split(',') : [];
      currentIds.forEach((id) => joinLibraryGroup(id));

      return () => {
        currentIds.forEach((id) => leaveLibraryGroup(id));
      };
    }, [visibleLibraryIdsKey]),
  );

  const showFullScreenLoading = isLoading && items.length === 0;
  const showFullScreenError = Boolean(error) && items.length === 0 && !isLoading;

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View className="py-4">
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (error && items.length > 0) {
      return (
        <View className="items-center py-4">
          <Text className="mb-2 text-sm text-danger">{error}</Text>
          <Text className="text-sm font-semibold text-primary" onPress={handleRetry}>
            Tekrar dene
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pb-3 pt-4">
        <View className="h-12 flex-row items-center rounded-xl border border-border bg-surface px-3.5">
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.inkFaint} />
          ) : (
            <Ionicons name="search-outline" size={18} color={colors.inkFaint} />
          )}
          <TextInput
            className="ml-2.5 flex-1 text-base text-ink"
            placeholder="Kütüphane ara..."
            placeholderTextColor={colors.inkFaint}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {searchText.length > 0 ? (
            <Pressable hitSlop={8} onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.inkFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showFullScreenLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : showFullScreenError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-danger-light">
            <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
          </View>
          <Text className="mb-1.5 text-center text-base font-semibold text-ink">Bir şeyler ters gitti</Text>
          <Text className="mb-5 text-center text-sm text-ink-muted">{error}</Text>
          <PrimaryButton label="Tekrar Dene" onPress={handleRetry} />
        </View>
      ) : (
        <FlatList
          // FlatList calisirken numColumns degistirilemiyor (RN kisitlamasi) - tablet/telefon
          // esigini gecince (rotasyon, web'de pencere boyutu degisimi) key degisip liste yeniden
          // "mount" edilerek yeni sutun sayisiyla dogru render edilmesi saglaniyor.
          key={numColumns}
          data={items}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? { gap: 12 } : undefined}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={checkInBannerElement}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
                <Ionicons name="library-outline" size={32} color={colors.primary} />
              </View>
              <Text className="mb-1.5 text-base font-semibold text-ink">Kütüphane bulunamadı</Text>
              <Text className="text-center text-sm text-ink-muted">
                {debouncedSearch ? `"${debouncedSearch}" için sonuç bulunamadı.` : 'Henüz kayıtlı kütüphane yok.'}
              </Text>
            </View>
          }
          ListFooterComponent={renderFooter()}
        />
      )}
    </View>
  );
}
