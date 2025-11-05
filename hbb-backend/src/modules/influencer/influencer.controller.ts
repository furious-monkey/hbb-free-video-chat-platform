// modules/influencer/influencer.controller.ts - Updated with status breakdown
import { NextFunction, Request, Response, Router } from 'express';
import { logger } from '../../config/logger';
import { APIError } from '../../middleware/error/appError';
import { verifyJwt } from '../../middleware/verifyJwt';
import { PaginatedInfluencersDto } from './influencer.dto';
import * as influencerService from './influencer.service';
import { authWithTTL } from '../../middleware/authWithTTL';

// Fetch influencers with cursor-based pagination and filters
export const fetchInfluencers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const payload: PaginatedInfluencersDto = {
      ...req.query,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await influencerService.getPaginatedInfluencers(payload);
    
    // Calculate status breakdown for analytics
    const statusBreakdown = {
      live: result.influencers.filter(inf => inf.isLive).length,
      online: result.influencers.filter(inf => inf.isOnline && !inf.isLive).length,
      offline: result.influencers.filter(inf => !inf.isOnline).length,
      total: result.influencers.length,
    };

    res.status(200).json({
      ...result,
      statusBreakdown, // Optional: include status breakdown
      message: 'Influencers fetched successfully',
    });
  } catch (error) {
    logger.error(error);
    next(new APIError('Server Error', 'fetchInfluencers', 500, {}, true));
  }
};

// Fetch influencer by username
export const fetchInfluencerByUsername = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const username = req.params.username;

    const influencer = await influencerService.getInfluencerByUsername(username);

    if (!influencer) {
      return res.status(404).json({
        message: 'Influencer not found',
      });
    }

    res.status(200).json({
      influencer,
      message: 'Influencer fetched successfully',
    });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'fetchInfluencerByUsername', 500, {}, true));
  }
};


// Check if a username is available
export const checkUsernameAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const username = req.params.username;

    const isAvailable = await influencerService.isUsernameAvailable(username);

    res.status(200).json({
      username,
      isAvailable,
      message: isAvailable
        ? 'Username is available'
        : 'Username is already taken',
    });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'checkUsernameAvailability', 500, {}, true));
  }
};


// Set up API routes.
const router = Router();

router.get('/discover', authWithTTL, fetchInfluencers);
router.get('/discover/:username', authWithTTL, fetchInfluencerByUsername);
router.get('/discover/check-username/:username', authWithTTL, checkUsernameAvailability);

export default router;
