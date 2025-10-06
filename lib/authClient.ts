"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import Cookies from 'js-cookie';

export interface ClientUser {
	userId: number;
	email: string;
}

function decodeJwt<T = any>(token: string): T | null {
	try {
		const payload = token.split('.')[1];
		const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
		return JSON.parse(decodeURIComponent(escape(json))) as T;
	} catch {
		return null;
	}
}

export function useAuth() {
	const [user, setUser] = useState<ClientUser | null>(null);

	useEffect(() => {
		const token = Cookies.get('auth_token');
		if (!token) {
			setUser(null);
			return;
		}
		const payload = decodeJwt<ClientUser>(token);
		if (payload && payload.userId && payload.email) {
			setUser({ userId: payload.userId, email: payload.email });
		} else {
			setUser(null);
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
		} catch {}
		Cookies.remove('auth_token');
		if (typeof window !== 'undefined') {
			window.location.reload();
		}
	}, []);

	return useMemo(() => ({ user, logout }), [user, logout]);
}


