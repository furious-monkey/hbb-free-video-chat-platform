// earnings.controller.ts
import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { assertHasUser } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';
import { EarningsService } from './earnings.service';

const getEarningsSummaryCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(EarningsService);
    const summary = await serviceInstance.getEarningsSummary(req.user.id);

    return res.json({
      success: true,
      message: 'Earnings summary fetched successfully',
      data: summary
    });
  } catch (err) {
    next(err);
  }
};

const getDetailedEarningsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(EarningsService);
    
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      type: req.query.type as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const earnings = await serviceInstance.getDetailedEarnings(req.user.id, filters);

    return res.json({
      success: true,
      message: 'Detailed earnings fetched successfully',
      data: earnings
    });
  } catch (err) {
    next(err);
  }
};

const router = Router();

router.get('/summary', authWithTTL, getEarningsSummaryCtrl);
router.get('/detailed', authWithTTL, getDetailedEarningsCtrl);

export default router;