import apiClient from './apiClient';
import type { Library, LibraryQueryParams, PagedResult } from '../types/library';

export async function getLibraries(params: LibraryQueryParams): Promise<PagedResult<Library>> {
  const { data } = await apiClient.get<PagedResult<Library>>('/libraries', { params });
  return data;
}
