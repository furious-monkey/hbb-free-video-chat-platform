import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { WaitlistService } from './waitlist.service';

const validateWaitlistData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('Please provide a valid email address');
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.push('Location must be at least 2 characters');
  }

  if (data.ageConfirmation !== true) {
    errors.push('You must confirm that you are 18 or older');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const createWaitlistEntryCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request data
    const validation = validateWaitlistData(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    const serviceInstance = Container.get(WaitlistService);
    const response = await serviceInstance.createWaitlistEntry(req.body);

    return res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: {
        id: response.id,
        name: response.name,
        email: response.email,
        referralCode: response.referralCode
      }
    });
  } catch (err: any) {
    // Handle duplicate email error
    if (err.message === 'Email already registered in waitlist') {
      return res.status(409).json({
        success: false,
        message: 'This email is already on the waitlist'
      });
    }
    next(err);
  }
};

const checkWaitlistStatusCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    const serviceInstance = Container.get(WaitlistService);
    const entry = await serviceInstance.getWaitlistEntryByEmail(email);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Email not found in waitlist'
      });
    }

    return res.json({
      success: true,
      data: {
        isRegistered: true,
        referralCode: entry.referralCode,
        joinedAt: entry.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

const router = Router();

router.post('/join', createWaitlistEntryCtrl);
router.get('/status/:email', checkWaitlistStatusCtrl);

export default router;