export interface Versioned<T> {
  entity: T;
  version: number;
}

export interface PageRequest {
  page: number;
}
