import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params });
      if (parsed.body) req.body = parsed.body;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', fields: e.flatten().fieldErrors });
      }
      next(e);
    }
  };
