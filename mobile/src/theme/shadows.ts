import { StyleSheet } from 'react-native';

import { colors } from './colors';

// LibraryCard ve LibraryDetailScreen'in bilgi/doluluk kartlarinda tekrarlanan golge stili -
// StyleSheet.create ile tek yerden tanimlanip referans olarak paylasilir (React Native'de
// inline style objeleri her render'da yeniden olusturulur, StyleSheet.create bunu onler).
// Farkli golge degerleri kullanan yerler (ActiveCheckInBanner, ConfirmDialog) kasitli olarak
// buraya dahil edilmedi - onlarin opacity/radius/offset/elevation degerleri farkli, ayni
// sabiti paylasmiyorlar. PrimaryButton ve LibraryDetailScreen'in alt aksiyon butonu ise
// AYNI sayisal golge seklini paylasiyor (sadece renk degisiyor) - bkz. actionButtonShadow.
export const shadows = StyleSheet.create({
  cardShadow: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});

// PrimaryButton ve LibraryDetailScreen'in alt aksiyon butonunun (check-in/check-out) paylastigi
// golge sekli - tek fark renk (biri hep colors.primary, digeri check-in durumuna gore
// colors.danger/colors.success arasinda degisiyor), bu yuzden StyleSheet.create'e sabit bir
// girdi olarak degil, renk parametreli bir factory olarak tanimlanir. StyleSheet.create'in
// aksine bu her cagrida yeni bir obje dondurur (renk dinamik oldugu icin statik bir referans
// mumkun degil) - cagiran taraflar zaten Pressable'in inline style prop'unda kullaniyor, ekstra
// bir memoizasyon maliyeti yok.
export function actionButtonShadow(color: string) {
  return {
    shadowColor: color,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  };
}
