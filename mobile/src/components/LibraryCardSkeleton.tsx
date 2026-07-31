import { memo } from 'react';
import { Animated, View } from 'react-native';

import { usePulseAnimation } from '../hooks/usePulseAnimation';

const PULSE_DURATION_MS = 700;

// LibraryCard ile ayni boyut/duzen iskeleti - ilk yuklemede spinner yerine gosterilen
// norotr renkli placeholder. ActiveCheckInBanner'daki ayni pulse deseni usePulseAnimation
// hook'unda paylasilir.
function LibraryCardSkeleton() {
  const pulseAnim = usePulseAnimation(0.4, 1, PULSE_DURATION_MS);

  return (
    <Animated.View className="mb-3 rounded-2xl bg-surface p-4" style={{ opacity: pulseAnim }}>
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <View className="h-4 w-3/4 rounded bg-border" />
          <View className="mt-2 h-3 w-full rounded bg-border" />
        </View>
        <View className="h-6 w-12 rounded-full bg-border" />
      </View>

      <View className="mt-3">
        <View className="h-2 w-full rounded-full bg-border" />
        <View className="mt-1.5 flex-row items-center justify-between">
          <View className="h-3 w-16 rounded bg-border" />
          <View className="h-3 w-12 rounded bg-border" />
        </View>
      </View>
    </Animated.View>
  );
}

export default memo(LibraryCardSkeleton);
