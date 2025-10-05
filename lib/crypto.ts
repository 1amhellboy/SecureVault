import CryptoJS from 'crypto-js';

export function encryptData(data: string, masterPassword: string): string {
  return CryptoJS.AES.encrypt(data, masterPassword).toString();
}

export function decryptData(encryptedData: string, masterPassword: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, masterPassword);
  return bytes.toString(CryptoJS.enc.Utf8);
}
