import { Request, Response, Router, NextFunction } from 'express';
import * as profileService from './admin.service';
import {createFAQ, getFAQs,getPublishedFAQs, updateFAQ, deleteFAQ, createUserGuide, getUserGuides, getPublishedUserGuides, updateUserGuide, deleteUserGuide, createCategoryService,updateCategoryService, deleteCategoryService } from './admin.service';
import { CreateFAQDto, CreateUserGuideDto, CreateCategoryDto,UpdateCategoryDto } from './admin.dto';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, adminMiddleware } from '../../middleware/verifyJwt';

//FAQs
export const createFAQController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqData: CreateFAQDto = req.body;

    const faq = await createFAQ(faqData);

    res.status(201).json({
      faq,
      message: 'FAQ created successfully',
    });
  } catch (err) {
    next(new APIError('Server Error', 'createFAQController', 500, {}, true));
  }
};

export const getFAQsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = await getFAQs();

    res.status(200).json({
      faqs,
    });
  } catch (err) {
    next(new APIError('Server Error', 'getFAQsController', 500, {}, true));
  }
};

export const getPublishedFAQsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const faqs = await getPublishedFAQs();

    res.status(200).json({
      faqs,
    });
  } catch (err) {
    next(new APIError('Server Error', 'getPublishedFAQsController', 500, {}, true));
  }
};


export const updateFAQController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const faqData: Partial<CreateFAQDto> = req.body;

    const updatedFAQ = await updateFAQ(id, faqData);

    if (!updatedFAQ) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.status(200).json({
      updatedFAQ,
      message: 'FAQ updated successfully',
    });
  } catch (err) {
    next(new APIError('Server Error', 'updateFAQController', 500, {}, true));
  }
};

export const deleteFAQController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deletedFAQ = await deleteFAQ(id);

    if (!deletedFAQ) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    res.status(200).json({
      deletedFAQ,
      message: 'FAQ deleted successfully',
    });
  } catch (err) {
    next(new APIError('Server Error', 'deleteFAQController', 500, {}, true));
  }
};

//User Guide
export const createUserGuideController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guideData: CreateUserGuideDto = req.body;

    const guide = await createUserGuide(guideData);

    res.status(201).json({
      guide,
      message: 'User Guide created successfully',
    });
  } catch (err) {
    next(new APIError('Server Error', 'createUserGuideController', 500, {}, true));
  }
};

export const getUserGuidesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guides = await getUserGuides();

    res.status(200).json({
      guides,
    });
  } catch (err) {
    next(new APIError('Server Error', 'getUserGuidesController', 500, {}, true));
  }
};

export const getPublishedUserGuideController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const guides = await getPublishedUserGuides();

    res.status(200).json({
      guides,
    });
  } catch (err) {
    next(new APIError('Server Error', 'getPublishedUserGuideController', 500, {}, true));
  }
};

export const updateUserGuideController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const guideData: Partial<CreateUserGuideDto> = req.body;

    const updatedGuide = await updateUserGuide(id, guideData);

    if (!updatedGuide) {
      return res.status(404).json({ message: 'User Guide not found' });
    }

    res.status(200).json({
      updatedGuide,
      message: 'User Guide updated successfully',
    });
  } catch (err) {
    next(new APIError('Server Error', 'updateUserGuideController', 500, {}, true));
  }
};

export const deleteUserGuideController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deletedGuide = await deleteUserGuide(id);

    if (!deletedGuide) {
      return res.status(404).json({ message: 'User Guide not found' });
    }

    res.status(200).json({
      deletedGuide,
      message: 'User Guide deleted successfully',
    });
  } catch (err) {
    next(new APIError('Server Error', 'deleteUserGuideController', 500, {}, true));
  }
};

//category
export const createCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoryData: CreateCategoryDto = req.body;

    logger.info(`Controller: Creating a new category with name: ${categoryData.name}`);

    const newCategory = await createCategoryService(categoryData);

    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully',
    });
  } catch (err) {
    logger.error('Error in createCategoryController:', err);
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'createCategoryController', 500));
    }
  }
};

export const updateCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const categoryData: UpdateCategoryDto = req.body;

    logger.info(`Controller: Updating category with id: ${id}`);

    const updatedCategory = await updateCategoryService(id, categoryData);

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: 'Category updated successfully',
    });
  } catch (err) {
    logger.error('Error in updateCategoryController:', err);
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'updateCategoryController', 500));
    }
  }
};

export const deleteCategoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    logger.info(`Controller: Deleting category with id: ${id}`);

    await deleteCategoryService(id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (err) {
    logger.error('Error in deleteCategoryController:', err);
    if (err instanceof APIError) {
      res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
      next(new APIError('Server Error', 'deleteCategoryController', 500));
    }
  }
};


// Set up API routes.
const router = Router();

//faq
router.post('/faq', createFAQController);
router.get('/faq', getFAQsController);
router.get('/faqs/published', getPublishedFAQsController);
router.put('/faq/:id', updateFAQController);
router.delete('/faq/:id', deleteFAQController);

//user-guide
router.post('/user-guide', createUserGuideController);
router.get('/user-guide', getUserGuidesController);
router.get('/user-guide/published', getPublishedUserGuideController);
router.put('/user-guide/:id', updateUserGuideController);
router.delete('/user-guide/:id', deleteUserGuideController);

//category
router.post('/category',verifyJwt, adminMiddleware, createCategoryController);
router.put('/category/:id', updateCategoryController);
router.delete('/category/:id', deleteCategoryController);



export default router;
