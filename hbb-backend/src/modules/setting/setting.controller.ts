import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import SettingService from './setting.service';
import { updateUserDto, DeleteAccountDto, ChangePasswordDto, BlockUserDto, UnblockUserDto, UpdateNotificationSettingsDto, AddCardDto, UpdateCardDto } from './setting.dto';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';


const updateUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.updateUser({ userId: req.user.id, userDetails: req.body } as updateUserDto);

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const deleteAccountCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.deleteAccount({ userId: req.user.id } as DeleteAccountDto);

    return res.json({
      success: true,
      message: 'Account marked as deleted successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const changePasswordCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.changePassword({ 
      userId: req.user.id, 
      currentPassword: req.body.currentPassword, 
      newPassword: req.body.newPassword 
    } as ChangePasswordDto);

    return res.json({
      success: true,
      message: 'Password changed successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const blockUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.blockUser({ userId: req.user.id, blockedUserId: req.body.blockedUserId } as BlockUserDto);

    return res.json({
      success: true,
      message: 'User blocked successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const unblockUserCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.unblockUser({ userId: req.user.id, blockedUserId: req.body.blockedUserId } as UnblockUserDto);

    return res.json({
      success: true,
      message: 'User unblocked successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const getBlockedUsersCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.getBlockedUsers(req.user.id);

    return res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const updateNotificationSettingsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.updateNotificationSettings({
      userId: req.user.id,
      emailNotifications: req.body.emailNotifications,
      pushNotifications: req.body.pushNotifications,
    } as UpdateNotificationSettingsDto);

    return res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const addCardCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.addCard({
      userId: req.user.id,
      cardNumber: req.body.cardNumber,
      expiryDate: req.body.expiryDate,
      cvv: req.body.cvv,
      nameOnCard: req.body.nameOnCard,
    } as AddCardDto);

    return res.json({
      success: true,
      message: 'Card added successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const updateCardCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.updateCard({
      userId: req.user.id,
      cardId: req.params.cardId,
      cardNumber: req.body.cardNumber,
      expiryDate: req.body.expiryDate,
      cvv: req.body.cvv,
      nameOnCard: req.body.nameOnCard,
    } as UpdateCardDto);

    return res.json({
      success: true,
      message: 'Card updated successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const getAllCardsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(SettingService);
    const response = await serviceInstance.getAllCards(req.user.id);

    return res.json({
      success: true,
      message: 'Cards fetched successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// Set up API routes.
const router = Router();

router.put('/update/:userId', authWithTTL, updateUserCtrl);
router.put('/delete', authWithTTL, deleteAccountCtrl);
router.put('/change-password', authWithTTL, changePasswordCtrl);
router.post('/block', authWithTTL, blockUserCtrl);
router.post('/unblock', authWithTTL, unblockUserCtrl);
router.get('/blocked-users', authWithTTL, getBlockedUsersCtrl);
router.put('/notification-settings', authWithTTL, updateNotificationSettingsCtrl);
router.post('/card', authWithTTL, addCardCtrl);
router.put('/card/:cardId', authWithTTL, updateCardCtrl);
router.get('/cards', authWithTTL, getAllCardsCtrl);



export default router;
