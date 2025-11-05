import { IProfile, IUser } from './admin.interface';
import { FAQ, UserGuide } from '@prisma/client';
import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import { CreateFAQDto, CreateUserGuideDto, CreateCategoryDto, UpdateCategoryDto } from './admin.dto';
import * as adminRepository from './admin.repository';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';

const prisma = new PrismaClient();

//faq
export const createFAQ = async (data: CreateFAQDto): Promise<FAQ> => {
  return prisma.fAQ.create({
    data,
  });
};

export const getFAQs = async (): Promise<FAQ[]> => {
  return prisma.fAQ.findMany();
};

export const getPublishedFAQs = async (): Promise<FAQ[]> => {
  return prisma.fAQ.findMany({
    where: { published: true },
  });
};


export const updateFAQ = async (id: string, data: Partial<CreateFAQDto>): Promise<FAQ | null> => {
  return prisma.fAQ.update({
    where: { id },
    data,
  });
};

export const deleteFAQ = async (id: string): Promise<FAQ | null> => {
  return prisma.fAQ.delete({
    where: { id },
  });
};


//User guide
export const createUserGuide = async (data: CreateUserGuideDto): Promise<UserGuide> => {
  return prisma.userGuide.create({
    data,
  });
};

export const getUserGuides = async (): Promise<UserGuide[]> => {
  return prisma.userGuide.findMany();
};

export const getPublishedUserGuides = async (): Promise<UserGuide[]> => {
  return prisma.userGuide.findMany({
    where: { published: true },
  });
};


export const updateUserGuide = async (id: string, data: Partial<CreateUserGuideDto>): Promise<UserGuide | null> => {
  return prisma.userGuide.update({
    where: { id },
    data,
  });
};

export const deleteUserGuide = async (id: string): Promise<UserGuide | null> => {
  return prisma.userGuide.delete({
    where: { id },
  });
};

//categories
export const createCategoryService = async (categoryData: CreateCategoryDto) => {
  try {
    const newCategory = await adminRepository.createCategory(categoryData);
    return newCategory;
  } catch (error) {
    throw new APIError('Failed to create category', 'createCategoryService', 500);
  }
};

export const updateCategoryService = async (id: string, data: UpdateCategoryDto) => {
  try {
    const updatedCategory = await adminRepository.updateCategory(id, data);
    return updatedCategory;
  } catch (error) {
    throw new APIError('Failed to update category', 'updateCategoryService', 500);
  }
};

// Delete Category Service
export const deleteCategoryService = async (id: string) => {
  try {
    await adminRepository.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  } catch (error) {
    throw new APIError('Failed to delete category', 'deleteCategoryService', 500);
  }
};