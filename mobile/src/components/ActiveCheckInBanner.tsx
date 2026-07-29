import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';

interface ActiveCheckInBannerProps {
  // checkInStatus'un tamami yerine bilerek tek tek primitive'ler aliniyor -
  // LibraryListScreen'de checkInStatus her focus'ta yeni bir obje referansi
  // olarak geliyor (JSON parse), bu da tek bir `status` prop'u ile React.memo'nun
  // shallow-compare'ini etkisiz kilardi. Primitive'ler deger bazinda
  // karsilastirildigi icin (LibraryCard'in `library` objesini stabil
  // referansla tutmasiyla ayni amaca hizmet eden, buradaki veri kaynagina
  // daha uygun bir yontem) memo, deger degismedigi surece yeniden render'i
  // otomatik olarak engeller.
  libraryId: string | null;
  libraryName: string | null;
  checkedInAt: string | null;
  onPressLibrary: (libraryId: string) => void;
}

const TICK_MS = 1000;
const PULSE_DURATION_MS = 700;

function formatCheckedInAtLabel(checkedInAt: string): string {
  const date = new Date(checkedInAt);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}'den beri`;
}

function formatElapsedLabel(checkedInAt: string, now: number): string {
  // Cihaz saati ile sunucu saati arasinda kucuk bir sapma olursa (veya
  // checkedInAt henuz "simdi"den once gelmemisse) negatif sureyi 0'a sabitler.
  const elapsedMs = Math.max(0, now - new Date(checkedInAt).getTime());
  const totalMinutes = Math.floor(elapsedMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}s ${minutes}dk` : `${minutes}dk`;
}

// Kutuphane listesinin en ustunde, sadece aktif bir check-in'i olan giris
// yapmis kullaniciya gorunen ozet karti. checkedInAt'ten bu yana gecen sureyi
// her saniye yeniden hesaplayip "canli" hissettirir - liste ekranindaki diger
// kartlardan ayrisması icin vurgu (accent) rengi kullanir.
function ActiveCheckInBanner({ libraryId, libraryName, checkedInAt, onPressLibrary }: ActiveCheckInBannerProps) {
  const [now, setNow] = useState(() => Date.now());
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!libraryId || !checkedInAt) return;
    const intervalId = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(intervalId);
  }, [libraryId, checkedInAt]);

  useEffect(() => {
    if (!libraryId || !checkedInAt) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: PULSE_DURATION_MS, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: PULSE_DURATION_MS, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [libraryId, checkedInAt, pulseAnim]);

  if (!libraryId || !checkedInAt) return null;

  return (
    <Pressable
      onPress={() => onPressLibrary(libraryId)}
      className="mb-4 rounded-2xl border border-accent bg-accent-light p-4 active:opacity-80"
      style={{
        shadowColor: colors.accent,
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <View className="flex-row items-center">
        <Animated.View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.accent,
            opacity: pulseAnim,
          }}
        />
        <Text className="ml-2 text-xs font-bold uppercase text-accent">Şu An Buradayım</Text>
      </View>

      <View className="mt-2 flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-bold text-ink" numberOfLines={1}>
            {libraryName ?? 'Kütüphane'}
          </Text>
          <Text className="mt-0.5 text-xs text-ink-muted">{formatCheckedInAtLabel(checkedInAt)}</Text>
        </View>

        <View className="flex-row items-center rounded-full bg-surface px-3 py-1.5">
          <Ionicons name="time-outline" size={14} color={colors.accent} />
          <Text className="ml-1 text-xs font-semibold text-accent">{formatElapsedLabel(checkedInAt, now)}</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center justify-end">
        <Text className="text-xs font-medium text-accent">Kütüphaneye git</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.accent} />
      </View>
    </Pressable>
  );
}

export default memo(ActiveCheckInBanner);
