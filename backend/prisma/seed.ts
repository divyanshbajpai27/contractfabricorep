import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authService } from '../src/services/authService'
import logger from '../src/utils/logger'

const prisma = new PrismaClient()

async function main() {
  try {
    logger.info('Starting database seed...')

    // Create initial admin user
    await authService.createInitialAdmin()

    // Load templates from files
    const { templateService } = await import('../src/services/templateService')
    await templateService.loadTemplatesFromFiles()

    logger.info('Database seed completed successfully')
  } catch (error) {
    logger.error('Database seed failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })