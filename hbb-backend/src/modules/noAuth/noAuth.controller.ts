import { Request, Response, Router, NextFunction } from 'express';
import * as profileService from './noAuth.service';
import { sendContactUsEmail } from './noAuth.service';
import { ContactUsDto } from './noAuth.dto';
import { APIError } from '../../middleware/error/appError';
import { logger } from '../../config/logger';
import { assertHasUser, verifyJwt, } from '../../middleware/verifyJwt';

//contact us
export const contactUsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contactData: ContactUsDto = req.body;

    await sendContactUsEmail(contactData);

    res.status(200).json({
      message: 'We have received your message. Our team will be in touch shortly',
    });
  } catch (err) {
    next(new APIError('Server Error', 'contactUsController', 500, {}, true));
  }
};


// Set up API routes.
const router = Router();

//contact-us
router.post('/contact-us', contactUsController);


export default router;
