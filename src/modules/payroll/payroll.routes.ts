import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { audit } from '../../middleware/auditLog';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import PDFDocument from 'pdfkit';
import * as ctrl from './payroll.controller';

export const payrollRouter = Router();

payrollRouter.post('/runs', authenticate, requireRole(['ADMIN', 'FINANCE']), audit('payroll.run', 'PayrollRun'), ctrl.run);
payrollRouter.get('/payslips/me', authenticate, ctrl.myPayslips);

payrollRouter.get('/payslips/:id/download', authenticate, async (req, res, next) => {
  try {
    const slip = await prisma.payslip.findUnique({
      where: { id: req.params.id },
      include: { employee: true, payrollRun: true },
    });
    if (!slip) throw new AppError(404, 'NOT_FOUND', 'Payslip not found');

    const isOwner = req.user!.employeeId === slip.employeeId;
    const isElevated = ['ADMIN', 'FINANCE'].includes(req.user!.role);
    if (!isOwner && !isElevated) throw new AppError(403, 'FORBIDDEN', 'Not allowed');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${slip.payrollRun.period}.pdf"`);

    doc.fontSize(20).text('PAYSLIP', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Period: ${slip.payrollRun.period}`);
    doc.text(`Employee: ${slip.employee.firstName} ${slip.employee.lastName}`);
    doc.moveDown();
    doc.text(`Gross: $${slip.gross}`);
    doc.text(`Tax: $${slip.tax}`);
    doc.text(`Net Pay: $${slip.net}`);
    
    doc.pipe(res);
    doc.end();
  } catch (e) { next(e); }
});
