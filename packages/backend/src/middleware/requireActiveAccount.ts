import { type Request, type Response, type NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/errors.js';
import { getAccountState } from '../services/billing/accountState.js';

/**
 * Block teacher WRITE actions when the account is locked (free month over, unpaid).
 * Reads (GET) still work so the dashboard can render behind the paywall. Must run
 * AFTER verifyToken (needs req.user). Shared by every teacher-write surface so the
 * paywall can't be bypassed through a route that forgot to gate itself.
 */
export const requireActiveAccount = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.method === 'GET') return next();
  const state = await getAccountState(req.user!.id);
  if (state.locked) {
    throw new ApiError(402, 'Your free month has ended. Subscribe to keep managing your driving school.', 'ACCOUNT_LOCKED');
  }
  next();
});
