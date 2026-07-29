import { Modal, Pressable, Text, View } from 'react-native';

import { colors } from '../theme/colors';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  // Silme gibi geri donduruemez/yikici islemlerde onay butonunu kirmizi
  // (danger) yapar - varsayilan false, normal (primary renkli) bir onaydir.
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Native Alert.alert yerine tasarim standartlarimiza uygun, ozel bir onay
// diyalogu. Parent, mevcut Modal bilesenlerindeki (bkz. web/src/components/Modal.tsx
// ile ayni prensip) desenle bunu SADECE gostermek istedigi anda kosullu olarak
// render eder - kendi "visible" prop'unu yonetmez.
export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-ink/40 px-6">
        <View
          className="w-full max-w-[360px] rounded-2xl bg-surface p-6"
          style={{
            shadowColor: colors.ink,
            shadowOpacity: 0.2,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}
        >
          <Text className="text-lg font-bold text-ink">{title}</Text>
          <Text className="mt-2 text-sm text-ink-muted">{message}</Text>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-xl border border-border py-3 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-ink-muted">{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className={`flex-1 items-center justify-center rounded-xl py-3 active:opacity-80 ${
                isDangerous ? 'bg-danger' : 'bg-primary'
              }`}
            >
              <Text className="text-sm font-semibold text-white">{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
