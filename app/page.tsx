"use client";

import Navbar from '@/components/Navbar';
import PasswordGenerator from '@/components/PasswordGenerator';
import VaultSection from '@/components/VaultSection';
import { useAuth } from '@/lib/authClient';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} logout={logout} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <PasswordGenerator />
        </div>

        {user ? (
          <VaultSection />
        ) : (
          <p className="text-center text-gray-600">
            Login or Sign up to store your generated passwords securely.
          </p>
        )}
      </main>
    </div>
  );
}
