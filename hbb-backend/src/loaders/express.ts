// backend/src/loaders/express.ts - Updated with comprehensive health checks
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser'; 

import authRoutes from '../modules/auth/auth.controller';
import profileRoutes from '../modules/profile/profile.controller';
import userRoutes from '../modules/user/user.controller';
import settingRoutes from '../modules/setting/setting.controller';
import mediaRoutes from '../modules/media/media.controller';
import appointmentRoutes from '../modules/appoinment/appointment.controller';
import adminRoutes from '../modules/admin/admin.controller';
import noAuthRoutes from '../modules/noAuth/noAuth.controller';
import influencerRoutes from '../modules/influencer/influencer.controller';
import likeRoutes from '../modules/like/like.controller';
import discoverRoutes from '../modules/discover/discover.controller';
import interestRoutes from '../modules/interest/interest.controller';
import zodiacSignRoutes from '../modules/zodiacSign/zodiacSign.controller';
import paymentRoutes from '../routes/payment.routes'; 
import giftRoutes from '../routes/gift.routes'; 
import streamingRoutes from '../routes/streaming.routes';
import healthRoutes from '../routes/health.routes'; // Add health routes
import callHistoryRoutes from '../modules/callHistory/callHistory.controller';
import reportRoutes from '../modules/report/report.controller'; 
import earningsRoutes from '../modules/earnings/earnings.controller'; 
import transactionRoutes from '../modules/transactions/transaction.controller';
import waitlistRoutes from '../modules/waitlist/waitlist.controller';
import billingRoutes from '../routes/billing.routes';
import { APIError } from '../middleware/error/appError';

import { refreshUserTTL } from '../middleware/refreshUserTTL';

const initializeApp = ({ app }: { app: express.Application }) => {
  console.log('🚀 Initializing Express application...');

  // ✅ CRITICAL: Add cookie-parser BEFORE any routes that need cookies
  app.use(cookieParser());
  console.log('✅ Cookie parser middleware initialized');

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ✅ Enhanced CORS configuration for cookies
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.BASE_URL,
        'http://localhost:3000',
        'https://c17d-31-205-38-212.ngrok-free.app',
        'https://www.hbb.chat',
        'hbb.chat'
      ].filter(Boolean); // Remove any undefined/null values

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true, // ✅ ESSENTIAL for cookies
    optionsSuccessStatus: 204,
    preflightContinue: false,
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-CSRFToken',
      'Access-Control-Allow-Credentials',
      'Origin',
      'X-Requested-With',
      'Accept'
    ]
  }));
  
  // Handle preflight for all routes
  app.options('*', cors());

  // Security and logging middleware
  app.use(helmet({
    crossOriginEmbedderPolicy: false, // Needed for some streaming features
  }));
  app.use(morgan('dev'));

  // ✅ HEALTH CHECK ROUTES - Must be BEFORE authentication middleware
  // These routes should always be accessible for AWS ECS health checks
  app.use('/', healthRoutes);
  
  // Legacy status endpoint for backward compatibility
  app.get('/status', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  console.log('✅ Health check endpoints configured');

  // ✅ Debug middleware to log cookies and headers (can remove in production)
  if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
      if (req.path.includes('/auth/')) {
        console.log(`🔍 ${req.method} ${req.path}`, {
          hasCookies: !!req.cookies,
          cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
          hasRefreshToken: !!req.cookies?.refreshToken,
          hasAccessToken: !!req.cookies?.accessToken,
          origin: req.headers.origin,
          userAgent: req.headers['user-agent']?.slice(0, 50)
        });
      }
      next();
    });
  }

  // Routes that do not require authentication
  app.use('/api/auth', authRoutes);
  app.use('/api/no-auth', noAuthRoutes);

  console.log('✅ Public routes configured');

  // Global Redis TTL refresh for authenticated users
  app.use(refreshUserTTL);

  // Routes that require authentication
  app.use('/api/profile', profileRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/setting', settingRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/appointment', appointmentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/influencer', influencerRoutes);
  app.use('/api/like', likeRoutes);
  app.use('/api/discover', discoverRoutes);
  app.use('/api/interest', interestRoutes);
  app.use('/api/zodiac', zodiacSignRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/gift', giftRoutes);
  app.use('/api/streaming', streamingRoutes);
  app.use('/api/report', reportRoutes)
  app.use('/api/call-history', callHistoryRoutes);
  app.use('/api/earnings', earningsRoutes);
  app.use('/api/transaction', transactionRoutes);
  app.use('/api/waitlist', waitlistRoutes);
  app.use('/api/billing', billingRoutes);

  console.log('✅ Protected routes configured');

  // 404 handler for unmatched routes
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    });
  });

  console.log('🎯 Express middleware and routes loaded successfully');
};

export default initializeApp;