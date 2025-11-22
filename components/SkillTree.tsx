
import React, { useState, useEffect } from 'react';
import { Talent } from '../types';
import { TALENT_TREE } from '../constants';
import { Shield, Heart, Zap, Sword, Move, Hourglass, Layers, Crosshair, Skull, Undo2, X } from 'lucide-react';

interface SkillTreeProps {
  skillPoints: number;
  unlockedTalents: string[];
  onUnlock: (talentId: string) => void;
  onUndo: () => void;
  onClose: () => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ skillPoints, unlockedTalents, onUnlock, onUndo, onClose }) => {
  const [options, setOptions] = useState<Talent[]>([]);

  // Helper to map stats/mechanics to Icons
  const getIcon = (t: Talent, size: number = 24, strokeWidth: number = 2) => {
    const props = { size, strokeWidth };
    if (t.effectType === 'STAT') {
      switch(t.stat) {
        case 'maxHp': return <Heart className="text-red-500" {...props} />;
        case 'attack': return <Sword className="text-orange-500" {...props} />;
        case 'defense': return <Shield className="text-blue-500" {...props} />;
        case 'speed': return <Move className="text-green-500" {...props} />;
        case 'cooldown': return <Hourglass className="text-yellow-500" {...props} />;
        case 'critRate': case 'critDmg': return <Crosshair className="text-red-400" {...props} />;
        case 'maxMinions': case 'minionDmg': case 'minionHp': return <Skull className="text-purple-400" {...props} />;
        case 'maxEnergy': return <Zap className="text-blue-400" {...props} />;
        default: return <Zap className="text-yellow-400" {...props} />;
      }
    }
    // Mechanic
    return <Layers className="text-cyan-400" {...props} />;
  };

  useEffect(() => {
    // Reroll Logic:
    // 1. Find all valid candidates.
    // Candidates are nodes NOT unlocked, where either:
    //    - No Prereq (Root)
    //    - Prereq IS unlocked
    const candidates = TALENT_TREE.filter(t => {
      if (unlockedTalents.includes(t.id)) return false;
      if (!t.prereq) return true; // Root
      return unlockedTalents.includes(t.prereq);
    });

    // 2. Shuffle and Pick 3
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    setOptions(shuffled.slice(0, 3));

  }, [unlockedTalents]); // Reroll whenever the user unlocks (or undoes) something

  const canAfford = (cost: number) => skillPoints >= cost;

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-3xl bg-transparent flex flex-col gap-4 md:gap-6 max-h-full">
        
        {/* Header */}
        <div className="text-center flex-shrink-0">
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-lg mb-1 md:mb-2">
            ASCENSION
          </h2>
          <p className="text-slate-300 text-sm md:text-lg">Choose your path of power.</p>
        </div>

        {/* Points Display & Controls */}
        <div className="flex-shrink-0 flex flex-wrap justify-center gap-4 md:gap-6 items-center bg-slate-800/50 py-2 md:py-3 px-4 md:px-8 rounded-full border border-slate-700 mx-auto backdrop-blur-sm shadow-xl">
             <div className="flex flex-col items-center">
                <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold">Points Available</span>
                <span className="text-2xl md:text-3xl font-black text-yellow-400 drop-shadow-glow">{skillPoints}</span>
             </div>
             
             {unlockedTalents.length > 0 && (
                <button 
                  onClick={onUndo}
                  className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-500 transition-all active:scale-95"
                >
                  <Undo2 size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="text-xs md:text-sm font-bold">Undo Last</span>
                </button>
             )}

             <button 
                onClick={onClose}
                className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg border border-slate-500 transition-all active:scale-95"
             >
                <X size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="text-xs md:text-sm font-bold">Close</span>
             </button>
        </div>

        {/* Scrollable Cards Container */}
        <div className="flex-1 overflow-y-auto min-h-0 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full pb-4">
             {options.length === 0 ? (
                <div className="col-span-1 md:col-span-3 text-center py-12">
                    <p className="text-xl md:text-2xl text-slate-400 font-bold">Maximum Power Achieved</p>
                    <p className="text-sm md:text-base text-slate-500">No more upgrades available at this time.</p>
                </div>
             ) : (
                options.map((opt, idx) => {
                   const affordable = canAfford(opt.cost);
                   return (
                     <div 
                       key={opt.id}
                       className={`
                          relative bg-slate-900 border-2 rounded-xl p-3 flex flex-col items-center text-center gap-2 transition-all duration-300
                          shadow-2xl group
                          ${affordable 
                             ? 'border-slate-600 hover:border-yellow-400 hover:scale-[1.02] md:hover:scale-105 hover:bg-slate-800 cursor-pointer' 
                             : 'border-slate-800 opacity-60 cursor-not-allowed grayscale'}
                       `}
                       onClick={() => affordable && onUnlock(opt.id)}
                       style={{ animationDelay: `${idx * 100}ms` }} // Stagger animation
                     >
                        <div className={`p-2 rounded-full bg-slate-800 border border-slate-700 shadow-inner mb-1 transition-transform duration-300 ${affordable ? 'group-hover:scale-110 group-hover:border-yellow-500 group-hover:shadow-yellow-500/20' : ''}`}>
                            {getIcon(opt, 32, 1.5)}
                        </div>
                        
                        <div className="w-full">
                          <h3 className={`text-base md:text-lg font-bold mb-0.5 leading-tight ${affordable ? 'text-white group-hover:text-yellow-400' : 'text-slate-500'}`}>
                             {opt.name}
                          </h3>
                          <div className="text-xs md:text-sm text-slate-400 leading-snug min-h-[2.5rem] flex items-center justify-center px-2">
                             {opt.description}
                          </div>
                        </div>

                        <div className={`mt-auto px-3 py-0.5 rounded-full text-xs md:text-sm font-bold border ${affordable ? 'bg-slate-800 border-slate-600 text-yellow-400' : 'bg-red-900/20 border-red-900 text-red-500'}`}>
                           Cost: {opt.cost} SP
                        </div>

                        {!affordable && (
                           <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                              <span className="bg-red-900 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded border border-red-500 rotate-12 shadow-lg">
                                 INSUFFICIENT POINTS
                              </span>
                           </div>
                        )}
                     </div>
                   );
                })
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillTree;
