import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { Admin } from '@/types'
import { generateToken } from '@/middleware/auth'
import logger from '@/utils/logger'
import config from '@/utils/config'

const prisma = new PrismaClient()

export class AuthService {
  /**
   * Authenticate admin user
   */
  async login(email: string, password: string): Promise<{
    success: boolean
    token?: string
    admin?: Admin
    message?: string
  }> {
    try {
      // Find admin by email
      const admin = await prisma.admin.findUnique({
        where: { email },
      })

      if (!admin) {
        logger.warn('Login attempt with non-existent email', {
          email,
          ip: 'unknown', // Will be set by middleware
        })

        return {
          success: false,
          message: 'Invalid email or password',
        }
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password)

      if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', {
          adminId: admin.id,
          email,
          ip: 'unknown', // Will be set by middleware
        })

        return {
          success: false,
          message: 'Invalid email or password',
        }
      }

      // Generate JWT token
      const token = generateToken(admin.id, admin.email)

      logger.info('Admin login successful', {
        adminId: admin.id,
        email,
        ip: 'unknown', // Will be set by middleware
      })

      return {
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          createdAt: admin.createdAt,
        },
      }
    } catch (error) {
      logger.error('Login failed due to error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      })

      return {
        success: false,
        message: 'Login failed. Please try again.',
      }
    }
  }

  /**
   * Get admin profile
   */
  async getAdminProfile(adminId: string): Promise<Admin> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      })

      if (!admin) {
        throw new Error('Admin not found')
      }

      return {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt,
      }
    } catch (error) {
      logger.error('Failed to get admin profile', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
      })
      throw new Error('Failed to get admin profile')
    }
  }

  /**
   * Create initial admin user
   */
  async createInitialAdmin(): Promise<void> {
    try {
      const existingAdmin = await prisma.admin.findFirst()

      if (existingAdmin) {
        logger.info('Admin user already exists', {
          adminId: existingAdmin.id,
          email: existingAdmin.email,
        })
        return
      }

      const adminEmail = config.admin.ADMIN_EMAIL
      const adminPassword = config.admin.ADMIN_PASSWORD

      if (!adminEmail || !adminPassword) {
        throw new Error('Admin email and password must be provided in environment variables')
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 12)

      const admin = await prisma.admin.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
        },
      })

      logger.info('Initial admin user created', {
        adminId: admin.id,
        email: admin.email,
      })
    } catch (error) {
      logger.error('Failed to create initial admin', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  /**
   * Change admin password
   */
  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
      })

      if (!admin) {
        throw new Error('Admin not found')
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password)

      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect')
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)

      // Update password
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      })

      logger.info('Admin password changed', {
        adminId,
        email: admin.email,
      })
    } catch (error) {
      logger.error('Failed to change admin password', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
      })
      throw error
    }
  }

  /**
   * Validate admin token
   */
  async validateToken(token: string): Promise<Admin | null> {
    try {
      const { verifyToken } = await import('@/middleware/auth')
      const payload = verifyToken(token)

      if (!payload) {
        return null
      }

      return this.getAdminProfile(payload.adminId)
    } catch (error) {
      logger.error('Token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return null
    }
  }

  /**
   * Update admin email
   */
  async updateEmail(adminId: string, newEmail: string): Promise<void> {
    try {
      // Check if email is already in use
      const existingAdmin = await prisma.admin.findUnique({
        where: { email: newEmail },
      })

      if (existingAdmin) {
        throw new Error('Email is already in use')
      }

      // Update email
      await prisma.admin.update({
        where: { id: adminId },
        data: {
          email: newEmail,
          updatedAt: new Date(),
        },
      })

      logger.info('Admin email updated', {
        adminId,
        newEmail,
      })
    } catch (error) {
      logger.error('Failed to update admin email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId,
        newEmail,
      })
      throw error
    }
  }
}

export const authService = new AuthService()
export default authService