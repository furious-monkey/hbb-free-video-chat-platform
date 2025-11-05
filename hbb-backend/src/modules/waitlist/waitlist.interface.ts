export interface IWaitlistEntry {
  id: string;
  name: string;
  email: string;
  location: string;
  ageConfirmed: boolean;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateWaitlistDto {
  name: string;
  email: string;
  location: string;
  ageConfirmation: boolean;
}

export interface IWaitlistService {
  createWaitlistEntry(data: ICreateWaitlistDto): Promise<IWaitlistEntry>;
  getWaitlistEntryByEmail(email: string): Promise<IWaitlistEntry | null>;
  getAllWaitlistEntries(): Promise<IWaitlistEntry[]>;
}
