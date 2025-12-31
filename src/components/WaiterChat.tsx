import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, User, Bot } from 'lucide-react';
import { Chat } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { MenuItem, ChatMessage } from '../types';
import { createWaiterChat } from '../services/geminiService';

interface WaiterChatProps {
  menuItems: MenuItem[];
}

const WaiterChat: React.FC<WaiterChatProps> = ({ menuItems }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: '你好! I am your AI waiter. Any questions about the menu?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Use a ref to store the chat session so it persists across re-renders
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat when menu items are available
  useEffect(() => {
    if (menuItems.length > 0) {
      chatSessionRef.current = createWaiterChat(menuItems);
      // Reset messages if a new menu is loaded
      setMessages([{ role: 'model', text: '你好! I am your AI waiter. Any questions about the menu?' }]);
    }
  }, [menuItems]);

  // Auto-scroll to bottom
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
      const text = response.text || "Sorry, I didn't catch that.";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting to the kitchen right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!menuItems || menuItems.length === 0) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center justify-center
          ${isOpen ? 'bg-gray-200 text-gray-600 rotate-90 scale-90' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:scale-110'}
        `}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-4 z-40 w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right
          ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10 pointer-events-none'}
        `}
        style={{ maxHeight: '60vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-full">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm">AI Waiter</h3>
              <p className="text-xs text-blue-100">Ask about ingredients, taste...</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
            <Minimize2 size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 min-h-[300px] max-h-[400px]">
          <div className="space-y-5">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}
                  `}
                >
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-orange-500 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                    }
                  `}
                >
                  <ReactMarkdown
                    components={{
                      p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                      ul: ({children}) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                      li: ({children}) => <li className="pl-1">{children}</li>,
                      strong: ({children}) => <span className="font-bold">{children}</span>,
                      a: ({href, children}) => <a href={href} target="_blank" rel="noreferrer" className="underline opacity-90 hover:opacity-100">{children}</a>
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="flex gap-1 bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about the food..."
            className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default WaiterChat;