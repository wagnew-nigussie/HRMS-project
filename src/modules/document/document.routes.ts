import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/authenticate';
import * as svc from './document.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
export const documentRouter = Router();

documentRouter.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const employeeId = req.user!.employeeId;
    if (!employeeId) return res.status(403).json({ code: 'NO_EMPLOYEE' });
    res.status(201).json(await svc.upload(employeeId, req.file as any, (req.body.category as string) || 'OTHER'));
  } catch (e) { next(e); }
});

documentRouter.get('/me', authenticate, async (req, res, next) => {
  try { res.json(await svc.listMine(req.user!.employeeId!)); } catch (e) { next(e); }
});

documentRouter.get('/:id/download', authenticate, async (req, res, next) => {
  try { res.json(await svc.getDownloadUrl(req.params.id, req.user)); } catch (e) { next(e); }
});
