declare module 'process' {
  global {
    namespace NodeJS {
      interface ProcessEnv {
        EXPO_PUBLIC_API_BASE_URL: string;
      }
    }
  }
}

export {};
