export interface updateUserDto {
  userId: string;
  userDetails: any;
}

export interface DeleteAccountDto {
  userId: string;
}

export interface ChangePasswordDto {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export interface BlockUserDto {
  userId: string;
  blockedUserId: string;
}

export interface UnblockUserDto {
  userId: string;
  blockedUserId: string;
}

export interface UpdateNotificationSettingsDto {
  userId: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface AddCardDto {
  userId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  nameOnCard: string;
}

export interface UpdateCardDto {
  userId: string;
  cardId: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  nameOnCard?: string;
}

