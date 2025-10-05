'use client';

import { useState } from 'react';
import { generatePassword, GeneratorOptions } from '@/lib/passwordGenerator';

interface PasswordGeneratorProps {
  onUsePassword?: (password: string) => void;
}

export default function PasswordGenerator({ onUsePassword }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState<Omit<GeneratorOptions, 'length'>>({
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: true,
  });
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const newPassword = generatePassword({ ...options, length });
    setPassword(newPassword);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (password) {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => {
        navigator.clipboard.writeText('');
        setCopied(false);
      }, 15000);
    }
  };

  const handleUse = () => {
    if (onUsePassword && password) {
      onUsePassword(password);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Password Generator</h2>
      
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={password}
            readOnly
            placeholder="Click 'Generate' to create a password"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
          />
          <button
            onClick={handleCopy}
            disabled={!password}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        {copied && (
          <p className="text-xs text-orange-600">
            Clipboard will auto-clear in 15 seconds
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Length: {length}
        </label>
        <input
          type="range"
          min="8"
          max="32"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>8</span>
          <span>32</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.includeUppercase}
            onChange={(e) => setOptions({ ...options, includeUppercase: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Uppercase (A-Z)</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.includeLowercase}
            onChange={(e) => setOptions({ ...options, includeLowercase: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Lowercase (a-z)</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.includeNumbers}
            onChange={(e) => setOptions({ ...options, includeNumbers: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Numbers (0-9)</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={options.includeSymbols}
            onChange={(e) => setOptions({ ...options, includeSymbols: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Symbols (!@#$)</span>
        </label>
      </div>

      <label className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={options.excludeAmbiguous}
          onChange={(e) => setOptions({ ...options, excludeAmbiguous: e.target.checked })}
          className="mr-2"
        />
        <span className="text-sm">Exclude ambiguous (0/O, 1/I/l)</span>
      </label>

      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Generate
        </button>
        {onUsePassword && (
          <button
            onClick={handleUse}
            disabled={!password}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use This
          </button>
        )}
      </div>
    </div>
  );
}
