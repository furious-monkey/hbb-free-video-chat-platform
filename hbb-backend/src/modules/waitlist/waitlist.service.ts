import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { IWaitlistEntry, ICreateWaitlistDto, IWaitlistService } from './waitlist.interface';

@Service()
export class WaitlistService implements IWaitlistService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  private generateReferralCode(): string {
    // Generate a unique 8-character referral code
    return 'HBB' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  async createWaitlistEntry(data: ICreateWaitlistDto): Promise<IWaitlistEntry> {
    try {
      // Check if email already exists in waitlist
      const existingEntry = await this.prisma.waitlist.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingEntry) {
        throw new Error('Email already registered in waitlist');
      }

      // Create new waitlist entry with referral code
      const referralCode = this.generateReferralCode();
      
      const entry = await this.prisma.waitlist.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          location: data.location,
          ageConfirmed: data.ageConfirmation,
          referralCode: referralCode,
        }
      });

      // TODO: Send welcome email with referral code and add mailchimp integration
      

      return {
        ...entry,
        referralCode: entry.referralCode ?? '',
      };
    } catch (error) {
      console.error('Error creating waitlist entry:', error);
      throw error;
    }
  }

  async getWaitlistEntryByEmail(email: string): Promise<IWaitlistEntry | null> {
    try {
      const entry = await this.prisma.waitlist.findUnique({
        where: { email: email.toLowerCase() }
      });
      return entry
        ? { ...entry, referralCode: entry.referralCode ?? undefined }
        : null;
    } catch (error) {
      console.error('Error fetching waitlist entry:', error);
      throw error;
    }
  }

  async getAllWaitlistEntries(): Promise<IWaitlistEntry[]> {
    try {
      const entries = await this.prisma.waitlist.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return entries.map(entry => ({
        ...entry,
        referralCode: entry.referralCode ?? undefined,
      }));
    } catch (error) {
      console.error('Error fetching all waitlist entries:', error);
      throw error;
    }
  }

  // Optional: Send welcome email (integrate with your email service)
  private async sendWelcomeEmail(email: string, name: string, referralCode: string): Promise<void> {
    // Implement email sending logic here
    console.log(`Welcome email would be sent to ${email} with referral code: ${referralCode}`);
  }
}