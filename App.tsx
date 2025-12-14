import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import { ClassType, PlayerProfile } from './types';
import { ScrollText, MessageCircle, Copy, Check } from 'lucide-react';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassType>(ClassType.PALADIN);
  const [gameOverData, setGameOverData] = useState<number | null>(null);
  const [narrativeLog, setNarrativeLog] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Persistent Profile State
  const [profile, setProfile] = useState<PlayerProfile>({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    skillPoints: 0,
    unlockedTalents: []
  });

  const handleStart = (c: ClassType) => {
    setSelectedClass(c);
    setGameStarted(true);
    setGameOverData(null);
    setNarrativeLog([]);
    setCopied(false);
  };

  const handleGameOver = (score: number, updatedProfile: PlayerProfile) => {
    setGameStarted(false);
    setGameOverData(score);
    setProfile(updatedProfile); // Save progress
    setCopied(false);
  };

  const handleLogUpdate = (msg: string) => {
    setNarrativeLog(prev => [msg, ...prev].slice(0, 10)); // Keep history in state but only show 1
  };

  const handleShareWhatsapp = () => {
    if (gameOverData === null) return;
    const text = `I scored ${gameOverData} in Aether Heroes! Can you beat me? ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    if (gameOverData === null) return;
    const text = `I scored ${gameOverData} in Aether Heroes! Can you beat me? ${window.location.href}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="w-full h-screen bg-slate-950 overflow-hidden relative">
      {!gameStarted && !gameOverData && (
        <MainMenu onSelectClass={handleStart} />
      )}

      {gameStarted && (
        <div className="w-full h-full flex items-center justify-center">
           <GameCanvas 
             selectedClass={selectedClass} 
             initialProfile={profile}
             onGameOver={handleGameOver} 
             onLogUpdate={handleLogUpdate}
           />
           
           {/* Narrative Log Overlay - Top Center, Single Line */}
           <div className="absolute top-6 left-0 w-full pointer-events-none z-30 flex justify-center px-4">
              {narrativeLog.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-black/70 backdrop-blur border border-purple-500/50 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-in fade-in slide-in-from-top-4 duration-300 text-center max-w-md truncate">
                   <ScrollText size={14} className="text-purple-400 flex-shrink-0" /> 
                   <span className="truncate">{narrativeLog[0]}</span>
                </div>
              )}
           </div>
        </div>
      )}

      {gameOverData !== null && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur text-white animate-in fade-in duration-1000">
           <h2 className="text-6xl font-black text-red-600 mb-4">YOU DIED</h2>
           <p className="text-2xl text-slate-300 mb-2">Final Score: <span className="text-white font-bold">{gameOverData}</span></p>
           <p className="text-sm text-slate-400 mb-8">Your soul strengthens. Progress saved.</p>
           
           <div className="flex gap-4 mb-8">
             <button 
               onClick={handleShareWhatsapp}
               className="flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5C] text-white font-bold rounded-full transition-transform hover:scale-105 shadow-lg"
             >
               <MessageCircle size={20} />
               WhatsApp
             </button>
             
             <button 
               onClick={handleCopyLink}
               className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-transform hover:scale-105 border border-slate-500 shadow-lg"
             >
               {copied ? <Check size={20} /> : <Copy size={20} />}
               {copied ? 'Copied!' : 'Copy Score'}
             </button>
           </div>

           <button 
             onClick={() => setGameOverData(null)}
             className="px-8 py-4 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-white hover:scale-105 transition-transform"
           >
             Return to Menu
           </button>
        </div>
      )}
    </div>
  );
};

export default App;