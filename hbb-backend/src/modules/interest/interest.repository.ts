import { Prisma, PrismaClient, Interest } from '@prisma/client';
import { IProfile, IUser } from './interest.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';


const prisma = new PrismaClient();

export const findInterestByName = async (name: string) => {
  return await prisma.interest.findUnique({
    where: { name },
  });
};

export const createInterest = async (data: { name: string; image: string; isDeleted: boolean }) => {
  return await prisma.interest.create({
    data,
  });
};

export const fetchInterests = async (): Promise<Interest[]> => {
  return prisma.interest.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const updateInterest = async (id: string, data: { name?: string; image?: string; isDeleted?: boolean }) => {
  return await prisma.interest.update({
    where: { id },
    data,
  });
};

export const deleteInterest = async (id: string): Promise<Interest | null> => {
  return prisma.interest.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });
};