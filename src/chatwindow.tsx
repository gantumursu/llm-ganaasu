import React, { useState, useEffect } from 'react';
import './App.css';
import './cs16.css';
import ArialPixelFont from './assets/ArialPixel.ttf';
import pb from './lib/pocketbase';

interface Chat {
  id: string;
  title: string;
  created?: string;
  updated?: string;
}

interface Message {
  id: string;
  chat_id: string;
  text: string;
  sender: 'user' | 'bot';
  created?: string;
}

interface Note {
  id?: string;
  chat_id: string;
  content: string;
}

const ChatWindow: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [reasoning, setReasoning] = useState('AI reasoning will appear here...');
  const [notes, setNotes] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState<string>('');

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages and notes when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
      loadNotes(currentChatId);
      
      // Subscribe to real-time updates for messages
      pb.collection('messages').subscribe('*', (e) => {
        console.log('Real-time message event:', e.action, e.record);
        
        // Only update if it's for the current chat
        if (e.record.chat_id === currentChatId) {
          if (e.action === 'create') {
            // Add new message to the list
            setMessages(prev => {
              // Check if message already exists
              const exists = prev.some(msg => msg.id === e.record.id);
              if (!exists) {
                return [...prev, e.record as Message];
              }
              return prev;
            });
          } else if (e.action === 'update') {
            // Update existing message
            setMessages(prev => prev.map(msg => 
              msg.id === e.record.id ? e.record as Message : msg
            ));
          } else if (e.action === 'delete') {
            // Remove deleted message
            setMessages(prev => prev.filter(msg => msg.id !== e.record.id));
          }
        }
      });
      
      // Cleanup subscription when chat changes or component unmounts
      return () => {
        pb.collection('messages').unsubscribe('*');
      };
    }
  }, [currentChatId]);

  // Auto-save notes with debounce
  useEffect(() => {
    if (currentChatId && notes !== '') {
      const timeoutId = setTimeout(() => {
        saveNotes();
      }, 1000); // Save after 1 second of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [notes]);

  const loadChats = async () => {
    try {
      console.log('Loading chats from PocketBase...');
      const records = await pb.collection('chats').getFullList<Chat>({
        sort: '-created',
      });
      console.log('Chats loaded:', records);
      setChats(records);
      
      // Select first chat if available
      if (records.length > 0 && !currentChatId) {
        setCurrentChatId(records[0].id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      alert(`Error connecting to PocketBase: ${error}. Make sure PocketBase is running at http://127.0.0.1:8090`);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      console.log('Loading messages for chat:', chatId);
      console.log('Using filter:', `chat_id = "${chatId}"`);
      const records = await pb.collection('messages').getFullList<Message>({
        filter: `chat_id = "${chatId}"`,
        sort: 'created',
      });
      console.log('Messages loaded:', records);
      setMessages(records);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      console.error('Error details:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      // If collection doesn't exist or is empty, just set empty messages
      setMessages([]);
    }
  };

  const loadNotes = async (chatId: string) => {
    try {
      console.log('Loading notes for chat:', chatId);
      const records = await pb.collection('notes').getFullList<Note>({
        filter: `chat_id = "${chatId}"`,
      });
      console.log('Notes loaded:', records);
      
      if (records.length > 0) {
        setNotes(records[0].content);
        setCurrentNoteId(records[0].id || '');
      } else {
        setNotes('');
        setCurrentNoteId('');
      }
    } catch (error: any) {
      console.error('Error loading notes:', error);
      console.error('Error details:', error?.response);
      // If collection doesn't exist or is empty, just set empty notes
      setNotes('');
      setCurrentNoteId('');
    }
  };

  const saveNotes = async () => {
    try {
      if (currentNoteId) {
        // Update existing note
        await pb.collection('notes').update(currentNoteId, {
          content: notes,
        });
      } else {
        // Create new note
        const record = await pb.collection('notes').create({
          chat_id: currentChatId,
          content: notes,
        });
        setCurrentNoteId(record.id);
      }
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  const createNewChat = async () => {
    try {
      console.log('Creating new chat...');
      const record = await pb.collection('chats').create<Chat>({
        title: `Chat ${new Date().toLocaleString()}`,
      });
      
      console.log('Chat created:', record);
      setChats([record, ...chats]);
      setCurrentChatId(record.id);
      setMessages([]);
      setNotes('');
      setCurrentNoteId('');
    } catch (error) {
      console.error('Error creating chat:', error);
      alert(`Error creating chat: ${error}`);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() && currentChatId) {
      try {
        const userText = inputText;
        setInputText('');
        
        // Create user message in PocketBase
        // Real-time subscription will automatically add it to the UI
        await pb.collection('messages').create<Message>({
          chat_id: currentChatId,
          text: userText,
          sender: 'user',
        });
        
        // Show "thinking" indicator
        setReasoning('AI is thinking...');
        
        // Call the AI API
        try {
          const response = await fetch('http://localhost:5000/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userText,
              chat_id: currentChatId,
              max_history: 10
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('AI Response received:', data);
          
          // Get reasoning
          const reasoningResponse = await fetch('http://localhost:5000/reasoning', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: userText,
            }),
          });
          
          if (reasoningResponse.ok) {
            const reasoningData = await reasoningResponse.json();
            setReasoning(reasoningData.reasoning);
          }
          
          // No need to reload - real-time subscription will update automatically!
          
        } catch (apiError) {
          console.error('Error calling AI API:', apiError);
          setReasoning('Error: Could not connect to AI server. Make sure it is running.');
          
          // Fallback message
          const errorMessage = await pb.collection('messages').create<Message>({
            chat_id: currentChatId,
            text: 'Sorry, I could not process your request. Please make sure the AI server is running.',
            sender: 'bot',
          });
          
          setMessages(prev => [...prev, errorMessage]);
        }
        
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  return (
    <>
      <style>
        {`
          @font-face {
            font-family: 'ArialPixel';
            src: url(${ArialPixelFont}) format('truetype');
            font-weight: normal;
            font-style: normal;
          }
        `}
      </style>
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        overflow: 'hidden',
        fontFamily: 'ArialPixel, monospace'
      }}>
      {/* Left sidebar - Previous Chats */}
      <div style={{ 
        width: '20%', 
        borderRight: '2px solid var(--secondary-bg)',
        padding: '10px',
        overflowY: 'auto',
        backgroundColor: 'var(--bg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, borderBottom: '2px solid var(--secondary-bg)', paddingBottom: '5px', flex: 1 }}>
            Previous Chats
          </h3>
          <button
            onClick={createNewChat}
            style={{
              padding: '5px 10px',
              border: '2px solid var(--secondary-bg)',
              backgroundColor: 'var(--secondary-bg)',
              cursor: 'pointer',
              fontFamily: 'ArialPixel, monospace',
              fontSize: '12px',
              color: 'white',
              marginLeft: '10px'
            }}
          >
            [+]
          </button>
        </div>
        <div>
          {chats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              style={{
                padding: '10px',
                margin: '5px 0',
                border: '1px solid var(--secondary-bg)',
                backgroundColor: currentChatId === chat.id ? 'var(--accent)' : 'var(--secondary-bg)',
                cursor: 'pointer',
                color: 'white'
              }}
              className="window"
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Center chat area - LLM Chat */}
      <div style={{ 
        width: '63.33%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--bg)'
      }}>
        {/* Messages area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '15px',
          backgroundColor: 'var(--secondary-bg)',
          margin: '10px',
          border: '2px solid var(--secondary-bg)'
        }}>
          {messages.map((message) => (
            <div 
              key={message.id}
              style={{
                marginBottom: '15px',
                padding: '10px',
                border: '1px solid var(--secondary-bg)',
                backgroundColor: message.sender === 'user' ? 'var(--bg)' : 'var(--secondary-bg)',
                color: 'white'
              }}
            >
              <strong>{message.sender === 'user' ? 'You' : 'AI'}:</strong> {message.text}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div style={{ 
          padding: '10px',
          borderTop: '2px solid var(--secondary-bg)',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '8px',
              border: '2px solid var(--secondary-bg)',
              backgroundColor: 'var(--secondary-bg)',
              fontFamily: 'ArialPixel, monospace',
              fontSize: '16px',
              color: 'white'
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '8px 20px',
              border: '2px solid var(--secondary-bg)',
              backgroundColor: 'var(--bg)',
              cursor: 'pointer',
              fontFamily: 'ArialPixel, monospace',
              fontWeight: 'bold',
              fontSize: '16px',
              color: 'white'
            }}
          >
            [Send]
          </button>
        </div>
      </div>

      {/* Right sidebar - Reasoning and Notes */}
      <div style={{ 
        width: '16.67%', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: '2px solid var(--secondary-bg)'
      }}>
        {/* Reasoning - Top half */}
        <div style={{ 
          flex: 1, 
          padding: '10px',
          borderBottom: '2px solid var(--secondary-bg)',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ 
            margin: '0 0 10px 0',
            borderBottom: '2px solid var(--secondary-bg)',
            paddingBottom: '5px',
            color: 'white'
          }}>
            Reasoning
          </h4>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--secondary-bg)',
            border: '1px solid var(--secondary-bg)',
            padding: '8px',
            fontSize: '16px',
            color: 'white'
          }}>
            {reasoning}
          </div>
        </div>

        {/* Notes - Bottom half */}
        <div style={{ 
          flex: 1, 
          padding: '10px',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ 
            margin: '0 0 10px 0',
            borderBottom: '2px solid var(--secondary-bg)',
            paddingBottom: '5px',
            color: 'white'
          }}>
            Notes
          </h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Your notes will be auto-saved..."
            style={{
              flex: 1,
              backgroundColor: 'var(--secondary-bg)',
              border: '1px solid var(--secondary-bg)',
              padding: '8px',
              fontSize: '16px',
              fontFamily: 'ArialPixel, monospace',
              resize: 'none',
              color: 'white'
            }}
          />
        </div>
      </div>
      </div>
    </>
  );
};

export default ChatWindow;
