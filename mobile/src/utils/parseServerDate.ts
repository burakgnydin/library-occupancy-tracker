// Backend'in DateTime alanlari (CheckedInAt, CreatedAt, ...) her zaman UTC bir anlik
// degeri temsil eder (bkz. backend/CLAUDE.md - DateTime.UtcNow), AMA System.Text.Json'in
// varsayilan DateTime converter'i, deger DB'den okunmus bir DateTime ise (SQLite Kind
// bilgisini kaybettigi icin - backend tarafinda ApplicationDbContext'te ayrica duzeltildi)
// veya baska bir sebeple Kind=Unspecified ise sondaki "Z" son ekini EKLEMEZ - orn.
// "2026-07-31T14:23:00" (offset/Z YOK). JavaScript'in Date Time String Format'i, boyle
// bir "Z"/offset'siz string'i UTC degil YEREL saat olarak yorumlar - bu da cihazin UTC
// farki kadar (orn. Turkiye'de +3 saat) yanlis bir Date nesnesi uretir. Bu, "Su An
// Buradayim" karti gibi ekranlarda giris anindaki gecen sureyi ~3 saatten baslatan asil
// hataydi. Backend duzeltmesinden SONRA bile (bkz. yukarisi) bu fonksiyon bilincli olarak
// korunuyor - mobil tarafin, hangi backend/ORM ayrintisi degisirse degissin, "Z" olmayan
// bir string'i asla sessizce yerel saat sanmamasini garanti eden ikinci bir savunma
// katmani.
const HAS_TIMEZONE_DESIGNATOR = /(?:Z|[+-]\d{2}:?\d{2})$/;

export function parseUtcDate(isoString: string): Date {
  const normalized = HAS_TIMEZONE_DESIGNATOR.test(isoString) ? isoString : `${isoString}Z`;
  return new Date(normalized);
}
