import cors from 'cors'
import config from '@/utils/config'

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true)
    }

    // In development, allow localhost
    if (config.app.nodeEnv === 'development') {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ]
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
    }

    // In production, allow specific origin
    if (origin === config.app.corsOrigin) {
      return callback(null, true)
    }

    // Allow Stripe webhooks
    if (origin?.includes('stripe.com')) {
      return callback(null, true)
    }

    // Block all other origins
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
    return callback(new Error(msg), false)
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-request-id',
    'stripe-signature',
  ],
}

export default cors(corsOptions)