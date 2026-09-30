/**
 * E.164 Phone Number Normalization Utility
 * Guarantees a single canonical representation across all variations of mobile input.
 */

export function normalizePhoneNumber(raw: string, defaultCountryCode: string = '+91'): string {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Please enter a valid mobile number.');
  }

  // Remove whitespace, hyphens, parentheses, and dots
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, '').trim();

  let prefix = defaultCountryCode.trim();
  if (prefix.toUpperCase() === 'IN') prefix = '+91';
  else if (prefix.toUpperCase() === 'US' || prefix.toUpperCase() === 'CA') prefix = '+1';
  else if (!prefix.startsWith('+')) prefix = '+' + prefix;

  // If starts with 00 (international prefix), replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // If starts with leading 0 (trunk prefix e.g. 09876543210), strip 0 and prepend default country
  if (cleaned.startsWith('0')) {
    cleaned = prefix + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    // If no leading +, prepend default country code
    cleaned = prefix + cleaned;
  }

  // Validate E.164 format: + followed by 10 to 15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  if (!e164Regex.test(cleaned)) {
    throw new Error('Invalid mobile number format. Please provide a valid 10-digit mobile number.');
  }

  return cleaned;
}

export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const len = phone.length;
  return phone.substring(0, len - 6) + 'XXXX' + phone.substring(len - 2);
}
