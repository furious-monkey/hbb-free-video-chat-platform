import { Request, Response, Router, NextFunction } from 'express';
import * as zodiacSignService from './zodiacSign.service';
import { APIError } from '../../middleware/error/appError';
import {  verifyJwt, } from '../../middleware/verifyJwt';

export const createZodiacSignController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, image } = req.body;
    const newZodiacSign = await zodiacSignService.createZodiacSignService(name, image);
    res.status(201).json({ success: true, data: newZodiacSign, message: 'Zodiac Sign created successfully' });
  } catch (error) {
    if (error instanceof APIError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      next(new APIError('Server Error', 'Unable to create zodiac sign', 500, {}, true));
    }
  }
};


export const getAllZodiacSignsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const zodiacSigns = await zodiacSignService.fetchAllZodiacSignsService();
    res.status(200).json({ success: true, data: zodiacSigns, message: 'Zodiac Signs fetched successfully' });
  } catch (error) {
    next(new APIError('Server Error', 'Unable to fetch zodiac signs', 500, {}, true));
  }
};

export const updateZodiacSignController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, image } = req.body;
    const updatedZodiacSign = await zodiacSignService.updateZodiacSignService(id, name, image);
    res.status(200).json({ success: true, data: updatedZodiacSign, message: 'Zodiac Sign updated successfully' });
  } catch (error) {
    next(new APIError('Server Error', 'Unable to update zodiac sign', 500, {}, true));
  }
};


export const deleteZodiacSignController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedZodiacSign = await zodiacSignService.deleteZodiacSignService(id);
    res.status(200).json({ success: true, data: deletedZodiacSign, message: 'Zodiac Sign deleted successfully' });
  } catch (error) {
    next(new APIError('Server Error', 'Unable to delete zodiac sign', 500, {}, true));
  }
};

// Set up API routes.
const router = Router();

router.post('/',verifyJwt, createZodiacSignController);
router.get('/',verifyJwt, getAllZodiacSignsController);
router.put('/:id',verifyJwt, updateZodiacSignController);
router.delete('/:id',verifyJwt, deleteZodiacSignController);




export default router;
