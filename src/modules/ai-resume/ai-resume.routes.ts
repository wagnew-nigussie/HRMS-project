import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { prisma } from '../../config/prisma';

const upload = multer({ storage: multer.memoryStorage() });
export const aiResumeRouter = Router();

aiResumeRouter.post('/jobs', authenticate, requireRole(['ADMIN', 'HR_MANAGER']), upload.array('files'), async (req, res, next) => {
  try {
    const job = await prisma.resumeScreeningJob.create({
      data: { createdById: req.user!.id, jobTitle: req.body.jobTitle || 'Untitled', criteria: req.body.criteria || {}, status: 'COMPLETED' },
    });
    await prisma.resumeScreeningResult.create({
      data: { jobId: job.id, filename: 'resume.pdf', score: 0.85, skillsMatched: ['Node.js'], gaps: [], rationale: 'Mock AI result (Real AI skipped).' }
    });
    res.status(201).json({ message: 'Job created', jobId: job.id });
  } catch (e) { next(e); }
});