import apiClient from './apiClient';
import type { Library, LibraryFormRequest, LibraryQueryParams, PagedResult } from '../types/library';

export async function getLibraries(params: LibraryQueryParams): Promise<PagedResult<Library>> {
  const { data } = await apiClient.get<PagedResult<Library>>('/libraries', { params });
  return data;
}

export async function createLibrary(payload: LibraryFormRequest): Promise<Library> {
  const { data } = await apiClient.post<Library>('/libraries', payload);
  return data;
}

export async function updateLibrary(id: string, payload: LibraryFormRequest): Promise<Library> {
  const { data } = await apiClient.put<Library>(`/libraries/${id}`, payload);
  return data;
}

export async function deleteLibrary(id: string): Promise<void> {
  await apiClient.delete(`/libraries/${id}`);
}

// Backend'de bu endpoint anonim (Authorize yok) - bu yuzden dogrudan bir
// <img src> olarak kullanilabilir, ayrica bir apiClient istegi/blob donusumu
// gerekmiyor (tarayici URL'i kendisi ceker).
export function getQrCodeUrl(id: string): string {
  return `${apiClient.defaults.baseURL}/libraries/${id}/qrcode`;
}
