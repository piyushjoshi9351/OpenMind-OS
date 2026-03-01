export type ISODateString = string;

export type UserRole = 'user' | 'admin';

export type EntityStatus = 'active' | 'archived' | 'deleted';

export interface PaginationCursor {
  createdAt: ISODateString;
  id: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: PaginationCursor | null;
}
