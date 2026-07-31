import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// LibraryCardSkeleton ve ActiveCheckInBanner'daki birebir ayni "sonsuz git-gel" pulse
// deseni (useRef + useEffect + Animated.loop(Animated.sequence(...)) + cleanup) tek yerde.
// fromValue'dan toValue'ya, sonra geri fromValue'ya animasyonlu gecisi sonsuz dongude
// tekrarlayan bir Animated.Value dondurur - useNativeDriver: true ile JS thread'ini
// meşgul etmez.
//
// enabled=false iken (varsayilan true) donguyu hic baslatmaz/durdurur - ActiveCheckInBanner
// gibi kosullu render eden cagiranlarin, componentleri gorunmezken (orn. aktif check-in
// yokken) bosuna arka planda animasyon calistirmasini onler.
export function usePulseAnimation(fromValue: number, toValue: number, durationMs: number, enabled = true) {
  const animatedValue = useRef(new Animated.Value(fromValue)).current;

  useEffect(() => {
    if (!enabled) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue, duration: durationMs, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: fromValue, duration: durationMs, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue, fromValue, toValue, durationMs, enabled]);

  return animatedValue;
}
