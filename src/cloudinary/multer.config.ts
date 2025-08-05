import * as multer from 'multer';

export const multerConfig = {
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
};
