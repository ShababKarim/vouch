import { env } from '@/lib/env';
import { SmsService } from './index';

export class TwilioSmsService implements SmsService {
  async sendOtp(phone: string): Promise<void> {
    if (!env.TWILIO_VERIFY_SERVICE_SID) {
      throw new Error('Twilio Verify service SID not configured');
    }

    console.log(`📱 Sending OTP via Twilio Verify to ${phone}`);
    // TODO: Implement actual Twilio Verify API call
    // const verification = await twilio.verify.services(env.TWILIO_VERIFY_SERVICE_SID)
    //   .verifications.create({ to: phone, channel: 'sms' })
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    if (!env.TWILIO_VERIFY_SERVICE_SID) {
      throw new Error('Twilio Verify service SID not configured');
    }

    console.log(`📱 Verifying OTP via Twilio Verify for ${phone}`);
    // TODO: Implement actual Twilio Verify API call
    // const verification = await twilio.verify.services(env.TWILIO_VERIFY_SERVICE_SID)
    //   .verificationChecks.create({ to: phone, code })
    // return verification.status === 'approved'

    return false; // Placeholder until implemented
  }

  async sendSms(phone: string, message: string): Promise<void> {
    if (!env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio phone number not configured');
    }

    console.log(`📱 Sending SMS via Twilio to ${phone}`);
    // TODO: Implement actual Twilio SMS API call
    // await twilio.messages.create({
    //   body: message,
    //   from: env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // })
  }
}
