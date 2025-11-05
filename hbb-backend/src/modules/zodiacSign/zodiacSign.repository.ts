import { Prisma, PrismaClient, ZodiacSign } from '@prisma/client';
import { IProfile, IUser } from './zodiacSign.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';


const prisma = new PrismaClient();

export const findInterestByName = async (name: string) => {
  return await prisma.interest.findUnique({
    where: { name },
  });
};

export const createZodiacSign = async (name: string, image: string): Promise<ZodiacSign> => {
  const existingZodiacSign = await prisma.zodiacSign.findUnique({ where: { name } });
  if (existingZodiacSign) {
    throw new APIError('Conflict', 'Zodiac Sign already exists', 409);
  }

  return prisma.zodiacSign.create({
    data: {
      name,
      image,
      isDeleted: false,
    },
  });
};


export const getAllZodiacSigns = async (): Promise<ZodiacSign[]> => {
  return prisma.zodiacSign.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: 'desc' },
  });
};


export const updateZodiacSign = async (id: string, name: string, image: string): Promise<ZodiacSign> => {
  return prisma.zodiacSign.update({
    where: { id },
    data: { name, image, updatedAt: new Date() },
  });
};


export const deleteZodiacSign = async (id: string): Promise<ZodiacSign> => {
  return prisma.zodiacSign.update({
    where: { id },
    data: { isDeleted: true, updatedAt: new Date() },
  });
};
