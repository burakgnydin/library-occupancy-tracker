// LibrariesPage'in filtre input'ları ve StaffPage'in arama/rol-filtre alanlarında
// tekrarlanan "etiketsiz, kompakt input/select" görsel deseni tek yerde. FormInput
// (components/FormInput.tsx) bunları kapsayamaz - zorunlu bir `label` prop'u alıp
// <label> içine sarıyor, bu alanların hiçbiri etiketli değil. Genişlik bilerek dışarıda
// bırakıldı (çağıran taraflar arasında farklı: w-48/w-36/w-56 gibi) - sadece kalıcı
// görsel şekil (border/radius/padding/renk/focus) burada, genişlik çağıran tarafta
// `` `w-48 ${COMPACT_INPUT_CLASSNAME}` `` şeklinde birleştirilir.
export const COMPACT_INPUT_CLASSNAME =
  'rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light';

// StaffPage'in tablo satırı içindeki rol değiştirme select'i gibi daha kısıtlı bir
// alanda kullanılan, daha küçük ve devre-dışı durumu da olan varyant.
export const COMPACT_INPUT_SMALL_CLASSNAME =
  'rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light disabled:cursor-not-allowed disabled:opacity-60';
