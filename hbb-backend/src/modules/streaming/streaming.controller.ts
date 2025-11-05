// modules/streaming/streaming.controller.ts - Fixed TypeScript duplicate identifier error
import { Request, Response as ExpressResponse } from 'express';
import { StreamingService } from './streaming.service';

export class StreamingController {
  private streamingService: StreamingService;

  constructor(streamingService: StreamingService) {
    this.streamingService = streamingService;
  }

  async createStreamSession(req: Request, res: ExpressResponse) {
    try {
      const { influencerId, allowBids, callRate } = req.body;

      if (!influencerId || allowBids === undefined || !callRate) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const streamSession = await this.streamingService.createStreamSession(
        influencerId,
        allowBids,
        callRate
      );

      res.status(200).json({ success: true, data: streamSession });
    } catch (error: any) {
      console.error('Create stream session error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async joinStreamSession(req: Request, res: ExpressResponse) {
    try {
      const { sessionId, explorerId } = req.body;

      if (!sessionId || !explorerId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const updatedSession = await this.streamingService.joinStreamSession(sessionId, explorerId);

      res.status(200).json({ success: true, data: updatedSession });
    } catch (error: any) {
      console.error('Join stream session error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async placeBid(req: Request, res: ExpressResponse) {
    try {
      const { sessionId, explorerId, amount } = req.body;

      if (!sessionId || !explorerId || !amount) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const bidResponse = await this.streamingService.placeBid({
        sessionId,
        explorerId,
        amount,
      });

      if (bidResponse.success) {
        res.status(200).json(bidResponse);
      } else {
        res.status(400).json(bidResponse);
      }
    } catch (error: any) {
      console.error('Place bid error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async sendGift(req: Request, res: ExpressResponse) {
    try {
      const { sessionId, explorerId, giftTypeId, message, influencerId } = req.body;

      if (!sessionId || !explorerId || !giftTypeId || !influencerId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const giftResponse = await this.streamingService.sendGift({
        sessionId,
        explorerId,
        giftTypeId,
        influencerId,
        amount: req.body.amount,
        message,
      });

      res.status(200).json(giftResponse);
    } catch (error: any) {
      console.error('Send gift error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async endStreamSession(req: Request, res: ExpressResponse) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const updatedSession = await this.streamingService.endStreamSession(sessionId);

      res.status(200).json({ success: true, data: updatedSession });
    } catch (error: any) {
      console.error('End stream session error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStreamSession(req: Request, res: ExpressResponse) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing session ID' });
      }
      
      const session = await this.streamingService.getStreamSession(id);
      
      if (!session) {
        return res.status(404).json({ success: false, message: 'Stream session not found' });
      }
      
      res.status(200).json({ success: true, data: session });
    } catch (error: any) {
      console.error('Get stream session error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getLiveStreams(req: Request, res: ExpressResponse) {
    try {
      const streams = await this.streamingService.getLiveStreams();
      res.status(200).json({ success: true, data: streams });
    } catch (error: any) {
      console.error('Get live streams error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStreamBids(req: Request, res: ExpressResponse) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing session ID' });
      }
      
      const bids = await this.streamingService.getStreamBids(id);
      res.status(200).json({ success: true, data: bids });
    } catch (error: any) {
      console.error('Get stream bids error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStreamGifts(req: Request, res: ExpressResponse) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing session ID' });
      }
      
      const gifts = await this.streamingService.getStreamGifts(id);
      res.status(200).json({ success: true, data: gifts });
    } catch (error: any) {
      console.error('Get stream gifts error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async acceptBid(req: Request, res: ExpressResponse) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing bid ID' });
      }
      
      const updatedBid = await this.streamingService.acceptBid(id);
      res.status(200).json({ success: true, data: updatedBid });
    } catch (error: any) {
      console.error('Accept bid error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async rejectBid(req: Request, res: ExpressResponse) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing bid ID' });
      }
      
      const updatedBid = await this.streamingService.rejectBid(id);
      res.status(200).json({ success: true, data: updatedBid });
    } catch (error: any) {
      console.error('Reject bid error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStreamSettings(req: Request, res: ExpressResponse) {
    try {
      const { id } = req.params;
      const { allowBids, callRate } = req.body;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'Missing session ID' });
      }
      
      const updatedSession = await this.streamingService.updateStreamSettings(id, { allowBids, callRate });
      res.status(200).json({ success: true, data: updatedSession });
    } catch (error: any) {
      console.error('Update stream settings error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getGiftTypes(req: Request, res: ExpressResponse) {
    try {
      const giftTypes = await this.streamingService.getGiftTypes();
      res.status(200).json({ success: true, data: giftTypes });
    } catch (error: any) {
      console.error('Get gift types error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}