import React, { useState } from 'react';
import './App.css';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatWindow: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([
    { id: '1', title: 'Previous Chat 1', timestamp: new Date() },
    { id: '2', title: 'Previous Chat 2', timestamp: new Date() },
    { id: '3', title: 'Previous Chat 3', timestamp: new Date() },
  ]);
  
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'bot', timestamp: new Date() },
  ]);
  
  const [inputText, setInputText] = useState('');
  const [reasoning, setReasoning] = useState('AI reasoning will appear here...');
  const [notes, setNotes] = useState('Your notes go here...');

  const handleSend = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputText('');
      
      // Simulate bot response
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: 'This is a simulated response.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }, 500);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden',
      fontFamily: 'monospace'
    }}>
      {/* Left sidebar - Previous Chats */}

      {/*
      <div class="heading">
                <div class="wrapper">
                  <div style="margin-bottom: 8px;" class="icon"></div>
                  <p style="margin-bottom: 5px;" class="text">ganaa.su</p>
                </div>
                <button class="cs-btn close"></button>
              </div>
      
      <div class="cs-tabs">
			<input class="radiotab" name="tabs" tabindex="1" type="radio" id="tabone" checked="checked">
				<label class="label" for="tabone">Links</label>
					<div class="panel" tabindex="1">
					<p>Links to all my socials and projects:</p>
					<p style="margin-top: 8px;"></p>
						<button class="cs-btn"><a href="https://www.youtube.com/@GantumurSu?sub_confirmation=1">YouTube - EN/MN</a></button>
						<button class="cs-btn"><a href="https://github.com/gantumursu">GitHub</a></button>
					<p style="margin-top: 7px;"></p>
						<button class="cs-btn"><a href="https://project-4arr1.vercel.app/paste">Paste</a></button>
					<p style="margin-top: 7px;"></p>
						<button class="cs-btn"><a href="https://instagram.com/ganaa.su">Instagram</a></button>
					  </div>*/}


      <div style={{ 
        width: '20%', 
        borderRight: '2px solid #000',
        padding: '10px',
        overflowY: 'auto',
        backgroundColor: '#c0c0c0'
      }}>
        <h3 style={{ marginTop: 0, borderBottom: '2px solid #000', paddingBottom: '5px' }}>
          Previous Chats
        </h3>
        <div>
          {chats.map((chat) => (
            <div 
              key={chat.id}
              style={{
                padding: '10px',
                margin: '5px 0',
                border: '1px solid #000',
                backgroundColor: '#fff',
                cursor: 'pointer'
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
        backgroundColor: '#c0c0c0'
      }}>
        {/* Messages area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '15px',
          backgroundColor: '#fff',
          margin: '10px',
          border: '2px solid #000'
        }}>
          {messages.map((message) => (
            <div 
              key={message.id}
              style={{
                marginBottom: '15px',
                padding: '10px',
                border: '1px solid #000',
                backgroundColor: message.sender === 'user' ? '#e0e0e0' : '#fff',
              }}
            >
              <strong>{message.sender === 'user' ? 'You' : 'AI'}:</strong> {message.text}
            </div>
          ))}
        </div>

        {/* Input area */}
        <div style={{ 
          padding: '10px',
          borderTop: '2px solid #000',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '8px',
              border: '2px solid #000',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}
          />
          <button
            onClick={handleSend}
            style={{
              padding: '8px 20px',
              border: '2px solid #000',
              backgroundColor: '#c0c0c0',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: 'bold'
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
        borderLeft: '2px solid #000'
      }}>
        {/* Reasoning - Top half */}
        <div style={{ 
          flex: 1, 
          padding: '10px',
          borderBottom: '2px solid #000',
          backgroundColor: '#c0c0c0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ 
            margin: '0 0 10px 0',
            borderBottom: '2px solid #000',
            paddingBottom: '5px'
          }}>
            Reasoning
          </h4>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#fff',
            border: '1px solid #000',
            padding: '8px',
            fontSize: '12px'
          }}>
            {reasoning}
          </div>
        </div>

        {/* Notes - Bottom half */}
        <div style={{ 
          flex: 1, 
          padding: '10px',
          backgroundColor: '#c0c0c0',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h4 style={{ 
            margin: '0 0 10px 0',
            borderBottom: '2px solid #000',
            paddingBottom: '5px'
          }}>
            Notes
          </h4>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#fff',
              border: '1px solid #000',
              padding: '8px',
              fontSize: '12px',
              fontFamily: 'monospace',
              resize: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
