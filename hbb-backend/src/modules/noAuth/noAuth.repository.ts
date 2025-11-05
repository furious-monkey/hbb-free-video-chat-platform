import { Prisma, PrismaClient, ProfileView } from '@prisma/client';
import { IProfile, IUser } from './noAuth.interface';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';


const prisma = new PrismaClient();




