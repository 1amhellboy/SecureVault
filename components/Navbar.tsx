"use client";

import Link from 'next/link';

interface NavbarProps {
	user: { userId: number; email: string } | null;
	logout: () => void;
}

export default function Navbar({ user, logout }: NavbarProps) {
	return (
		<header className="w-full bg-white shadow-sm">
			<div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
				<Link href="/" className="text-xl font-semibold text-gray-900 ">
					<span role="img" aria-label="lock">🔒</span> SecureVault
				</Link>

				<nav className="flex items-center gap-3">
					{user ? (
						<button
							onClick={logout}
							className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition"
						>
							Logout
						</button>
					) : (
						<div className="flex items-center gap-2">
							<Link
								href="/auth/login"
								className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
							>
								Login
							</Link>
							<Link
								href="/auth/signup"
								className="px-3 py-2 rounded-md  dark:border-gray-600 text-gray-800 bg-gray-100 hover:bg-gray-50 dark:hover:bg-gray-200 transition"
							>
								Sign Up
							</Link>
						</div>
					)}
				</nav>
			</div>
		</header>
	);
}


