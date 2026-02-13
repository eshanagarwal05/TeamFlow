
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { User, ScheduleEvent } from '../types';

interface GeminiAssistantProps {
  users: User[];
  schedule: ScheduleEvent[];
  onAddEvents: (events: ScheduleEvent[]) => void;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ users, schedule, onAddEvents }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response, loading]);

  const handleSmartAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const userQuery = query;
    setQuery('');

    try {
      // Use the Pro model for high-reasoning tasks as requested
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        You are "TeamFlow Intelligence", an advanced AI powered by Gemini 3 Pro.
        You perform deep reasoning and complex planning for team scheduling.
        
        Team Members: ${JSON.stringify(users.map(u => ({ id: u.id, name: u.name, role: u.role })))}
        Current Full Schedule: ${JSON.stringify(schedule)}
        
        Capabilities:
        1. Conflict Resolution: Identify when multiple people are busy.
        2. Optimization: Suggest better times for meetings based on existing gaps.
        3. Automated Edits: If asked to add/shift events, provide a JSON block.
        
        Output:
        - Provide a thoughtful analysis first.
        - If scheduling changes are needed, append a JSON block at the end:
        \`\`\`json
        [{"eventName": "...", "userId": "...", "dayOfWeek": "Monday", "startTime": 1400, "endTime": 1500}]
        \`\`\`
        Use 24-hour format (HHMM). Only suggest users that actually exist in the provided team list.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: userQuery,
        config: {
          systemInstruction,
          // Deep thinking budget enabled for maximum reasoning quality
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });

      setResponse(result.text);

    } catch (err: any) {
      setResponse(`Communication with TeamFlow Intelligence restricted: ${err.message || 'Unknown error'}. Please verify your API key access.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 group transition-all transform active:scale-95 border border-white/20"
        >
          <div className="relative">
            <svg className="w-6 h-6 animate-pulse group-hover:animate-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-indigo-600"></div>
          </div>
          <span className="font-black text-[11px] uppercase tracking-[0.2em] pr-1">Intelligence</span>
        </button>
      ) : (
        <div className="bg-white w-80 md:w-[400px] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500 max-h-[600px]">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <span className="font-black text-sm uppercase tracking-tighter block leading-none">Gemini 3 Pro</span>
                <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest">Reasoning Active</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/50 space-y-4">
            {response ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="prose prose-sm text-slate-700">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">{response.replace(/```json[\s\S]*?```/g, '')}</p>
                </div>
                {response.includes('```json') && (
                   <div className="mt-4 p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 border border-indigo-500 flex flex-col gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">AI Proposed Plan</p>
                        <p className="text-xs font-medium">New events have been optimized for your team.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
                          if (jsonMatch) {
                            try {
                              const events = JSON.parse(jsonMatch[1]).map((e:any) => ({...e, id: Math.random().toString(36).substr(2,9)}));
                              onAddEvents(events);
                              setResponse("Plan implemented! The team schedule has been updated across all views.");
                            } catch (e) {
                              setResponse("I generated invalid data. Let me try rethinking that...");
                            }
                          }
                        }}
                        className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm hover:bg-indigo-50 transition-colors"
                      >
                        Implement Suggestion
                      </button>
                   </div>
                )}
              </div>
            ) : !loading && (
              <div className="text-center py-12 opacity-40">
                <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                   <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2">Deep Reasoning Hub</p>
                <p className="text-[11px] max-w-[200px] mx-auto italic">"Identify overlaps on Monday and suggest a better sync time."</p>
              </div>
            )}
            
            {loading && (
              <div className="flex flex-col items-center gap-4 py-8 animate-in fade-in duration-300">
                <div className="relative w-12 h-12">
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-100"></div>
                   <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] animate-pulse">
                    Processing with Gemini 3 Pro
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
                    Analyzing team dynamics & thinking deeply...
                  </p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          
          <div className="p-5 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSmartAnalyze()}
                placeholder="Ask TeamFlow Intelligence..."
                className="flex-1 text-sm p-4 bg-slate-50 border border-slate-200 rounded-[1.25rem] focus:ring-4 focus:ring-indigo-50 outline-none focus:border-indigo-300 transition-all font-medium"
              />
              <button 
                onClick={handleSmartAnalyze}
                disabled={loading || !query.trim()}
                className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-20 transition-all shadow-lg shadow-indigo-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-3 uppercase font-bold tracking-widest opacity-60">High-Fidelity Planning Engine</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiAssistant;
