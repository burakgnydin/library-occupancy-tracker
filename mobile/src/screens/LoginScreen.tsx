import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AuthScreenLayout from '../components/AuthScreenLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
type LoginRouteProp = RouteProp<RootStackParamList, 'Login'>;

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
    const success = await login(email.trim(), password);
    if (success) {
      // Libraries her zaman stack'in kokunde - basarili girişten sonra
      // Login/Register'i tamamen kaldirip misafir olarak kaldigi ekrana doner.
      navigation.popToTop();
    }
  };

  return (
    <AuthScreenLayout
      icon="library-outline"
      iconColor={colors.primary}
      iconBgClassName="bg-primary-light"
      title="TraKütüp'e Hoş Geldin"
      subtitle="Devam etmek için giriş yap"
    >
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
        editable={!isSubmitting}
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
        editable={!isSubmitting}
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
    </AuthScreenLayout>
  );
}
