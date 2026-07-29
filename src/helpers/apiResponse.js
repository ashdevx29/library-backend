import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const paginate = (query, page = 1, limit = 20) => {
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  return { skip, limit: parseInt(limit), page: parseInt(page) };
};

export const paginateResponse = (total, page, limit) => ({
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

export const apiSuccess = (res, data, message = 'Success') => res.json({ success: true, message, data });

export const apiError = (res, message = 'Error', status = 400) => res.status(status).json({ success: false, message });
