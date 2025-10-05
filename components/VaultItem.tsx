'use client';

import { useState } from 'react';

interface VaultItemProps {
  item: {
    id: number;
    encrypted_title: string;
    encrypted_username?: string;
    encrypted_password: string;
    encrypted_url?: string;
    encrypted_notes?: string;
  };
  masterPassword: string;
  onEdit: (item: any) => void;
  onDelete: (id: number) => void;
  decryptData: (encrypted: string, key: string) => string;
}

export default function VaultItem({ item, masterPassword, onEdit, onDelete, decryptData }: VaultItemProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const decryptedTitle = item.encrypted_title ? decryptData(item.encrypted_title, masterPassword) : '';
  const decryptedPassword = item.encrypted_password ? decryptData(item.encrypted_password, masterPassword) : '';
  const decryptedUsername = item.encrypted_username ? decryptData(item.encrypted_username, masterPassword) : '';
  const decryptedUrl = item.encrypted_url ? decryptData(item.encrypted_url, masterPassword) : '';
  const decryptedNotes = item.encrypted_notes ? decryptData(item.encrypted_notes, masterPassword) : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(decryptedPassword);
    setCopied(true);
    setTimeout(() => {
      navigator.clipboard.writeText('');
      setCopied(false);
    }, 15000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{decryptedTitle}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>

      {decryptedUsername && (
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">Username:</span> {decryptedUsername}
        </p>
      )}

      <div className="flex items-center gap-2 mb-2">
        <input
          type={showPassword ? 'text' : 'password'}
          value={decryptedPassword}
          readOnly
          className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50 font-mono"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>

      {decryptedUrl && (
        <p className="text-sm text-gray-600 mb-1">
          <span className="font-medium">URL:</span>{' '}
          <a href={decryptedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {decryptedUrl}
          </a>
        </p>
      )}

      {decryptedNotes && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Notes:</span> {decryptedNotes}
        </p>
      )}

      {copied && (
        <p className="text-xs text-orange-600 mt-2">
          Password copied! Clipboard will auto-clear in 15 seconds
        </p>
      )}
    </div>
  );
}
