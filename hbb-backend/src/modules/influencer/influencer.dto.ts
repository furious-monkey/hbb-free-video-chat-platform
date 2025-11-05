export interface PaginatedInfluencersDto {
  cursor?: string;
  categories?: string | string[];
  search_term?: string;
  is_user_online?: boolean;
  limit?: number;
}
