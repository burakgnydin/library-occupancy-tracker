import { memo } from 'react';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import IconBadge from './IconBadge';
import { AUTH_CONTENT_MAX_WIDTH } from '../theme/layout';

interface AuthScreenLayoutProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBgClassName: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}

// LoginScreen ve RegisterScreen'in ortak dis sarmalayicisi: klavye-uyumlu scroll +
// tablette gerilmesin diye max-w-[480px] self-center (bkz. CLAUDE.md responsive kurali)
// + ikon rozeti/baslik/alt baslik deseni. Iki ekran arasinda degisen tek sey ikon/renk/
// metin - form icerigi children olarak geciliyor.
function AuthScreenLayout({ icon, iconColor, iconBgClassName, title, subtitle, children }: AuthScreenLayoutProps) {
  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="px-6">
        <View className="flex-1 justify-center">
          {/* Tablette form genislemesin diye maksimum genislik + ortalama (bkz. CLAUDE.md
              responsive kurali) - telefonda w-full zaten mevcut genislikten dar oldugu icin
              AUTH_CONTENT_MAX_WIDTH hicbir etki yapmaz. */}
          <View className={`w-full ${AUTH_CONTENT_MAX_WIDTH} self-center`}>
            <View className="mb-10 items-center">
              <View className="mb-4">
                <IconBadge icon={icon} size={32} backgroundClassName={`h-16 w-16 rounded-2xl ${iconBgClassName}`} iconColor={iconColor} />
              </View>
              <Text className="text-2xl font-bold text-ink">{title}</Text>
              <Text className="mt-1.5 text-sm text-ink-muted">{subtitle}</Text>
            </View>

            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default memo(AuthScreenLayout);
