export const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (numbers.length >= 10) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  } else if (numbers.length >= 6) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
  } else if (numbers.length >= 3) {
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  }
  return numbers;
};

export const unformatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  return value.replace(/\D/g, '');
};

export const isValidUSPhone = (value: string): boolean => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  // Check if it's a valid 10-digit US phone number
  return numbers.length === 10;
}; 