import { IProfile, IUser } from './interest.interface';
import { Prisma, PrismaClient, Interest } from '@prisma/client';
import * as interestRepository from './interest.repository';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { fetchProfileImage, fetchPromotionalVideos } from '../../utils/media.utils';

const prisma = new PrismaClient();


export const createInterest = async (name: string, image: string) => {
  const existingInterest = await interestRepository.findInterestByName(name);

  if (existingInterest) {
    throw new APIError('Interest already exists', 'createInterest', 400);
  }

  const newInterest = await interestRepository.createInterest({ name, image, isDeleted: false });

  return {
    success: true,
    message: 'Interest created successfully',
    interest: newInterest,
  };
};

export const fetchInterests = async () => {
  return interestRepository.fetchInterests();
};

export const updateInterest = async (id: string, data: { name?: string; image?: string }) => {
  const updatedInterest = await interestRepository.updateInterest(id, data);

  return {
    success: true,
    message: 'Interest updated successfully',
    interest: updatedInterest,
  };
};

export const deleteInterest = async (id: string) => {
  return interestRepository.deleteInterest(id);
};