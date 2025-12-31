
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, User, Bot } from 'lucide-react';
import { Chat } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { MenuItem, ChatMessage } from '../types';
import { createWaiterChat } from '../geminiService';

interface WaiterChatProps {
  menuItems: MenuItem[];
}

const WaiterChat: React.FC<WaiterChatProps> = ({ menuItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '你好! I am your AI waiter. Any questions?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuItems.length > 0) {
      chatSessionRef.current = createWaiterChat(menuItems);
    }
  }, [menuItems]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;
    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsTyping(true);
    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm not sure." }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to AI." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!menuItems.length) return null;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl transition-all ${isOpen ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'}`}>
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
      <div className={`fixed bottom-24 right-4 z-40 w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border transition-all ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`} style={{ maxHeight: '60vh' }}>
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white rounded-t-2xl">
          <div className="flex items-center gap-2"><Bot size={18} /> <span className="font-bold">AI Waiter</span></div>
          <button onClick={() => setIsOpen(false)}><Minimize2 size={18} /></button>
        </div>
        <div className="p-4 overflow-y-auto bg-slate-50 min-h-[300px] max-h-[400px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800'}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t flex gap-2">
          <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask me..." className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none" />
          <button onClick={handleSend} className="p-2 bg-blue-600 text-white rounded-full"><Send size={18} /></button>
        </div>
      </div>
    </>
  );
};

export default WaiterChat;
