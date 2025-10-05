import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🔐 SecureVault
          </h1>
          <p className="text-xl text-gray-600">
            Privacy-first password manager with client-side encryption
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">🔒 Client-Side Encryption</h3>
              <p className="text-sm text-gray-600">All data encrypted before leaving your browser</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">🎲 Password Generator</h3>
              <p className="text-sm text-gray-600">Generate strong, customizable passwords</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">💾 Secure Storage</h3>
              <p className="text-sm text-gray-600">Save and manage all your passwords</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">🔍 Quick Search</h3>
              <p className="text-sm text-gray-600">Find your passwords instantly</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
