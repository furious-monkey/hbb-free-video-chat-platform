// modules/user/user.controller.ts - User controller for handling user details, referral code, discovery, blocking, unblocking, and profile completion
import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import UserService from './user.service';
import { getUserDetailsDto, fetchUsersByReferralCodeDto, deleteUserDto, discoverUsersDto, discoverInfluencersDto, blockUserDto, unblockUserDto, getUserByReferralCodeDto, CompleteUserProfileDto } from './user.dto';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';
import { logger } from '../../config/logger';
import { authWithTTL } from '../../middleware/authWithTTL';

const getUserDetailsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.getUserDetails({ userId: req.user.id } as getUserDetailsDto);

    return res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const fetchUsersByReferralCodeCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.fetchUsersByReferralCode({ ownedReferralCode: req.user.ownedReferralCode } as fetchUsersByReferralCodeDto);

    return res.json({
      success: true,
      message: response.message,
      alert: response.alert,
      data: response.usersWithMatchingReferralCode,
    });
  } catch (err) {
    next(err);
  }
};

const discoverUsersCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.discoverUsers({ page: parseInt(req.query.page as string) || 1, limit: parseInt(req.query.limit as string) || 10 } as discoverUsersDto);

    return res.json({
      success: true,
      message: 'Users discovered successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};


const blockUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.blockUser({ userId: req.user.id, blockedUserId: req.params.userId } as blockUserDto);

    return res.json({
      success: true,
      message: response.message,
    });
  } catch (err) {
    next(err);
  }
};

const unblockUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.unblockUser({ userId: req.user.id, blockedUserId: req.params.userId } as unblockUserDto);

    return res.json({
      success: true,
      message: response.message,
    });
  } catch (err) {
    next(err);
  }
};

const fetchBlockedUsersCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(UserService);
    const userId = req.user.id;
    const blockedUsers = await serviceInstance.getBlockedUsers(userId);

    res.status(200).json({
      success: true,
      blockedUsers,
      message: 'Blocked users fetched successfully',
    });
  } catch (err) {
    logger.error(err);
    next(err);
  }
};

const getUserByReferralCodeCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.getUserByReferralCode({ referralCode: req.params.referralCode } as getUserByReferralCodeDto);

    return res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const completeUserProfileCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const userId = req.user.id;
    const { userName, country, promotionalVideo, profileImage, categories } = req.body;

    if (categories && (!Array.isArray(categories) || categories.length > 3)) {
      return res.status(400).json({
        success: false,
        message: 'You can only select a maximum of 3 categories',
      });
    }

    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.completeUserProfile({
      userId,
      userName,
      country,
      promotionalVideo,
      profileImage,
      categories,
    });

    return res.json({
      success: true,
      message: 'Profile completed successfully',
      data: {
        ...response,
        profileCreated: response.profileId !== undefined,
      },
    });
  } catch (err) {
    next(err);
  }
};




const updateProfileImageCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const userId = req.user.id;

    const { profileImage } = req.body;
    console.log(req.body, "req.body", userId, profileImage);

    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.updateProfileImage(userId, profileImage);

    return res.json({
      success: true,
      message: response.message,
      data: {
        userId: response.userId,
        profileImage: response.profileImage,
      },
    });
  } catch (err) {
    next(err);
  }

};

const updatePromotionalVideosCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const userId = req.user.id;
    const { promotionalVideos } = req.body;

    const serviceInstance = Container.get(UserService);
    const response = await serviceInstance.updatePromotionalVideos(userId, promotionalVideos);

    return res.json({
      success: true,
      message: response.message,
      data: {
        userId: response.userId,
        promotionalVideos: response.promotionalVideos,
      },
    });
  } catch (err) {
    next(err);
  }
};


// API routes.
const router = Router();

router.get('/user-details', authWithTTL, getUserDetailsCtrl);
router.get('/agency-users', authWithTTL, fetchUsersByReferralCodeCtrl);
router.get('/discover', discoverUsersCtrl);
router.post('/block/:userId', authWithTTL, blockUserCtrl);
router.post('/unblock/:userId', authWithTTL, unblockUserCtrl);
router.get('/blocked-users', authWithTTL, fetchBlockedUsersCtrl);
router.get('/user-by-referral-code/:referralCode', getUserByReferralCodeCtrl);
router.post('/complete-profile', authWithTTL, completeUserProfileCtrl);
router.post('/update-profile-image', authWithTTL, updateProfileImageCtrl);
router.post('/update-promotional-videos', authWithTTL, updatePromotionalVideosCtrl); 



export default router;
