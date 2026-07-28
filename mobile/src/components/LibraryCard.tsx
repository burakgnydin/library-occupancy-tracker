import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Library } from '../types/library';
import { colors } from '../theme/colors';
import { occupancyLabels, occupancyStyles } from '../utils/occupancyStyles';

interface LibraryCardProps {
  library: Library;
  // libraryId'yi parametre olarak alir (kart yerine ebeveynin bir onPress
  // closure'i kurmasi yerine) - boylece ebeveyn tarafinda tek, stabil bir
  // useCallback yeterli olur ve her satirin kendi inline fonksiyonu
  // LibraryCard'in React.memo'sunu etkisiz kilmaz.
  onPressLibrary: (libraryId: string) => void;
}

function LibraryCard({ library, onPressLibrary }: LibraryCardProps) {
  const statusStyle = occupancyStyles[library.occupancyStatus];
  const fillPercentage = Math.min(100, Math.max(0, library.occupancyPercentage));

  return (
    <Pressable
      onPress={() => onPressLibrary(library.id)}
      className="mb-3 rounded-2xl bg-surface p-4 active:opacity-80"
      style={{
        shadowColor: colors.ink,
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-bold text-ink" numberOfLines={1}>
            {library.name}
          </Text>
          <View className="mt-1 flex-row items-center">
            <Ionicons name="location-outline" size={14} color={colors.inkMuted} />
            <Text className="ml-1 flex-1 text-xs text-ink-muted" numberOfLines={1}>
              {library.address}, {library.district} / {library.city}
            </Text>
          </View>
        </View>

        <View className={`rounded-full border px-2.5 py-1 ${statusStyle.border} ${statusStyle.bg}`}>
          <Text className={`text-xs font-semibold ${statusStyle.text}`}>%{library.occupancyPercentage}</Text>
        </View>
      </View>

      <View className="mt-3">
        <View className="h-2 overflow-hidden rounded-full bg-border">
          <View
            className="h-full rounded-full"
            style={{ width: `${fillPercentage}%`, backgroundColor: statusStyle.solid }}
          />
        </View>
        <View className="mt-1.5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color={colors.inkMuted} />
            <Text className="ml-1 text-xs text-ink-muted">
              {library.currentOccupancy}/{library.capacity} kişi
            </Text>
          </View>
          <Text className={`text-xs font-medium ${statusStyle.text}`}>{occupancyLabels[library.occupancyStatus]}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(LibraryCard);
