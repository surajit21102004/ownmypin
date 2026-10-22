/**
 * DIGIPIN Generator for OwnMyPin
 * Format: SS-DD-NNNNNNNN
 * - SS: 2-letter state code (e.g. WB)
 * - DD: 2-digit district code (e.g. 09)
 * - NNNNNNNN: 8-digit unique code
 * Rule: Patterned numbers (e.g. 11111111, 12345678, 10101010, etc.) are disallowed.
 */

const crypto = require('crypto');

/**
 * Checks if an 8-digit string is patterned/disallowed
 * @param {string} code
 * @returns {boolean}
 */
function isPatterned(code) {
  if (typeof code !== 'string' || code.length !== 8) return true;

  // 1. All identical digits (e.g. 11111111, 77777777)
  if (/^(\d)\1{7}$/.test(code)) return true;

  // 2. Sequential ascending (e.g. 01234567, 12345678, 23456789)
  const ascending = '0123456789';
  if (ascending.includes(code)) return true;

  // 3. Sequential descending (e.g. 98765432, 87654321, 76543210)
  const descending = '9876543210';
  if (descending.includes(code)) return true;

  // 4. Alternating 2 digits (e.g. 10101010, 12121212, 45454545)
  if (/^(\d{2})\1{3}$/.test(code)) return true;

  // 5. Repeating 4-digit block (e.g. 12341234)
  if (code.slice(0, 4) === code.slice(4)) return true;

  // 6. Palindrome (e.g. 12344321)
  if (code === code.split('').reverse().join('')) return true;

  return false;
}

/**
 * Generates an 8-digit non-patterned random number
 * @returns {string}
 */
function generateNonPatternedNumber() {
  while (true) {
    // Generate secure random number between 10000000 and 99999999
    const num = crypto.randomInt(10000000, 100000000).toString();
    if (!isPatterned(num)) {
      return num;
    }
  }
}

/**
 * Generates a full verified OwnMyPin
 * @param {string} stateCode - e.g. "WB"
 * @param {string} districtCode - e.g. "09"
 * @param {object} pool - MySQL connection pool
 * @returns {Promise<{pinCode: string, stateCode: string, districtCode: string, uniqueCode: string}>}
 */
async function generateUniquePin(stateCode = 'WB', districtCode = '09', pool) {
  const cleanState = (stateCode || 'WB').trim().toUpperCase().slice(0, 2);
  const cleanDistrict = String(districtCode || '09').padStart(2, '0').slice(-2);

  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    attempts++;
    const uniqueCode = generateNonPatternedNumber();
    const candidatePin = `${cleanState}-${cleanDistrict}-${uniqueCode}`;

    if (pool) {
      // Check if candidatePin already exists in DB
      const [existing] = await pool.query(
        'SELECT id FROM pins WHERE pin_code = ? LIMIT 1',
        [candidatePin]
      );
      if (existing.length === 0) {
        return {
          pinCode: candidatePin,
          stateCode: cleanState,
          districtCode: cleanDistrict,
          uniqueCode,
        };
      }
    } else {
      return {
        pinCode: candidatePin,
        stateCode: cleanState,
        districtCode: cleanDistrict,
        uniqueCode,
      };
    }
  }

  throw new Error('Failed to generate unique PIN after maximum attempts');
}

module.exports = {
  isPatterned,
  generateNonPatternedNumber,
  generateUniquePin,
};
