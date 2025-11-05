import { Request, Response, Router, NextFunction } from 'express';
import * as profileService from './profile.service';
import { getUserProfileViews, getAllCategories } from './profile.service';
import { CreateProfileDto, } from './profile.dto';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';

export const createOrUpdateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const profileData: CreateProfileDto = req.body;
    const userId = req.user.id;

    const profile = await profileService.createOrUpdateProfile(userId, profileData);

    logger.info(`User ${userId} updated their profile`);

    res.status(200).json({
      profile,
      message: 'User profile updated',
    });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'createOrUpdateProfile', 500, {}, true));
  }
};

export const getProfileByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const userId = req.user.id;
    logger.info(`Fetching profile for user ID: ${userId} ========================`);

    const profile = await profileService.getProfileByUserId(userId);

    if (!profile) {
      logger.warn(`Profile not found for user ID: ${userId}`);
      res.status(200).json({ success: true, profile: null, message: 'User profile incomplete' });
      return;
    }

    logger.info(`User ${userId} fetched their profile details`);

    res.status(200).json({ success: true, profile, message: 'User details retrieved' });
  } catch (err) {
    logger.error(`Error fetching profile for user ID: $`, err);
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'getProfileByUserId', 500, {}, true));
    }
  }
};


export const viewUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const viewerId = req.user.id; 
    const userId = req.params.userId; 

    logger.info(`Controller: User ${viewerId} is requesting to view profile for user ${userId}`);
    
    const profile = await profileService.viewUserProfile(viewerId, userId);

    logger.info(`User ${viewerId} viewed profile for user ${userId}`);

    res.status(200).json({
      success: true,
      profile,
      message: 'Profile details retrieved',
    });
  } catch (err) {
    logger.error('Error in viewUserProfile controller:', err);
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'viewUserProfile', 500, {}, true));
    }
  }
};

export const getUserProfileViewsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const userId = req.user.id;

    logger.info(`Controller: Fetching profile views for user ${userId}`);

    const profileViews = await getUserProfileViews(userId);

    res.status(200).json({
      success: true,
      profileViews,
      message: 'Profile views retrieved successfully',
    });
  } catch (err) {
    logger.error('Error in getUserProfileViewsController:', err);
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'getUserProfileViewsController', 500, {}, true));
    }
  }
};

//category
export const fetchAllCategoriesCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getAllCategories();
    return res.json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Set up API routes.
const router = Router();

router.post('/', authWithTTL, createOrUpdateProfile);
router.get('/', authWithTTL, getProfileByUserId);
router.get('/view/:userId', authWithTTL, viewUserProfile);
router.get('/profile-views', authWithTTL, getUserProfileViewsController);
router.get('/categories', fetchAllCategoriesCtrl);




export default router;
