import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'local-prod', 'production']).default('local'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // App URLs
  NEXT_PUBLIC_APP_URL: z.string(),
  
  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY_HOURS: z.coerce.number().default(168),
  
  // Twilio (optional for local)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // AWS S3 (optional for local)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  S3_BUCKET_NAME: z.string().optional(),
})

function validateEnv() {
  const env = envSchema.parse(process.env)
  return env
}

export const env = validateEnv()

export type Env = z.infer<typeof envSchema>
