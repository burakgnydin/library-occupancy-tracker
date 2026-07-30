import { StyleSheet } from 'react-native';

import { colors } from './colors';

// LibraryCard ve LibraryDetailScreen'in bilgi/doluluk kartlarinda tekrarlanan golge stili -
// StyleSheet.create ile tek yerden tanimlanip referans olarak paylasilir (React Native'de
// inline style objeleri her render'da yeniden olusturulur, StyleSheet.create bunu onler).
// Farkli golge degerleri kullanan yerler (PrimaryButton, ActiveCheckInBanner, ConfirmDialog,
// LibraryDetailScreen'in alt aksiyon butonu) kasitli olarak buraya dahil edilmedi - onlarin
// opacity/radius/offset/elevation degerleri farkli, ayni sabiti paylasmiyorlar.
export const shadows = StyleSheet.create({
  cardShadow: {
    shadowColor: colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
});
