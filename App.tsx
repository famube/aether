
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import MainMenu from './components/MainMenu';
import { ClassType, PlayerProfile } from './types';
import { ScrollText } from 'lucide-react';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassType>(ClassType.PALADIN);
  const [gameOverData, setGameOverData] = useState<number | null>(null);
  const [narrativeLog, setNarrativeLog] = useState<string[]>([]);

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
  };

  const handleGameOver = (score: number, updatedProfile: PlayerProfile) => {
    setGameStarted(false);
    setGameOverData(score);
    setProfile(updatedProfile); // Save progress
  };

  const handleLogUpdate = (msg: string) => {
    setNarrativeLog(prev => [msg, ...prev].slice(0, 5));
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
           
           {/* Narrative Log Overlay */}
           <div className="absolute top-4 left-4 w-80 pointer-events-none">
              <div className="flex items-center gap-2 text-purple-400 font-bold mb-2 bg-black/50 p-2 rounded w-fit">
                 <ScrollText size={16} /> Dungeon Log
              </div>
              <div className="space-y-2">
                {narrativeLog.map((log, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm bg-black/60 backdrop-blur border-l-4 border-purple-500 text-slate-200 shadow-lg animate-in slide-in-from-left fade-in duration-300`}>
                    {log}
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      {gameOverData !== null && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur text-white animate-in fade-in duration-1000">
           <h2 className="text-6xl font-black text-red-600 mb-4">YOU DIED</h2>
           <p className="text-2xl text-slate-300 mb-2">Final Score: <span className="text-white font-bold">{gameOverData}</span></p>
           <p className="text-sm text-slate-400 mb-8">Your soul strengthens. Progress saved.</p>
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
