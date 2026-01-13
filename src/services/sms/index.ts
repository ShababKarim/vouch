import { env } from '@/lib/env';
import { MockSmsService } from './mock';
import { TwilioSmsService } from './twilio';

export interface SmsService {
  sendOtp(phone: string): Promise<void>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
  sendSms(phone: string, message: string): Promise<void>;
}

export function createSmsService(): SmsService {
  if (env.APP_ENV === 'local') {
    return new MockSmsService();
  }

  return new TwilioSmsService();
}
