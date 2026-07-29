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

// CreateLibraryDto/UpdateLibraryDto ile birebir (backend ikisi icin de ayni
// alanlari bekliyor) - Capacity>=1 ve Name/Address/City/District zorunlu
// kontrolleri backend'de yapiliyor, burada tekrar edilmiyor.
export interface LibraryFormRequest {
  name: string;
  address: string;
  city: string;
  district: string;
  capacity: number;
}
