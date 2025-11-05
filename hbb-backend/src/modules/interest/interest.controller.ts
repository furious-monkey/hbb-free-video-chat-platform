import { Request, Response, Router, NextFunction } from 'express';
import * as interestService from './interest.service';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';
import { authWithTTL } from '../../middleware/authWithTTL';

export const createInterest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, image } = req.body;

    const result = await interestService.createInterest(name, image);

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'createInterest', 500, {}, true));
    }
  }
};

export const fetchInterests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const interests = await interestService.fetchInterests();
    res.status(200).json({ success: true, interests });
  } catch (error) {
    next(error);
  }
};

export const updateInterest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await interestService.updateInterest(id, data);

    res.status(200).json(result);
  } catch (err) {
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'updateInterest', 500, {}, true));
    }
  }
};

export const deleteInterest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const interest = await interestService.deleteInterest(id);
    if (interest) {
      res.status(200).json({ success: true, message: 'Interest deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Interest not found' });
    }
  } catch (error) {
    next(error);
  }
};
// Set up API routes.
const router = Router();

router.post('/',authWithTTL, createInterest);
router.get('/',authWithTTL, fetchInterests);
router.put('/:id',authWithTTL, updateInterest);
router.delete('/:id',authWithTTL, deleteInterest);




export default router;
