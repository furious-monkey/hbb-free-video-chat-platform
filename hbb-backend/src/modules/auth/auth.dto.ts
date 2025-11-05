// backend/src/modules/auth/auth.dto.ts
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  userRole: 'INFLUENCER' | 'EXPLORER' | 'ADMIN' | 'AGENCY';
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  referralCode?: string;
  dateOfBirth?: Date;
  phone?: string;  
  profileImage?: string;
}

export interface VerifyEmailDto {
  otp: string;
}

export interface ResendOtpDto {
  email: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  userId: string;
  password: string;
}


export interface logoutDto {
  userId: string;
}

