/**
 * Validates a US phone number
 * @param phone - The phone number to validate
 * @returns boolean indicating if the phone number is valid
 */
export const isValidUSPhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Check if it's a valid US number (10 digits)
  return digits.length === 10
}

/**
 * Formats a phone number to (XXX) XXX-XXXX
 * @param phone - The phone number to format
 * @returns formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  // Return original if not 10 digits
  return phone
}

/**
 * Unformats a phone number to just digits
 * @param phone - The phone number to unformat
 * @returns unformatted phone number (just digits)
 */
export const unformatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '')
} 