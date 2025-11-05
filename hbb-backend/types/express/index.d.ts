
import * as multer from 'multer';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}
