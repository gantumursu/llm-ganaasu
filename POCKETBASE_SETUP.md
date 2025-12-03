# PocketBase Setup Guide

## 1. Download PocketBase

1. Go to https://pocketbase.io/docs/
2. Download PocketBase for Windows
3. Extract the executable to a folder (e.g., `C:\pocketbase\`)

## 2. Run PocketBase Server

Open PowerShell and run:

```powershell
cd C:\pocketbase
.\pocketbase.exe serve
```

The server will start at `http://127.0.0.1:8090`

## 3. Create Collections

1. Open http://127.0.0.1:8090/_/ in your browser
2. Create an admin account
3. Create the following collections:

### Collection: `chats`

Fields:

- `title` (text, required)

### Collection: `messages`

Fields:

- `chat_id` (relation to chats, required)
- `text` (text, required)
- `sender` (select: user, bot, required)

### Collection: `notes`

Fields:

- `chat_id` (relation to chats, required)
- `content` (text)

## 4. Set API Rules

For each collection, go to "API Rules" and set:

- List/View: Allow anyone (or set authentication)
- Create/Update/Delete: Allow anyone (or set authentication)

For development, you can allow all operations without authentication.

## 5. Install PocketBase SDK

Run in your project:

```bash
npm install pocketbase
```

## 6. Update Your App

The PocketBase client is configured in `src/lib/pocketbase.ts`

Make sure the URL matches your PocketBase server (default: http://127.0.0.1:8090)
