// modules/gift/gift.controller.ts - Gift controller for handling gift sending and getting gift types
import { Request, Response } from 'express';
import { GiftService } from './gift.service';

export class GiftController {
  private giftService: GiftService;

  constructor(giftService: GiftService) {
    this.giftService = giftService;
  }

  async sendGift(req: Request, res: Response) {
    try {
      const { senderId, receiverId, streamSessionId, giftTypeId, message } = req.body;

      if (!senderId || !receiverId || !streamSessionId || !giftTypeId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const giftResponse = await this.giftService.sendGift({
        senderId,
        receiverId,
        streamSessionId,
        giftTypeId,
        message,
      });

      if (giftResponse.success) {
        res.status(200).json(giftResponse);
      } else {
        res.status(400).json(giftResponse);
      }
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  async getGiftTypes(req: Request, res: Response) {
    try {
      const giftTypes = await this.giftService.getGiftTypes();
      res.status(200).json(giftTypes);
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
