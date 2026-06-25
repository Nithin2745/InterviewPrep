'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getProblemById } from '@/lib/data/topics';
import { Bot, X, Send, Sparkles, MessageSquare, Terminal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function PrepBot() {
  const {
    activeCode,
    currentProblemId,
    settings,
    completed,
    streak,
    userEmail,
    isLoggedIn
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi there! I'm **PrepBot**, your AI coding companion.\n\nI can analyze the code in your workspace, help you debug compilation errors, explain DSA concepts, or assist you with this website. I'm strictly trained to only discuss programming and DSA.\n\n*How can I help you today?*"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeProblem = currentProblemId ? getProblemById(currentProblemId) : null;
  const activeLanguage = settings.language;

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Parse markdown code blocks and inline backticks
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);
        return (
          <div key={index} className="my-2 border border-[var(--border)] rounded-lg overflow-hidden font-mono text-[11px]">
            {lang && (
              <div className="bg-[var(--card2)] px-3 py-1 text-[9px] text-[var(--muted)] border-b border-[var(--border)] uppercase font-extrabold tracking-wider">
                {lang}
              </div>
            )}
            <pre className="p-3 bg-[var(--code-bg)] text-[var(--text)] overflow-x-auto whitespace-pre">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Handle inline backticks and double asterisk bold text
      const inlineParts = part.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      return (
        <p key={index} className="whitespace-pre-wrap leading-relaxed text-xs mb-1">
          {inlineParts.map((sub, i) => {
            if (sub.startsWith('`') && sub.endsWith('`')) {
              return (
                <code key={i} className="px-1.5 py-0.5 bg-[var(--code-bg)] text-[var(--purple)] border border-[var(--border)] rounded font-mono text-[11px] font-semibold">
                  {sub.slice(1, -1)}
                </code>
              );
            }
            if (sub.startsWith('**') && sub.endsWith('**')) {
              return (
                <strong key={i} className="font-extrabold">
                  {sub.slice(2, -2)}
                </strong>
              );
            }
            return sub;
          })}
        </p>
      );
    });
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    if (!textToSend) {
      setInputValue('');
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      // Append the latest user query to history context
      history.push({
        role: 'user',
        content: query
      });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          activeCode,
          activeLanguage,
          currentProblem: activeProblem ? {
            id: activeProblem.id,
            name: activeProblem.name,
            diff: activeProblem.diff,
            pattern: activeProblem.pattern,
            hint: activeProblem.hint
          } : null,
          profile: {
            isLoggedIn,
            userEmail,
            completed,
            streak
          },
          terminalLogs: [] // we can extend this if needed
        })
      });

      if (!res.ok) throw new Error('Failed to fetch response');
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content || "I couldn't generate a response."
        }
      ]);
    } catch (err) {
      console.error(err);
      toast.error('Could not connect to PrepBot');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "❌ **Connection Error:** I'm having trouble reaching the servers. Please check your internet connection or try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "🔍 Check code bugs", prompt: "Can you analyze the code in my editor and identify any syntax errors or logic mistakes?" },
    { label: "💡 Need problem hint", prompt: activeProblem ? `Can you give me an algorithm hint for the problem "${activeProblem.name}" without spoiling the code?` : "Can you help me get a hint for the active DSA problem?" },
    { label: "⏱️ Time complexity", prompt: "What is the time and space complexity of the code currently in my editor?" },
    { label: "🔥 My streak info", prompt: "How does the streak tracking work and what is my current progress?" }
  ];

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi there! I'm **PrepBot**, your AI coding companion.\n\nI can analyze the code in your workspace, help you debug compilation errors, explain DSA concepts, or assist you with this website. I'm strictly trained to only discuss programming and DSA.\n\n*How can I help you today?*"
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center animate-bounce-slow"
        style={{
          background: 'var(--grad)',
          color: 'var(--accent-text)',
          boxShadow: 'var(--glow)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
        title="Ask PrepBot"
      >
        {isOpen ? <X size={22} className="rotate-90 transition-transform duration-300" /> : <Bot size={22} className="transition-transform duration-300" />}
      </button>

      {/* Chat Drawer Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] z-50 flex flex-col bg-[var(--card)]/95 border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {/* Header */}
          <div className="relative bg-[var(--card2)] border-b border-[var(--border)] p-4 shrink-0 flex items-center justify-between">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--grad)' }} />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[var(--purple)] flex items-center justify-center text-white font-extrabold shadow-md relative overflow-hidden">
                <Bot size={16} />
                <div className="absolute inset-0 bg-white/10 opacity-30 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-black flex items-center gap-1 leading-none text-[var(--text)] uppercase tracking-wider">
                  PrepBot <Sparkles size={12} className="text-[var(--amber)] animate-pulse" />
                </h3>
                <span className="text-[10px] text-[var(--muted)] font-medium leading-none block mt-0.5">
                  AI Coding Companion
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)] transition-colors"
                title="Reset conversation"
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Context bar showing synced problem & code */}
          <div className="bg-[var(--code-bg)] px-4 py-2 border-b border-[var(--border)] text-[9px] flex items-center justify-between text-[var(--muted)] font-mono select-none">
            <span className="truncate max-w-[50%]">
              📋 Problem: <b className="text-[var(--accent)]">{activeProblem ? activeProblem.name : 'None selected'}</b>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-ping" />
              Editor: <b className="text-[var(--purple)] uppercase">{activeLanguage} ({activeCode ? `${activeCode.split('\n').length} lines` : 'empty'})</b>
            </span>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-[var(--card2)] border border-[var(--border)] flex items-center justify-center shrink-0 text-xs">
                    🤖
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'rounded-tr-sm shadow-md'
                      : 'bg-[var(--card2)] border border-[var(--border)] text-[var(--text)] rounded-tl-sm'
                  }`}
                  style={msg.role === 'user' ? { background: 'var(--accent)', color: 'var(--accent-text)' } : {}}
                >
                  {renderMessageContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto items-center">
                <div className="w-6 h-6 rounded-lg bg-[var(--card2)] border border-[var(--border)] flex items-center justify-center shrink-0 text-xs">
                  🤖
                </div>
                <div className="bg-[var(--card2)] border border-[var(--border)] p-3.5 rounded-2xl rounded-tl-sm text-xs text-[var(--muted)] flex items-center gap-2 font-medium">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  PrepBot is analyzing editor context...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions panel (scrollable horizontally if needed) */}
          <div className="px-4 py-2 bg-[var(--card2)]/50 border-t border-[var(--border)] flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[10px] font-bold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all shrink-0 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* User input box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[var(--card2)] border-t border-[var(--border)] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              placeholder={activeProblem ? `Ask PrepBot about "${activeProblem.name}"...` : "Ask PrepBot a coding / DSA question..."}
              className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 shrink-0"
              style={{
                background: 'var(--grad)',
                color: 'var(--accent-text)',
                boxShadow: inputValue.trim() ? 'var(--glow)' : 'none'
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
