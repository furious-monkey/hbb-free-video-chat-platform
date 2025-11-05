import { Request, Response, Router, NextFunction } from 'express';
import * as likeService from './like.service';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';


export const likeProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const userId = req.user.id;
    const profileId = req.params.profileId;

    const message = await likeService.likeProfile(userId, profileId);

    logger.info(`User ${userId} tried to like profile ${profileId}: ${message}`);

    res.json({ message });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'likeProfile', 500, {}, true));
  }
};

export const unlikeProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const userId = req.user.id;
    const profileId = req.params.profileId;

    const message = await likeService.unlikeProfile(userId, profileId);

    logger.info(`User ${userId} tried to unlike profile ${profileId}: ${message}`);

    res.json({ message });
  } catch (err) {
    logger.error(err);
    next(new APIError('Server Error', 'unlikeProfile', 500, {}, true));
  }
};


export const explorerLikes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const userId = req.user.id;

    const { likedProfiles, pagination } = await likeService.explorerLikes(userId, page, pageSize);

    res.status(200).json({
      success: true,
      likedProfiles,
      pagination,
      message: 'Liked profiles retrieved successfully',
    });
  } catch (err) {
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'getLikedProfilesByUserId', 500, {}, true));
    }
  }
};

export const influencerLikes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const userId = req.user.id;

    const { usersWhoLikedProfile, pagination } = await likeService.influencerLikes(userId, page, pageSize);

    res.status(200).json({
      success: true,
      usersWhoLikedProfile,
      pagination,
      message: 'Users who liked your profile retrieved successfully',
    });
  } catch (err) {
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'getUsersWhoLikedProfile', 500, {}, true));
    }
  }
};




// Set up API routes.
const router = Router();

router.post('/:profileId', authWithTTL, likeProfile);
router.delete('/:profileId', authWithTTL, unlikeProfile);
router.get('/explorers', authWithTTL, explorerLikes);
router.get('/influencers', authWithTTL, influencerLikes); 

export default router;
