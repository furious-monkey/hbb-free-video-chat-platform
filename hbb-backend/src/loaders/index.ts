// backend/src/loaders/index.ts - Updated main loader for proper WebSocket initialization
import expressLoader from './express';
import websocketLoader from './websocket';
import setupCrons from '../background';
import { Express } from 'express';
import { Server } from 'http';

export default async ({
  expressApp,
  httpServer
}: {
  expressApp: Express;
  httpServer: Server;
}) => {
  console.log('🚀 Starting HBB Platform initialization...');

  // 1. Initialize WebSocket services FIRST (this will create the singleton)
  console.log('🔌 Initializing WebSocket services...');
  const webSocketServices = await websocketLoader({ httpServer });
  console.log('✅ WebSocket services loaded successfully');

  // 2. Initialize Express with minimal REST endpoints
  console.log('📡 Loading Express middleware and routes...');
  await expressLoader({ app: expressApp });
  console.log('✅ Express loaded successfully');

  // 3. Start background processes
  console.log('⏰ Starting background processes...');
  setupCrons();
  console.log('✅ Background processes started');

  console.log('🎉 HBB Platform initialization complete!');
  
  return webSocketServices;
};
