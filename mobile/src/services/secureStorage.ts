import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface SecureStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

// expo-secure-store web'de desteklenmiyor (native modul yok, getValueWithKeyAsync
// tanimsiz) - bu yuzden web'de localStorage'a duselim. localStorage, SecureStore'un
// aksine sifrelenmiş/isletim sistemi tarafindan korumali degil (duz metin olarak
// tarayicida durur). Bu sadece web preview/gelistirme kolayligi icindir - gercek
// production dagitimi native (iOS/Android) oldugundan bu bir guvenlik acigi teskil
// etmez, gercek kullanicilar hep SecureStore uzerinden gecer.
const webStorage: SecureStorage = {
  async getItem(key) {
    return localStorage.getItem(key);
  },
  async setItem(key, value) {
    localStorage.setItem(key, value);
  },
  async deleteItem(key) {
    localStorage.removeItem(key);
  },
};

const nativeStorage: SecureStorage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  deleteItem: SecureStore.deleteItemAsync,
};

export const secureStorage: SecureStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
