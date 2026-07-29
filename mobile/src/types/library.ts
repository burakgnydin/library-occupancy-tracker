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

export interface CheckInRequest {
  qrToken: string;
}

export interface CheckOutRequest {
  qrToken: string;
}

export type OccupancyLogType = 'CheckIn' | 'CheckOut';

export interface CheckInOutResult {
  libraryId: string;
  currentOccupancy: number;
  capacity: number;
  occupancyPercentage: number;
  occupancyStatus: OccupancyStatus;
  type: OccupancyLogType;
  timestamp: string;
}

export interface MyCheckInStatus {
  libraryId: string | null;
  libraryName: string | null;
  checkedInAt: string | null;
}
