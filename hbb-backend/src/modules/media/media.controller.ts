import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import multer from 'multer';
import MediaService from './media.service';
import { assertHasUser, verifyJwt } from '../../middleware/verifyJwt';

const upload = multer({ storage: multer.memoryStorage() });

const uploadImageCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const serviceInstance = Container.get(MediaService);
    const response = await serviceInstance.uploadFile(req.file, 'images', 'image', req.user.id);

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const uploadVideoCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertHasUser(req);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const serviceInstance = Container.get(MediaService);
    const response = await serviceInstance.uploadFile(req.file, 'videos', 'video', req.user.id);

    return res.json({
      success: true,
      message: 'Video uploaded successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// API routes.
const router = Router();

router.post('/image', verifyJwt, upload.single('file'), uploadImageCtrl);
router.post('/video', verifyJwt, upload.single('file'), uploadVideoCtrl);

export default router;
