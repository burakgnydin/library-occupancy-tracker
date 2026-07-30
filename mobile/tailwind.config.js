/** @type {import('tailwindcss').Config} */
// Tek renk kaynagi: src/theme/colors.ts. Burada ikinci, elle senkronize edilen bir hex
// listesi TUTULMUYOR - asagidaki `colors` objesi sadece o dosyadaki duz degerleri
// Tailwind'in nested renk skalasi (DEFAULT/dark/light) sekline haritalar; degerlerin
// kendisi SADECE colors.ts'te tanimli.
const { colors } = require('./src/theme/colors.ts');

module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colors.primary,
          dark: colors.primaryDark,
          light: colors.primaryLight,
        },
        accent: {
          DEFAULT: colors.accent,
          light: colors.accentLight,
        },
        ink: {
          DEFAULT: colors.ink,
          muted: colors.inkMuted,
          faint: colors.inkFaint,
        },
        surface: colors.surface,
        background: colors.background,
        border: colors.border,
        danger: {
          DEFAULT: colors.danger,
          light: colors.dangerLight,
        },
        success: {
          DEFAULT: colors.success,
          light: colors.successLight,
        },
        warning: {
          DEFAULT: colors.warning,
          light: colors.warningLight,
        },
      },
      // FormInput/PrimaryButton'daki tekrarlanan h-[52px] magic number'inin adlandirilmis
      // hali - bkz. h-control kullanimlari.
      height: {
        control: '52px',
      },
    },
  },
  plugins: [],
}
