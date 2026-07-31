import { memo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface IconBadgeProps {
  icon: keyof typeof Ionicons.glyphMap;
  size: number;
  // Boyut + koseleri yuvarlama + arka plan rengini birlikte tasir (orn. "h-16 w-16
  // rounded-2xl bg-primary-light" ya da "h-5 w-5 rounded-full bg-primary") - kullanim
  // yerleri arasinda hem sekil hem renk degistigi icin (AuthScreenLayout'un buyuk kose
  // yuvarlatilmis rozeti vs. AuthHeaderStatus'un kucuk yuvarlak avatari) bunlari tek bir
  // className string'inde birlestirmek, IconBadge'i tum kullanimlara uyacak sekilde
  // esnek tutar.
  backgroundClassName: string;
  iconColor: string;
}

// AuthScreenLayout, AuthHeaderStatus, StatusScreen, LibraryListScreen'in bos liste
// durumu gibi yerlerde tekrarlanan "renkli arka plan + ortalanmis ikon" deseni.
function IconBadge({ icon, size, backgroundClassName, iconColor }: IconBadgeProps) {
  return (
    <View className={`items-center justify-center ${backgroundClassName}`}>
      <Ionicons name={icon} size={size} color={iconColor} />
    </View>
  );
}

export default memo(IconBadge);
