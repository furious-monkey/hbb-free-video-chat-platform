import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import { IProfile, IUser } from './admin.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { CreateCategoryDto, UpdateCategoryDto } from './admin.dto';

const prisma = new PrismaClient();

export const createCategory = async (data: CreateCategoryDto) => {
  return prisma.category.create({
    data,
  });
};

export const updateCategory = async (id: string, data: UpdateCategoryDto) => {
  return prisma.category.update({
    where: { id },
    data,
  });
};

export const deleteCategory = async (id: string) => {
  return prisma.category.delete({
    where: { id },
  });
};
