import { Request, Response, NextFunction } from 'express'
import { verifyToken, JWTPayload } from '../auth.js'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No valid authorization token provided'
      })
      return
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify token
    const payload = verifyToken(token)

    if (!payload) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired'
      })
      return
    }

    // Attach user info to request
    req.user = payload

    next()
  } catch (error) {
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate first'
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    })
    return
  }

  next()
}
