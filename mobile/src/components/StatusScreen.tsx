import { memo } from 'react';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import IconBadge from './IconBadge';
import PrimaryButton from './PrimaryButton';
import { AUTH_CONTENT_MAX_WIDTH } from '../theme/layout';

interface StatusScreenProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgClassName: string;
  title: string;
  // Cogu kullanimda duz bir string yeterli, ama QrScannerScreen'in "izin reddedildi"
  // durumu aciklamanin altina ayrica vurgulu (danger renkli) bir satir daha eklemek
  // zorunda - bu yuzden ReactNode kabul edilip string'ler otomatik varsayilan stille
  // sarmalanir.
  description: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

// LibraryListScreen (hata durumu), LibraryDetailScreen (hata durumu) ve
// QrScannerScreen'in (kamera izni ekrani) tekrarlanan "ikon rozeti + baslik + aciklama +
// opsiyonel buton" durum ekrani deseni. Tablette icerik gerilmesin diye AUTH_CONTENT_MAX_WIDTH
// self-center her zaman uygulanir (bkz. CLAUDE.md responsive kurali) - QrScannerScreen
// bunu zaten tek basina yapiyordu, List/Detail'in hata durumlari bu birlestirmeyle ayni
// korumayi kazaniyor.
function StatusScreen({ icon, iconColor, iconBgClassName, title, description, actionLabel, onAction }: StatusScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <View className={`w-full ${AUTH_CONTENT_MAX_WIDTH} items-center self-center`}>
        <View className="mb-4">
          <IconBadge icon={icon} size={32} backgroundClassName={`h-16 w-16 rounded-2xl ${iconBgClassName}`} iconColor={iconColor} />
        </View>
        <Text className="mb-1.5 text-center text-base font-semibold text-ink">{title}</Text>
        <View className="mb-5">
          {typeof description === 'string' ? (
            <Text className="text-center text-sm text-ink-muted">{description}</Text>
          ) : (
            description
          )}
        </View>
        {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
      </View>
    </View>
  );
}

export default memo(StatusScreen);
