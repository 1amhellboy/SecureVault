# SecureVault - Password Manager MVP

## Overview
SecureVault is a privacy-first password manager web application built with Next.js 14, TypeScript, and PostgreSQL. It features client-side encryption, secure vault storage, and an advanced password generator.

**Current State:** Fully functional MVP with all core features implemented and tested.

**Last Updated:** October 5, 2025

## Recent Changes
- **2025-10-05:** Complete MVP implementation with Next.js 14, TypeScript, PostgreSQL
- Database schema created with users and vault_items tables
- All authentication, encryption, and vault management features implemented
- Clean, responsive UI with TailwindCSS

## Project Architecture

### Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL (Replit built-in)
- **Encryption:** crypto-js (AES client-side encryption)
- **Authentication:** bcrypt + JWT

### Directory Structure
```
├── app/
│   ├── api/
│   │   ├── auth/          # Signup, login, logout endpoints
│   │   ├── vault/         # CRUD operations for vault items
│   │   └── init/          # Database initialization
│   ├── auth/              # Signup and login pages
│   ├── vault/             # Main vault dashboard
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── PasswordGenerator.tsx  # Password generation UI
│   └── VaultItem.tsx          # Individual vault item display
├── lib/
│   ├── db.ts              # PostgreSQL connection and schema
│   ├── crypto.ts          # Client-side encryption utilities
│   ├── auth.ts            # JWT token management
│   └── passwordGenerator.ts   # Password generation logic
└── package.json
```

### Key Features Implemented

1. **Client-Side Encryption**
   - All sensitive data (username, password, url, notes) encrypted with crypto-js AES
   - Encryption happens in browser before data leaves the client
   - Master password never sent to server
   - Database stores only encrypted blobs

2. **Authentication System**
   - Email/password signup and login
   - Passwords hashed with bcrypt (10 rounds)
   - JWT-based session management (7-day expiration)
   - HTTP-only cookies for token storage

3. **Password Generator**
   - Adjustable length (8-32 characters)
   - Customizable character sets (uppercase, lowercase, numbers, symbols)
   - Option to exclude ambiguous characters (O/0, I/1/l)
   - Cryptographically secure random generation

4. **Secure Vault**
   - CRUD operations for password entries
   - Each entry stores: title, username, password, url, notes
   - Search functionality (filters by title and username)
   - One-click copy with 15-second auto-clear
   - Show/hide password toggle

5. **Responsive UI**
   - Clean, minimal design with TailwindCSS
   - Mobile-responsive layout
   - Modal-based add/edit forms
   - Real-time search filtering

## Database Schema

### users table
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR UNIQUE)
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### vault_items table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (INTEGER REFERENCES users)
- `title` (VARCHAR)
- `encrypted_username` (TEXT)
- `encrypted_password` (TEXT)
- `encrypted_url` (TEXT)
- `encrypted_notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security Notes

**Client-Side Encryption:**
We chose crypto-js for client-side encryption because:
1. Lightweight and battle-tested AES implementation
2. Works seamlessly in browser environments
3. Simple API for encrypt/decrypt operations
4. No server-side crypto dependencies needed

All encryption/decryption happens exclusively on the client side. The server and database never see plaintext passwords. The master password is used as the encryption key and is never transmitted to the server.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - JWT signing secret

## Running the Application

```bash
npm install
npm run dev
```

The app runs on http://localhost:5000 

## Database Initialization
The database schema is automatically created on first API call to `/api/init`, which happens when the server starts.

## User Flow
1. User visits homepage and clicks "Get Started"
2. User creates account with email/password
3. User sets master password for encryption
4. User can generate passwords and save them to vault
5. User can search, view, edit, and delete vault items
6. Clicking "Copy" on a password auto-clears clipboard after 15 seconds
