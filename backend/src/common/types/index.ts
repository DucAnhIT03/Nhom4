export type Identifier = string | number;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
