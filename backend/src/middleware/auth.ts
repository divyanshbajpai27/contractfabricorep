import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '@/utils/config'
import logger from '@/utils/logger'
import { JwtPayload } from '@/types'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload
    }
  }
}

export interface AuthenticatedRequest extends Request {
  admin?: JwtPayload
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    logger.warn('Unauthorized access attempt - no token provided', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    })

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Access token is required',
      },
      timestamp: new Date().toISOString(),
    })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload
    req.admin = decoded

    logger.info('Admin authenticated successfully', {
      adminId: decoded.adminId,
      email: decoded.email,
      requestId: req.headers['x-request-id'],
    })

    next()
  } catch (error) {
    logger.warn('Invalid token provided', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    })

    return res.status(403).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid or expired token',
      },
      timestamp: new Date().toISOString(),
    })
  }
}

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Admin access is required',
      },
      timestamp: new Date().toISOString(),
    })
  }

  next()
}

// Generate JWT token for admin
export const generateToken = (adminId: string, email: string): string => {
  const payload: JwtPayload = {
    adminId,
    email,
  }

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: 'contractfabrico.com',
    audience: 'admin-panel',
  })
}

// Verify JWT token (utility function)
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload
  } catch (error) {
    return null
  }
}