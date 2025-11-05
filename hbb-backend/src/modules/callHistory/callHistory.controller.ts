import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { assertHasUser } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';
import { CallHistoryService } from './callHistory.service';

const getCallHistoryCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(CallHistoryService); 
    const response = await serviceInstance.getCallHistoryByUserId(req.user.id);

    return res.json({
      success: true,
      message: 'Call history fetched successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const router = Router();

router.get('/', authWithTTL, getCallHistoryCtrl);

export default router;