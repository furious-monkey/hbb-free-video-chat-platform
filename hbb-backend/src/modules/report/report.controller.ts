// backend/src/modules/report/report.controller.ts
import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import ReportService from './report.service';
import { CreateReportDto } from './report.dto';
import { assertHasUser } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';

const createReportCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);
    const serviceInstance = Container.get(ReportService);
    const dto: CreateReportDto = req.body;
    const response = await serviceInstance.createReport({
      reporterId: req.user.id,
      reportedUserId: dto.reportedUserId,
      categories: dto.categories,
      description: dto.description,
    });

    return res.json({
      success: true,
      message: 'Report submitted successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// Set up API routes.
const router = Router();

router.post('/', authWithTTL, createReportCtrl);

export default router;