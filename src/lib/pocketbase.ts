import PocketBase from 'pocketbase';

// Initialize PocketBase client
// Update this URL to match your PocketBase server URL
const pb = new PocketBase('http://127.0.0.1:8090');

// Enable auto cancellation for duplicated requests
pb.autoCancellation(false);

export default pb;

// Type definitions for your collections
export interface Chat {
  id: string;
  title: string;
  created: string;
  updated: string;
}

export interface Message {
  id: string;
  chat_id: string;
  text: string;
  sender: 'user' | 'bot';
  created: string;
  updated: string;
}

export interface Note {
  id: string;
  chat_id: string;
  content: string;
  created: string;
  updated: string;
}
