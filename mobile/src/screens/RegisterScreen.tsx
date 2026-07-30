import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AuthScreenLayout from '../components/AuthScreenLayout';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { useAuthStore } from '../store/authStore';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/AppNavigator';

type RegisterNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useFocusEffect(
    useCallback(() => {
      clearError();
    }, [clearError]),
  );

  const handleRegister = async () => {
    // Backend'e hic istek atmadan once, mevcut store.error mekanizmasiyla
    // (LoginScreen/authStore ile ayni desen) anlik geri bildirim - useAuthStore.setState
    // burada dogrudan kullaniliyor cunku bu, register() cagrisina baglanmadan
    // once, salt client-side bir kontrol (authStore'un kendi action'larindan
    // biri degil).
    if (password !== confirmPassword) {
      useAuthStore.setState({ error: 'Şifreler eşleşmiyor.' });
      return;
    }

    const outcome = await register(fullName.trim(), email.trim(), password);
    if (outcome === 'success') {
      // Libraries her zaman stack'in kokunde - otomatik giris basariliysa
      // Login/Register'i tamamen kaldirip misafir olarak kaldigi ekrana doner.
      navigation.popToTop();
    } else if (outcome === 'registered-but-login-failed') {
      // navigate() yerine popTo(): stack burada Libraries -> Login -> Register
      // (Login'in "Kayıt ol" linkiyle buraya gelinmiş) - Login zaten stack'te
      // Register'in bir alt katmaninda mevcut. QrScannerScreen'de duzeltilen
      // ayni React Navigation belirsizligi (navigate()'in bazen MEVCUT
      // instance'a donmek yerine yeni bir instance push etmesi) burada da
      // gecerli - popTo() acikca "stack'teki mevcut Login'e don" davranisini
      // garanti ederek geri tusu/kaydirma ile "kaldigi yere donme"
      // invaryantini (bkz. useRequireAuth) bozmadan korur.
      navigation.popTo('Login', { infoMessage: 'Hesabınız oluşturuldu, giriş yapabilirsiniz.' });
    }
  };

  return (
    <AuthScreenLayout
      icon="person-add-outline"
      iconColor={colors.accent}
      iconBgClassName="bg-accent-light"
      title="Hesap Oluştur"
      subtitle="TraKütüp'ü kullanmaya başla"
    >
      {error ? (
        <View className="mb-4 rounded-xl border border-danger bg-danger-light px-4 py-3">
          <Text className="text-sm text-danger">{error}</Text>
        </View>
      ) : null}

      <FormInput
        label="Ad Soyad"
        icon="person-outline"
        placeholder="Ad Soyad"
        autoCapitalize="words"
        textContentType="name"
        value={fullName}
        onChangeText={setFullName}
        editable={!isSubmitting}
      />

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
        placeholder="En az 6 karakter"
        isPassword
        autoCapitalize="none"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
        editable={!isSubmitting}
      />

      <FormInput
        label="Şifre Tekrar"
        icon="lock-closed-outline"
        placeholder="Şifrenizi tekrar girin"
        isPassword
        autoCapitalize="none"
        textContentType="newPassword"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!isSubmitting}
      />

      <View className="mt-2">
        <PrimaryButton label="Kayıt Ol" loading={isSubmitting} onPress={handleRegister} />
      </View>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-sm text-ink-muted">Zaten hesabın var mı? </Text>
        <Text className="text-sm font-semibold text-primary" onPress={() => navigation.navigate('Login')}>
          Giriş yap
        </Text>
      </View>
    </AuthScreenLayout>
  );
}
