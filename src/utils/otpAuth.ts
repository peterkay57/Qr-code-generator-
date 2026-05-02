import * as OTPAuth from 'otpauth';

export interface ParsedOTPAuth {
  name: string;
  issuer?: string;
  secret: string;
}

export function parseOTPAuthURI(uri: string): ParsedOTPAuth | null {
  try {
    const totp = OTPAuth.URI.parse(uri);
    if (!(totp instanceof OTPAuth.TOTP)) return null;

    return {
      name: totp.label,
      issuer: totp.issuer,
      secret: totp.secret.base32
    };
  } catch (e) {
    console.error('Failed to parse OTPAuth URI', e);
    return null;
  }
}

export function generateTOTP(secret: string): string {
  try {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    return totp.generate();
  } catch (e) {
    console.error('Failed to generate TOTP', e);
    return '000000';
  }
}

export function getRemainingTime(): number {
  const step = 30;
  const now = Math.floor(Date.now() / 1000);
  return step - (now % step);
}
