import { useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';

interface FormInputProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  isPassword?: boolean;
}

export default function FormInput({ label, icon, error, isPassword, ...textInputProps }: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(Boolean(isPassword));

  const borderColorClass = error ? 'border-danger' : isFocused ? 'border-primary' : 'border-border';
  const iconColor = error ? colors.danger : isFocused ? colors.primary : colors.inkFaint;

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-ink">{label}</Text>
      <View className={`h-[52px] flex-row items-center rounded-xl border bg-surface px-3.5 ${borderColorClass}`}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <TextInput
          {...textInputProps}
          className="ml-2.5 flex-1 text-base text-ink"
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={isSecure}
          onFocus={(event) => {
            setIsFocused(true);
            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            textInputProps.onBlur?.(event);
          }}
        />
        {isPassword ? (
          <Pressable hitSlop={8} onPress={() => setIsSecure((prev) => !prev)}>
            <Ionicons name={isSecure ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.inkFaint} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="mt-1.5 text-xs text-danger">{error}</Text> : null}
    </View>
  );
}
