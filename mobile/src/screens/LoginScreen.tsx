import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { AuthStackParamList } from '../navigation/AppNavigator';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const route = useRoute<LoginRouteProp>();
  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      clearError();
    }, [clearError]),
  );

  useEffect(() => {
    if (route.params?.infoMessage) {
      setInfoMessage(route.params.infoMessage);
      navigation.setParams({ infoMessage: undefined });
    }
  }, [route.params?.infoMessage, navigation]);

  const handleLogin = async () => {
    setInfoMessage(null);
    await login(email.trim(), password);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="px-6">
        <View className="flex-1 justify-center">
          {/* Tablette form genislemesin diye maksimum genislik + ortalama (bkz. CLAUDE.md
              responsive kurali) - telefonda w-full zaten mevcut genislikten dar oldugu icin
              max-w-[480px] hicbir etki yapmaz. */}
          <View className="w-full max-w-[480px] self-center">
            <View className="mb-10 items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
                <Ionicons name="library-outline" size={32} color={colors.primary} />
              </View>
              <Text className="text-2xl font-bold text-ink">TraKütüp'e Hoş Geldin</Text>
              <Text className="mt-1.5 text-sm text-ink-muted">Devam etmek için giriş yap</Text>
            </View>

            {infoMessage ? (
              <View className="mb-4 rounded-xl border border-accent bg-accent-light px-4 py-3">
                <Text className="text-sm text-accent">{infoMessage}</Text>
              </View>
            ) : null}

            {error ? (
              <View className="mb-4 rounded-xl border border-danger bg-danger-light px-4 py-3">
                <Text className="text-sm text-danger">{error}</Text>
              </View>
            ) : null}

            <FormInput
              label="E-posta"
              icon="mail-outline"
              placeholder="ornek@eposta.com"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />

            <FormInput
              label="Şifre"
              icon="lock-closed-outline"
              placeholder="••••••••"
              isPassword
              autoCapitalize="none"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />

            <View className="mt-2">
              <PrimaryButton label="Giriş Yap" loading={isSubmitting} onPress={handleLogin} />
            </View>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-sm text-ink-muted">Hesabın yok mu? </Text>
              <Text className="text-sm font-semibold text-primary" onPress={() => navigation.navigate('Register')}>
                Kayıt ol
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
