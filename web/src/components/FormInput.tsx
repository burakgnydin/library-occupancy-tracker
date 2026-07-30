import type { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

// LoginPage, LibraryFormModal ve StaffPage'de tekrarlanan "label + input + (opsiyonel)
// hata gosterimi" temel form alani deseni ve uzun Tailwind className'i tek yerde. Standart
// input prop'lari (value/onChange/type/placeholder/required/maxLength/min/autoComplete vb.)
// InputHTMLAttributes'tan miras alinip dogrudan <input>'a aktariliyor - her birini ayrica
// tanimlamaya gerek yok.
export default function FormInput({ label, error, ...inputProps }: FormInputProps) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
      {label}
      <input
        {...inputProps}
        className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
      />
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </label>
  );
}
