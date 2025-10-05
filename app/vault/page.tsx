'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasswordGenerator from '@/components/PasswordGenerator';
import VaultItem from '@/components/VaultItem';
import { encryptData, decryptData } from '@/lib/crypto';

interface VaultItemType {
  id: number;
  title: string;
  encrypted_username?: string;
  encrypted_password: string;
  encrypted_url?: string;
  encrypted_notes?: string;
}

export default function VaultPage() {
  const router = useRouter();
  const [items, setItems] = useState<VaultItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItemType | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterPasswordPrompt, setShowMasterPasswordPrompt] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

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

  const handleSetMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword.length >= 8) {
      setShowMasterPasswordPrompt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const encryptedData = {
        title: formData.title,
        encryptedUsername: formData.username ? encryptData(formData.username, masterPassword) : '',
        encryptedPassword: encryptData(formData.password, masterPassword),
        encryptedUrl: formData.url ? encryptData(formData.url, masterPassword) : '',
        encryptedNotes: formData.notes ? encryptData(formData.notes, masterPassword) : '',
      };

      const url = editingItem ? `/api/vault/${editingItem.id}` : '/api/vault';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encryptedData),
      });

      if (res.ok) {
        await loadVaultItems();
        setShowAddModal(false);
        setEditingItem(null);
        setFormData({ title: '', username: '', password: '', url: '', notes: '' });
      }
    } catch (error) {
      console.error('Error saving vault item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: VaultItemType) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      username: item.encrypted_username ? decryptData(item.encrypted_username, masterPassword) : '',
      password: item.encrypted_password ? decryptData(item.encrypted_password, masterPassword) : '',
      url: item.encrypted_url ? decryptData(item.encrypted_url, masterPassword) : '',
      notes: item.encrypted_notes ? decryptData(item.encrypted_notes, masterPassword) : '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/vault/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadVaultItems();
      }
    } catch (error) {
      console.error('Error deleting vault item:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    const decryptedUsername = item.encrypted_username ? decryptData(item.encrypted_username, masterPassword) : '';
    return (
      item.title.toLowerCase().includes(query) ||
      decryptedUsername.toLowerCase().includes(query)
    );
  });

  if (showMasterPasswordPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Set Master Password</h2>
          <p className="text-gray-600 mb-6">
            This password will encrypt all your vault data. Remember it carefully - it cannot be recovered!
          </p>
          <form onSubmit={handleSetMasterPassword}>
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="Enter master password (min. 8 chars)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={8}
              required
            />
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🔐 SecureVault</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Logout
          </button>
        </div>

        <PasswordGenerator
          onUsePassword={(password) => {
            setFormData({ ...formData, password });
            setShowAddModal(true);
          }}
        />

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or username..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ title: '', username: '', password: '', url: '', notes: '' });
                setShowAddModal(true);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              + Add Item
            </button>
          </div>

          <div className="grid gap-4">
            {filteredItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {searchQuery ? 'No items found' : 'No items yet. Add your first password!'}
              </p>
            ) : (
              filteredItems.map((item) => (
                <VaultItem
                  key={item.id}
                  item={item}
                  masterPassword={masterPassword}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  decryptData={decryptData}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Gmail, Facebook"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username / Email
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                    setFormData({ title: '', username: '', password: '', url: '', notes: '' });
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
