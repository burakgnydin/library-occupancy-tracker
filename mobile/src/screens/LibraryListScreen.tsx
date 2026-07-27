import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

import LibraryCard from '../components/LibraryCard';
import PrimaryButton from '../components/PrimaryButton';
import { getLibraries } from '../services/libraryService';
import { getApiErrorMessage } from '../utils/apiError';
import { colors } from '../theme/colors';
import type { Library } from '../types/library';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;
// Bu projenin responsive tasarim kurali icin referans tablet breakpoint'i (bkz. CLAUDE.md).
const TABLET_BREAKPOINT = 768;

type FetchMode = 'initial' | 'refresh' | 'more';

export default function LibraryListScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= TABLET_BREAKPOINT ? 2 : 1;

  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [items, setItems] = useState<Library[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);

      try {
        const result = await getLibraries({
          search: debouncedSearch || undefined,
          pageNumber: targetPage,
          pageSize: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        lastFailedModeRef.current = null;
        setItems((prev) => (mode === 'more' ? [...prev, ...result.items] : result.items));
        setPageNumber(result.pageNumber);
        setTotalPages(result.totalPages);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
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

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Library>) => (
      <View style={{ flex: 1 }}>
        <LibraryCard library={item} />
      </View>
    ),
    [],
  );
  const keyExtractor = useCallback((item: Library) => item.id, []);

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
