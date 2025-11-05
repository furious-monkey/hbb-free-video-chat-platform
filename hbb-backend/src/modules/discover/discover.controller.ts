import { Request, Response, Router, NextFunction } from 'express';
import * as influencerService from './discover.service';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';

export const discoverInfluencers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const userId = req.user.id;

    const influencer = await influencerService.discoverInfluencers(userId);

    if (!influencer) {
      return res.status(404).json({
        message: 'No influencer found',
      });
    }

    res.status(200).json({
      influencer,
      message: 'Influencer fetched successfully',
    });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'fetchSingleRandomInfluencer', 500, {}, true));
  }
};



export const likeInfluencerHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const userId = req.user.id;
    const influencerId = req.body.influencerId;

    if (!influencerId) {
      return res.status(400).json({
        message: 'Influencer ID must be provided',
      });
    }

    const updatedProfile = await influencerService.likeInfluencer(userId, influencerId);

    if (!updatedProfile) {
      return res.status(400).json({
        message: 'You have already liked this influencer',
      });
    }

    res.status(200).json({
      profile: updatedProfile,
      message: 'Influencer liked successfully',
    });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'likeInfluencerHandler', 500, {}, true));
  }
};



// Set up API routes.
const router = Router();

router.get('/', authWithTTL, discoverInfluencers);
router.post('/like', authWithTTL, likeInfluencerHandler);


export default router;