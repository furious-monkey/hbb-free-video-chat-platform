export interface CreateProfileDto {
  username?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  zodiacSign?: string;
  callRate?: string;
  dateOfBirth?: string; 
  age?: number; 
}

export interface UpdateProfileDto {
  username?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  zodiacSign?: string;
  callRate?: string;
  dateOfBirth?: string; 
  age?: number; 
}