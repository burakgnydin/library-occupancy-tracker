declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        // Development'ta artik zorunlu degil (bkz. src/utils/apiBaseUrl.ts -
        // Metro'nun host IP'sinden otomatik turetilir); production build'de
        // gercek domain'i vermek icin hala gerekli.
        EXPO_PUBLIC_API_BASE_URL?: string;
      }
    }
  }
}

export {};
