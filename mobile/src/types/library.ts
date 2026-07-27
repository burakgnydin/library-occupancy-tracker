export type OccupancyStatus = 'Low' | 'Medium' | 'High';

export interface Library {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  capacity: number;
  currentOccupancy: number;
  occupancyPercentage: number;
  occupancyStatus: OccupancyStatus;
  qrCodeToken: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface LibraryQueryParams {
  search?: string;
  city?: string;
  district?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'name' | 'occupancy';
  sortDescending?: boolean;
}
