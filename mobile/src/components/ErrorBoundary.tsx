import { Component } from 'react';
import type { ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import StatusScreen from './StatusScreen';
import { colors } from '../theme/colors';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// React'in error boundary'leri SADECE render/lifecycle/constructor hatalarini yakalar -
// event handler'lardaki (onPress vb.) ya da async kod icindeki hatalari YAKALAMAZ (React'in
// kendi kisitlamasi, class component olarak yazilmasinin da sebebi budur - function
// component'lerde bu API henuz yok). Amac genel bir global try/catch degil; occupancyStyles
// fallback'i (bkz. utils/occupancyStyles.ts) gibi bir koruma olmasaydi olusacak TypeError
// sinifindaki beklenmeyen RENDER hatalarinda uygulamanin beyaz ekrana dusup crash olmasi
// yerine kullanici dostu bir "yeniden dene" ekrani gostermesini saglamak.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('[ErrorBoundary] Yakalanan render hatasi:', error, errorInfo);
    // Guvenlik agi: normal kapanma yolu AppNavigator'daki isHydrating geçişine bagli (bkz. o
    // dosyadaki yorum) - eger bu componentDidCatch'i tetikleyen hata AppNavigator daha
    // isHydrating=false'a hic ulasamadan olustuysa, o efekt hicbir zaman calismaz ve native
    // splash ekrani bu fallback'in arkasinda sonsuza kadar acik kalirdi (kullanici hicbir
    // zaman asagidaki "Tekrar Dene" ekranini goremezdi). hideAsync zaten idempotent/no-op
    // (splash zaten kapaliysa hicbir sey yapmaz), bu yuzden burada tekrar cagirmak zararsiz.
    SplashScreen.hideAsync().catch(() => {});
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <StatusScreen
        icon="warning-outline"
        iconColor={colors.danger}
        iconBgClassName="bg-danger-light"
        title="Bir şeyler ters gitti"
        description="Uygulamada beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatın."
        actionLabel="Tekrar Dene"
        onAction={this.handleReset}
      />
    );
  }
}
