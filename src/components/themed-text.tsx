import { Text, type TextProps } from '@/tw';
import { ThemeColor } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

const colorClassName: Record<ThemeColor, string> = {
  text: 'text-text',
  background: 'text-background',
  backgroundElement: 'text-background-element',
  backgroundSelected: 'text-background-selected',
  textSecondary: 'text-text-secondary',
};

const typeClassName: Record<NonNullable<ThemedTextProps['type']>, string> = {
  default: 'text-base leading-6 font-medium',
  title: 'text-5xl font-semibold leading-[52px]',
  small: 'text-sm leading-5 font-medium',
  smallBold: 'text-sm leading-5 font-bold',
  subtitle: 'text-[32px] leading-[44px] font-semibold',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-link-primary',
  code: 'font-mono font-code-weight text-xs',
};

export function ThemedText({ className, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  return (
    <Text
      className={[colorClassName[themeColor ?? 'text'], typeClassName[type], className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    />
  );
}
