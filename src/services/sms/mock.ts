import { SmsService } from './index';

export class MockSmsService implements SmsService {
  async sendOtp(phone: string): Promise<void> {
    console.log(`🔍 MOCK: Sending OTP to ${phone}`);
    console.log(`🔍 MOCK: OTP code would be: 123456`);
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    console.log(`🔍 MOCK: Verifying OTP for ${phone} with code ${code}`);

    // Mock verification: accept 123456 as valid
    if (code === '123456') {
      console.log(`🔍 MOCK: OTP verification successful`);
      return true;
    }

    console.log(`🔍 MOCK: OTP verification failed`);
    return false;
  }

  async sendSms(phone: string, message: string): Promise<void> {
    console.log(`🔍 MOCK: Sending SMS to ${phone}`);
    console.log(`🔍 MOCK: Message: ${message}`);
  }
}
