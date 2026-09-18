import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minus, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  User,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

export const ChatbotWidget: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showProactive, setShowProactive] = useState<boolean>(false);
  const [hasOpenedBefore, setHasOpenedBefore] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionId] = useState<string>(() => 'lpu_chat_' + Math.random().toString(36).substring(2, 9));

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hey there! 👋 I'm your **LPU Campus Assistant**. I have direct access to our 600-acre digital twin's real-time IoT sensors and scheduling database.\n\nAsk me anything about classroom availability, open parking bays, crowd rush, or today's flagship campus events!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        '🛰️ Show 3D Aerial Masterplan & Zones',
        'Is Block 34 (CSE) free right now?',
        'Where can I park near Uni-Mall?',
        'What events are happening today?'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isLoading]);

  // Proactive greeting popover after 3 seconds on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasOpenedBefore && !isOpen) {
        setShowProactive(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [hasOpenedBefore, isOpen]);

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setShowProactive(false);
      setHasOpenedBefore(true);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:4000/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const botMsg: Message = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        content: data.response || "Here's the latest info from our campus twin.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: data.suggestions
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('[ChatbotWidget] Error querying assistant:', err);
      const errorMsg: Message = {
        id: 'bot-err-' + Date.now(),
        role: 'assistant',
        content: "I'm having a little trouble connecting to the live campus telemetry right now. Please verify the backend server is running and try again!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-cleared',
        role: 'assistant',
        content: "Chat history refreshed! How can I help you explore LPU campus right now?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Is Block 34 (CSE) free right now?',
          'Where can I park near Uni-Mall?',
          'What events are happening today?',
          'How crowded is the Central Library?'
        ]
      }
    ]);
  };

  // Simple formatter for bold text and bullet points
  const renderFormattedContent = (content: string) => {
    return content.split('\n').map((line, lineIdx) => {
      // Bullet lines
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-blue-400 select-none">•</span>
            <span>
              {parts.map((part, partIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={partIdx} className="font-bold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                  return <em key={partIdx} className="italic text-slate-300">{part.slice(1, -1)}</em>;
                }
                return part;
              })}
            </span>
          </div>
        );
      }

      // Regular line with bold formatting
      const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
      return (
        <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx} className="font-bold">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={partIdx} className="italic text-slate-300">{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* 1. Proactive Welcome Chip (pops up on initial visit) */}
      {showProactive && !isOpen && (
        <div 
          className={`fixed bottom-24 right-6 z-40 modal-pop max-w-xs p-3 rounded-2xl border shadow-xl flex items-start gap-2.5 cursor-pointer ${
            isDarkMode ? 'bg-[#131B2E] border-blue-500/40 text-slate-200 shadow-black/40' : 'bg-white border-blue-400 text-slate-800 shadow-blue-500/10'
          }`}
          onClick={handleToggleOpen}
        >
          <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold block">👋 Exploring LPU Campus?</span>
            <span className="text-[11px] opacity-80 mt-0.5 block">Ask me about vacant rooms in Block 34, parking bays, or events!</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowProactive(false);
            }}
            className="p-1 hover:bg-slate-700/30 rounded-lg text-slate-400 hover:text-white shrink-0 ml-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Floating Circular Launcher Button with Neon Glow Aura */}
      <div className="fixed bottom-6 right-6 z-40 group">
        {/* Ambient Neon Glow Aura */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 opacity-60 blur-md group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 animate-pulse pointer-events-none"></div>

        <button
          onClick={handleToggleOpen}
          title={isOpen ? "Close Assistant" : "Ask LPU Campus Assistant"}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-600/40 flex items-center justify-center btn-tactile hover:scale-105 active:scale-95 transition-all"
          aria-label="Toggle Campus Assistant"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" />
          ) : (
            <div className="relative">
              <MessageSquare className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
              {/* Pulsing online badge dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-indigo-900"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* 3. Floating Chatbot Panel */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] max-h-[82vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border modal-pop backdrop-blur-2xl transition-all duration-200 ${
            isDarkMode
              ? 'bg-[#0E1628]/95 border-[#232E4A] shadow-black/60 text-slate-100'
              : 'bg-white/95 border-slate-300 shadow-xl text-slate-800'
          }`}
        >
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-[#141F36] to-[#0E1628] border-[#232E4A]' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50/50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30 shrink-0">
                <Bot className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0E1628]"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>LPU Campus Assistant</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    LIVE TWIN
                  </span>
                </h3>
                <p className="text-[11px] opacity-70 mt-0.5">Real-time IoT & Scheduling Telemetry</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Reset conversation"
                className="p-1.5 rounded-xl hover:bg-slate-700/20 opacity-70 hover:opacity-100 transition-all text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-xl hover:bg-slate-700/20 opacity-70 hover:opacity-100 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => {
              const isBot = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`fade-in-up flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div className={`flex items-end gap-2 max-w-[88%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Bot Avatar */}
                    {isBot && (
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Bubble Content */}
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isBot
                          ? isDarkMode
                            ? 'bg-[#131B2E] border border-[#232E4A] text-slate-200 rounded-tl-sm'
                            : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm'
                          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-sm keep-white'
                      }`}
                    >
                      {renderFormattedContent(msg.content)}

                      <span className={`text-[9px] block text-right mt-1.5 opacity-60 font-mono`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>

                  {/* Suggestion Chips attached to this bot response */}
                  {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-8 max-w-[88%]">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSendMessage(sug)}
                          disabled={isLoading}
                          className={`btn-tactile text-[10px] font-medium px-2.5 py-1 rounded-xl border text-left transition-all ${
                            isDarkMode
                              ? 'bg-[#131B2E] hover:bg-[#1C2640] border-[#232E4A] text-blue-400 hover:text-blue-300'
                              : 'bg-white hover:bg-blue-50 border-slate-200 text-blue-600 hover:border-blue-300 shadow-sm'
                          }`}
                        >
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="fade-in-up flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className={`p-3 rounded-2xl rounded-tl-sm border flex items-center gap-1.5 ${
                  isDarkMode ? 'bg-[#131B2E] border-[#232E4A]' : 'bg-slate-100 border-slate-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  <span className="text-[10px] text-slate-400 ml-1">Checking live twin...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className={`p-3 border-t shrink-0 ${
            isDarkMode ? 'bg-[#0B0F19]/80 border-[#232E4A]' : 'bg-slate-50 border-slate-200'
          }`}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about rooms, parking, crowds, events..."
                disabled={isLoading}
                className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs border focus:outline-none transition-colors shadow-inner ${
                  isDarkMode
                    ? 'bg-[#131B2E] border-[#232E4A] text-slate-100 placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="btn-tactile p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 shadow-md shadow-blue-600/30 shrink-0 transition-all keep-white"
                title="Send question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

