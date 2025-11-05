import { Prisma, PrismaClient, Interest } from '@prisma/client';
import * as zodiacSignRepository from './zodiacSign.repository';
import { APIError } from '../../middleware/error/appError';

const prisma = new PrismaClient();


export const createZodiacSignService = async (name: string, image: string) => {
  try {
    const newZodiacSign = await zodiacSignRepository.createZodiacSign(name, image);
    return newZodiacSign;
  } catch (error) {
    if (error instanceof APIError && error.statusCode === 409) {
      throw error;
    }
    throw new APIError('Server Error', 'Unable to create zodiac sign', 500);
  }
};


export const fetchAllZodiacSignsService = async () => {
  return zodiacSignRepository.getAllZodiacSigns();
};


export const updateZodiacSignService = async (id: string, name: string, image: string) => {
  const updatedZodiacSign = await zodiacSignRepository.updateZodiacSign(id, name, image);
  return updatedZodiacSign;
};


export const deleteZodiacSignService = async (id: string) => {
  const deletedZodiacSign = await zodiacSignRepository.deleteZodiacSign(id);
  return deletedZodiacSign;
};
