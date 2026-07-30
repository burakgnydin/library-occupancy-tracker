import { memo } from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

import { colors } from '../theme/colors';

interface PrimaryButtonProps extends PressableProps {
  label: string;
  loading?: boolean;
}

function PrimaryButton({ label, loading, disabled, ...pressableProps }: PrimaryButtonProps) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      className={`h-control flex-row items-center justify-center rounded-xl bg-primary active:bg-primary-dark ${
        isDisabled ? 'opacity-60' : ''
      }`}
      style={{
        shadowColor: colors.primary,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      {loading ? <ActivityIndicator color={colors.surface} /> : <Text className="text-base font-semibold text-surface">{label}</Text>}
    </Pressable>
  );
}

export default memo(PrimaryButton);
