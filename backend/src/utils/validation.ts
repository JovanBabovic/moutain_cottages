/**
 * Comprehensive validation utilities for server-side data validation
 * Ensures data integrity and security across the application
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push("Email is required");
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (email.length > 255) {
    errors.push("Email must not exceed 255 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates username
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];

  if (!username || username.trim().length === 0) {
    errors.push("Username is required");
    return { isValid: false, errors };
  }

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (username.length > 50) {
    errors.push("Username must not exceed 50 characters");
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    errors.push(
      "Username can only contain letters, numbers, hyphens, and underscores"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates password strength
 * Requirements:
 * - 6-10 characters
 * - Must begin with a letter
 * - At least one uppercase letter
 * - At least three lowercase letters
 * - At least one digit
 * - At least one special character
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push("Password is required");
    return { isValid: false, errors };
  }

  // Length validation
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password.length > 10) {
    errors.push("Password must not exceed 10 characters");
  }

  // Must begin with a letter
  if (!/^[a-zA-Z]/.test(password)) {
    errors.push("Password must begin with a letter");
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // At least three lowercase letters
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  if (lowercaseCount < 3) {
    errors.push("Password must contain at least three lowercase letters");
  }

  // At least one digit
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates phone number
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];

  if (!phone || phone.trim().length === 0) {
    errors.push("Phone number is required");
    return { isValid: false, errors };
  }

  const phoneRegex = /^[0-9+\-\s()]+$/;
  if (!phoneRegex.test(phone)) {
    errors.push("Phone number contains invalid characters");
  }

  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    errors.push("Phone number must contain between 7 and 15 digits");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates required string field
 */
export function validateRequiredString(
  value: string,
  fieldName: string,
  minLength: number = 1,
  maxLength: number = 255
): ValidationResult {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  if (value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters long`);
  }

  if (value.length > maxLength) {
    errors.push(`${fieldName} must not exceed ${maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates credit card number (basic validation)
 */
/**
 * Validates credit card number based on specific card types
 * Supported cards:
 * - Diners: starts with 300-303, 36, or 38, exactly 15 digits
 * - MasterCard: starts with 51-55, exactly 16 digits
 * - Visa: starts with 4539, 4556, 4916, 4532, 4929, 4485, or 4716, exactly 16 digits
 */
export function validateCreditCard(cardNumber: string): ValidationResult {
  const errors: string[] = [];

  if (!cardNumber || cardNumber.trim().length === 0) {
    errors.push("Credit card number is required");
    return { isValid: false, errors };
  }

  const cleanedCard = cardNumber.replace(/[\s\-]/g, "");

  // Must contain only digits
  if (!/^[0-9]+$/.test(cleanedCard)) {
    errors.push("Credit card number must contain only digits");
    return { isValid: false, errors };
  }

  let isValid = false;

  // Diners: starts with 300, 301, 302, 303, 36, or 38, exactly 15 digits
  if (cleanedCard.length === 15) {
    if (
      /^300/.test(cleanedCard) ||
      /^301/.test(cleanedCard) ||
      /^302/.test(cleanedCard) ||
      /^303/.test(cleanedCard) ||
      /^36/.test(cleanedCard) ||
      /^38/.test(cleanedCard)
    ) {
      isValid = true;
    }
  }

  // MasterCard: starts with 51, 52, 53, 54, or 55, exactly 16 digits
  if (cleanedCard.length === 16) {
    if (
      /^51/.test(cleanedCard) ||
      /^52/.test(cleanedCard) ||
      /^53/.test(cleanedCard) ||
      /^54/.test(cleanedCard) ||
      /^55/.test(cleanedCard)
    ) {
      isValid = true;
    }

    // Visa: starts with 4539, 4556, 4916, 4532, 4929, 4485, or 4716, exactly 16 digits
    if (
      /^4539/.test(cleanedCard) ||
      /^4556/.test(cleanedCard) ||
      /^4916/.test(cleanedCard) ||
      /^4532/.test(cleanedCard) ||
      /^4929/.test(cleanedCard) ||
      /^4485/.test(cleanedCard) ||
      /^4716/.test(cleanedCard)
    ) {
      isValid = true;
    }
  }

  if (!isValid) {
    errors.push(
      "Invalid credit card. Must be Diners (15 digits, starts with 300-303/36/38), MasterCard (16 digits, starts with 51-55), or Visa (16 digits, starts with 4539/4556/4916/4532/4929/4485/4716)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Detects credit card type (for displaying icon)
 * Returns: 'diners', 'mastercard', 'visa', or null
 */
export function detectCardType(cardNumber: string): string | null {
  const cleanedCard = cardNumber.replace(/[\s\-]/g, "");

  if (!/^[0-9]+$/.test(cleanedCard)) {
    return null;
  }

  // Diners
  if (cleanedCard.length === 15) {
    if (
      /^300/.test(cleanedCard) ||
      /^301/.test(cleanedCard) ||
      /^302/.test(cleanedCard) ||
      /^303/.test(cleanedCard) ||
      /^36/.test(cleanedCard) ||
      /^38/.test(cleanedCard)
    ) {
      return "diners";
    }
  }

  // MasterCard and Visa (both 16 digits)
  if (cleanedCard.length === 16) {
    // MasterCard
    if (
      /^51/.test(cleanedCard) ||
      /^52/.test(cleanedCard) ||
      /^53/.test(cleanedCard) ||
      /^54/.test(cleanedCard) ||
      /^55/.test(cleanedCard)
    ) {
      return "mastercard";
    }

    // Visa
    if (
      /^4539/.test(cleanedCard) ||
      /^4556/.test(cleanedCard) ||
      /^4916/.test(cleanedCard) ||
      /^4532/.test(cleanedCard) ||
      /^4929/.test(cleanedCard) ||
      /^4485/.test(cleanedCard) ||
      /^4716/.test(cleanedCard)
    ) {
      return "visa";
    }
  }

  return null;
}

/**
 * Validates number is within range
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): ValidationResult {
  const errors: string[] = [];

  if (value === null || value === undefined || isNaN(value)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors };
  }

  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (value > max) {
    errors.push(`${fieldName} must not exceed ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates date is in valid format and range
 */
export function validateDate(
  dateString: string,
  fieldName: string,
  allowPast: boolean = false
): ValidationResult {
  const errors: string[] = [];

  if (!dateString || dateString.trim().length === 0) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    errors.push(`${fieldName} is not a valid date`);
    return { isValid: false, errors };
  }

  if (!allowPast) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (date < now) {
      errors.push(`${fieldName} cannot be in the past`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates date range (start date must be before end date)
 */
export function validateDateRange(
  startDate: string,
  endDate: string
): ValidationResult {
  const errors: string[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    errors.push("Start date is not valid");
  }

  if (isNaN(end.getTime())) {
    errors.push("End date is not valid");
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  if (start >= end) {
    errors.push("End date must be after start date");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates gender value
 */
export function validateGender(gender: string): ValidationResult {
  const errors: string[] = [];

  if (!gender || gender.trim().length === 0) {
    errors.push("Gender is required");
    return { isValid: false, errors };
  }

  const validGenders = ["M", "F", "male", "female"];
  if (!validGenders.includes(gender)) {
    errors.push("Gender must be M, F, male, or female");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates user type
 */
export function validateUserType(userType: string): ValidationResult {
  const errors: string[] = [];

  if (!userType || userType.trim().length === 0) {
    errors.push("User type is required");
    return { isValid: false, errors };
  }

  const validTypes = ["tourist", "owner", "admin"];
  if (!validTypes.includes(userType)) {
    errors.push("User type must be tourist, owner, or admin");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Combines multiple validation results
 */
export function combineValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors: string[] = [];

  results.forEach((result) => {
    allErrors.push(...result.errors);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Sanitizes string input to prevent injection attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}
