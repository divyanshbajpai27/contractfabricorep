import dotenv from 'dotenv'
import { AppConfig } from '@/types'

// Load environment variables
dotenv.config()

const config: AppConfig = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/contractfabrico',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
    expiresIn: '24h',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || 'contractfabrico-docs',
    endpoint: process.env.R2_ENDPOINT || '',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'noreply@contractfabrico.com',
  },
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SENDGRID_API_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
]

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar] || process.env[envVar] === ''
)

if (missingEnvVars.length > 0 && config.app.nodeEnv === 'production') {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
}

export default config