import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const theme = useTheme();
  const background = { primary: '#208AEF', secondary: theme.backgroundElement, destructive: '#D93025' }[variant];
  const color = variant === 'secondary' ? theme.text : '#ffffff';
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        (pressed || inactive) && styles.dimmed,
      ]}>
      {loading ? <ActivityIndicator color={color} /> : <Text style={[styles.label, { color }]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '600' },
  dimmed: { opacity: 0.6 },
});
