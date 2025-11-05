// backend/src/modules/auth/auth.controller.ts
import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import AuthService from './auth.service';
import {
  LoginDto, RegisterDto, VerifyEmailDto, ResendOtpDto,
  RefreshTokenDto, logoutDto, ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.dto';

// Helper function to set auth cookies
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string, userRole?: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Set access token cookie (shorter expiration)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  });

  // Set refresh token cookie (longer expiration)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  // Set user role cookie (for middleware)
  if (userRole) {
    res.cookie('userRole', userRole.toLowerCase(), {
      httpOnly: false, // Accessible to client-side for middleware
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
};

// Helper function to clear auth cookies
const clearAuthCookies = (res: Response) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    path: '/',
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('userRole', { ...cookieOptions, httpOnly: false });
};

// API Functions
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    const response = await serviceInstance.login(req.body as LoginDto);

    // ✅ Set cookies on successful login
    setAuthCookies(
      res, 
      response.token.accessToken, 
      response.token.refreshToken, 
      response.user.userRole
    );

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: response.user,
        // Still include tokens in response for client-side storage if needed
        token: response.token
      },
    });
  } catch (err) {
    next(err);
  }
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    const response = await serviceInstance.register(req.body as RegisterDto);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    const response = await serviceInstance.verifyEmail(req.body as VerifyEmailDto);

    // ✅ Set cookies on successful email verification
    setAuthCookies(
      res, 
      response.token.accessToken, 
      response.token.refreshToken, 
      response.user.userRole
    );

    return res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: response.user,
        token: response.token
      },
    });
  } catch (err) {
    next(err);
  }
};

const resendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    const response = await serviceInstance.resendOtp(req.body as ResendOtpDto);

    return res.json({
      success: true,
      message: 'OTP resent successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const refreshTokenCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    
    // ✅ Get refresh token from cookie if not in body
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const response = await serviceInstance.refreshToken({ refreshToken } as RefreshTokenDto);

    // ✅ Update cookies with new tokens
    setAuthCookies(res, response.accessToken, response.refreshToken);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const logoutCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    
    // ✅ Get userId from request body or JWT token
    const userId = req.body.userId || (req as any).user?.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required for logout',
      });
    }

    const response = await serviceInstance.logout({ userId } as logoutDto);

    // ✅ Clear auth cookies on logout
    clearAuthCookies(res);

    return res.json({
      success: true,
      message: 'Logout successful',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

const forgotPasswordCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    const response = await serviceInstance.forgotPassword(req.body as ForgotPasswordDto);

    return res.json({
      success: true,
      message: response.message,
      alert: response.alert,
    });
  } catch (err) {
    next(err);
  }
};

const resetPasswordCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceInstance = Container.get(AuthService);
    const response = await serviceInstance.resetPassword({ 
      ...req.body, 
      userId: req.params.userId 
    } as ResetPasswordDto);

    return res.json({
      success: true,
      message: 'Password reset successfully',
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// Set up API routes.
const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/refresh-token', refreshTokenCtrl);
router.post('/logout', logoutCtrl);
router.post('/forgot-password', forgotPasswordCtrl);
router.post('/reset-password/:userId', resetPasswordCtrl);

export default router;