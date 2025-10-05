export interface GeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'O0Il1';

export function generatePassword(options: GeneratorOptions): string {
  let characters = '';
  
  if (options.includeUppercase) characters += UPPERCASE;
  if (options.includeLowercase) characters += LOWERCASE;
  if (options.includeNumbers) characters += NUMBERS;
  if (options.includeSymbols) characters += SYMBOLS;
  
  if (options.excludeAmbiguous) {
    characters = characters.split('').filter(char => !AMBIGUOUS.includes(char)).join('');
  }
  
  if (characters.length === 0) {
    characters = LOWERCASE + NUMBERS;
  }
  
  let password = '';
  const array = new Uint32Array(options.length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < options.length; i++) {
    password += characters[array[i] % characters.length];
  }
  
  return password;
}
