"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import VaultItem from '@/components/VaultItem';
import { decryptData } from '@/lib/crypto';

interface VaultItemType {
	 id: number;
	 encrypted_title: string;
	 encrypted_username?: string;
	 encrypted_password: string;
	 encrypted_url?: string;
	 encrypted_notes?: string;
}

export default function VaultSection() {
	const router = useRouter();
	const [items, setItems] = useState<VaultItemType[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [masterPassword, setMasterPassword] = useState('');
	const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(true);

	useEffect(() => {
		if (masterPassword && !showMasterPasswordPrompt) {
			loadVaultItems();
		}
	}, [masterPassword, showMasterPasswordPrompt]);

	const loadVaultItems = async () => {
		try {
			const res = await fetch('/api/vault');
			if (res.status === 401) {
				router.push('/auth/login');
				return;
			}
			const data = await res.json();
			setItems(data.items || []);
		} catch (error) {
			console.error('Error loading vault items:', error);
		}
	};

	if (showMasterPasswordPrompt) {
		return (
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<h2 className="text-xl font-semibold mb-2">Unlock your vault</h2>
				<p className="text-gray-600 mb-4">Enter your master password to decrypt items.</p>
				<div className="flex gap-2">
					<input
						type="password"
						value={masterPassword}
						onChange={(e) => setMasterPassword(e.target.value)}
						placeholder="Master password"
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						minLength={8}
						required
					/>
					<button
						onClick={() => masterPassword.length >= 8 && setShowMasterPasswordPrompt(false)}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
					>
						Unlock
					</button>
				</div>
			</div>
		);
	}

	const filteredItems = items.filter(item => {
		const query = searchQuery.toLowerCase();
		const decryptedTitle = item.encrypted_title ? decryptData(item.encrypted_title, masterPassword) : '';
		const decryptedUsername = item.encrypted_username ? decryptData(item.encrypted_username, masterPassword) : '';
		return (
			decryptedTitle.toLowerCase().includes(query) ||
			decryptedUsername.toLowerCase().includes(query)
		);
	});

	return (
		<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">Your Vault</h2>
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search by title or username..."
					className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			<div className="grid gap-4">
				{filteredItems.length === 0 ? (
					<p className="text-center text-gray-500 py-4">
						{searchQuery ? 'No items found' : 'No items yet.'}
					</p>
				) : (
					filteredItems.map((item) => (
						<VaultItem
							key={item.id}
							item={item}
							masterPassword={masterPassword}
							onEdit={() => {}}
							onDelete={() => {}}
							decryptData={decryptData}
						/>
					))
				)}
			</div>
		</div>
	);
}


