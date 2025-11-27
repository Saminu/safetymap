
import React, { useState, useRef, useEffect } from 'react';
import { analyzeSafetySituation } from '../services/geminiService';
import { ChatMessage, MapReport } from '../types';

interface AIChatPanelProps {
  reports: MapReport[];
}

const SAMPLE_QUESTIONS = [
  "Is Abuja to Niger state safe?",
  "Status of Lagos-Ibadan expressway?",
  "Current threats in Kaduna?",
  "Is it safe in Port Harcourt?"
];

const AIChatPanel: React.FC<AIChatPanelProps> = ({ reports }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Safety Agent online. I have access to real-time surveillance data. How can I assist?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (manualQuery?: string) => {
    const textToSend = manualQuery || query;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setIsLoading(true);

    const responseText = await analyzeSafetySituation(reports, userMsg.text);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 sm:bottom-8 left-4 z-[1000] bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-900/50 transition-all flex items-center gap-2 pr-5 group"
      >
        <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
        </div>
        <span className="font-bold tracking-wide hidden sm:inline">SAFETY AGENT</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:bottom-8 z-[1000] sm:w-96 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-lg shadow-2xl flex flex-col overflow-hidden h-[60vh] sm:h-[500px] transition-all animate-slide-up">
      {/* Header */}
      <div className="bg-neutral-800 p-3 flex justify-between items-center border-b border-neutral-700 shrink-0">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold text-white text-sm tracking-wider">SAFETY AGENT</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-3 text-sm rounded-lg whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-neutral-800 text-neutral-200 border border-neutral-700 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-neutral-800 p-3 rounded-lg rounded-bl-none border border-neutral-700 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-200"></span>
             </div>
          </div>
        )}
      </div>

      {/* Quick Questions & Input */}
      <div className="p-3 bg-neutral-800 border-t border-neutral-700 space-y-3 shrink-0">
        {/* Sample Questions - Horizontal Scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
            {SAMPLE_QUESTIONS.map((q, i) => (
                <button
                    key={i}
                    onClick={() => handleSend(q)}
                    disabled={isLoading}
                    className="whitespace-nowrap px-3 py-1 bg-neutral-700/50 hover:bg-neutral-600 border border-neutral-600 rounded-full text-[10px] text-neutral-300 transition-colors flex-shrink-0"
                >
                    {q}
                </button>
            ))}
        </div>

        <div className="flex gap-2">
            <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about safety risks..."
            className="flex-1 bg-neutral-900 border border-neutral-600 text-white text-sm rounded px-3 py-2 focus:border-blue-500 outline-none placeholder-neutral-500"
            disabled={isLoading}
            />
            <button 
            onClick={() => handleSend()}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 rounded disabled:opacity-50"
            >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
