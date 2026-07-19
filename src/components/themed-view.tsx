import { View, type ViewProps } from '@/tw';
import { ThemeColor } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
};

const backgroundClassName: Record<ThemeColor, string> = {
  text: 'bg-text',
  background: 'bg-background',
  backgroundElement: 'bg-background-element',
  backgroundSelected: 'bg-background-selected',
  textSecondary: 'bg-text-secondary',
};

export function ThemedView({ className, type, ...otherProps }: ThemedViewProps) {
  return <View className={[backgroundClassName[type ?? 'background'], className].filter(Boolean).join(' ')} {...otherProps} />;
}
