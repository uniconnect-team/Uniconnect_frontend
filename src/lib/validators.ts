const emailRegex = /^[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/i;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function validateEmail(value: string): string | null {
  if (!value) return "Email is required"; //error if no email is entered
  return emailRegex.test(value) ? null : "Enter a valid email";
}

export function validatePassword(value: string): string | null {
  if (!value) return "Password is required"; //error if no password is entered
  return passwordRegex.test(value)
    ? null
    : "Password must be 8+ chars with letters and numbers";
}

export function validateRequired(value: string, message: string): string | null {
  return value ? null : message;  //error if the field is empty
}

export function validateLength(
  value: string,
  { min, max, message }: { min?: number; max?: number; message: string }
): string | null {
  if (!value) return message;
  if (min !== undefined && value.length < min) return message;
  if (max !== undefined && value.length > max) return message;
  return null;
}
// checking if the inputs are in the correct form (valid) and returns an error if not 