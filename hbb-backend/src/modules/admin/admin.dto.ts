export interface CreateFAQDto {
  question: string;
  answer: string;
  published?: boolean;
}

export interface CreateUserGuideDto {
  issue: string;
  fix: string;
  published?: boolean;
}

export interface CreateCategoryDto {
  name: string;
  imageUrl?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  imageUrl?: string;
}
