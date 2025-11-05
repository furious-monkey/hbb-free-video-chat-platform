import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Service()
export default class AuthRepository {
  async findByEmail(email: string): Promise<any> {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: any): Promise<any> {
    return prisma.user.create({ data });
  }

  async findByOtp(otp: string): Promise<any> {
    return prisma.user.findFirst({ where: { otp } });
  }
}
