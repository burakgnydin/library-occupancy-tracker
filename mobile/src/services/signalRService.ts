import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

import { resolveApiBaseUrl } from '../utils/apiBaseUrl';
import type { CheckInOutResult } from '../types/library';

const HUB_PATH = '/hubs/occupancy';
const OCCUPANCY_UPDATED_EVENT = 'OccupancyUpdated';

// Hub adresi de apiBaseUrl gibi Metro'nun bagli oldugu host'tan otomatik
// turetilir (bkz. utils/apiBaseUrl.ts) - backend hem REST API'yi hem Hub'i
// ayni Kestrel host'ta, sadece farkli path prefix'leriyle sunuyor.
function resolveHubUrl(): string {
  const apiBaseUrl = resolveApiBaseUrl();
  const origin = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${origin}${HUB_PATH}`;
}

// Uygulama boyunca paylasilan tek bir HubConnection - ekranlar arasi
// navigasyonda tekrar tekrar kurup kapatmak yerine baglantiyi acik tutup
// sadece grup uyeliklerini/dinleyicileri ekran yasam dongusune gore
// yonetiyoruz (bkz. LibraryListScreen/LibraryDetailScreen'deki useFocusEffect
// kullanimlari). Nesne modul yuklendiginde olusturulur (henuz baglanmaz) ki
// connect() hic cagrilmamis olsa bile .on()/.off() ile dinleyici
// eklenip/cikarilabilsin.
const connection: HubConnection = new HubConnectionBuilder()
  .withUrl(resolveHubUrl())
  .withAutomaticReconnect()
  .configureLogging(LogLevel.Warning)
  .build();

let startPromise: Promise<void> | null = null;

// Hangi kutuphane gruplarina "abone olunmasi gerektigini" servis seviyesinde
// tutar (ekranlarin kendi closure'larindan bagimsiz) - onreconnected'da bu
// kumedeki tum ID'ler icin JoinLibraryGroup yeniden cagrilir. withAutomaticReconnect
// bir reconnect sonrasinda sunucu tarafinda YENI bir ConnectionId olusturur, bu da
// eski baglantidaki tum grup uyeliklerini kaybettirir - bu kume olmadan, kisa bir
// aginin kesilmesi bile ekranlar fark etmeden canli guncellemelerin sessizce
// durmasina yol acardi.
const activeGroupIds = new Set<string>();

// withAutomaticReconnect'in kendi retry politikasi (varsayilan: 0/2/10/30 sn)
// tukenince baglanti kalici olarak Disconnected'a duser ve bir daha KENDILIGINDEN
// denemez. Bu handler olmadan startPromise sonsuza kadar eski (cozulmus) haliyle
// kalirdi - bir sonraki connect() cagrisi state'in Disconnected oldugunu gorse
// bile "zaten bir baslatma denemesi var" sanip gercek bir start() tetiklemezdi,
// yani baglanti oturum sonuna kadar sessizce olu kalirdi.
connection.onclose(() => {
  startPromise = null;
});

// Otomatik reconnect basarili olsa bile sunucu tarafinda YENI bir ConnectionId
// olusturulur - onceki gruplara katilim kaybolur. Burada, servis'in su ana kadar
// izledigi tum grup ID'lerini (activeGroupIds) yeniden katilarak ekranlarin hicbir
// ek islem yapmasina gerek kalmadan abonelikler geri saglanir.
connection.onreconnected(() => {
  activeGroupIds.forEach((libraryId) => {
    connection.invoke('JoinLibraryGroup', libraryId).catch((err) => {
      console.warn('[signalR] Yeniden bağlanma sonrası kütüphane grubuna katılınamadı:', err);
    });
  });
});

// Bu katman "nice to have" gercek zamanli bir ozellik - REST akisi buna hic
// bagimli degil, bu yuzden hicbir hata disariya firlatilmiyor (sessizce
// console.warn ile loglanip devam ediliyor, cagiran ekranlar hata banner'i
// gostermek zorunda kalmasin).
export async function connect(): Promise<void> {
  if (connection.state === HubConnectionState.Connected) return;

  if (!startPromise) {
    startPromise = connection.start().catch((err) => {
      startPromise = null;
      console.warn('[signalR] Bağlantı kurulamadı:', err);
    });
  }

  await startPromise;
}

export async function disconnect(): Promise<void> {
  startPromise = null;
  activeGroupIds.clear();
  try {
    await connection.stop();
  } catch (err) {
    console.warn('[signalR] Bağlantı kapatılırken hata oluştu:', err);
  }
}

export async function joinLibraryGroup(libraryId: string): Promise<void> {
  activeGroupIds.add(libraryId);
  await connect();
  if (connection.state !== HubConnectionState.Connected) return;
  try {
    await connection.invoke('JoinLibraryGroup', libraryId);
  } catch (err) {
    console.warn('[signalR] Kütüphane grubuna katılınamadı:', err);
  }
}

export async function leaveLibraryGroup(libraryId: string): Promise<void> {
  activeGroupIds.delete(libraryId);
  if (connection.state !== HubConnectionState.Connected) return;
  try {
    await connection.invoke('LeaveLibraryGroup', libraryId);
  } catch (err) {
    console.warn('[signalR] Kütüphane grubundan ayrılınamadı:', err);
  }
}

// Ayni event'e birden fazla ekran ayni anda dinleyici ekleyebilir
// (@microsoft/signalr'in on/off'u zaten coklu dinleyiciyi destekler) -
// dondurulen fonksiyon cagrildiginda SADECE bu dinleyiciyi kaldirir.
export function onOccupancyUpdated(callback: (update: CheckInOutResult) => void): () => void {
  connection.on(OCCUPANCY_UPDATED_EVENT, callback);
  return () => connection.off(OCCUPANCY_UPDATED_EVENT, callback);
}
