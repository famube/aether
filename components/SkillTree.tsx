
import React from 'react';
import { Talent } from '../types';
import { TALENT_TREE } from '../constants';
import { Lock, Check, Zap, RotateCcw, ShieldAlert } from 'lucide-react';

interface SkillTreeProps {
  skillPoints: number;
  unlockedTalents: string[];
  onUnlock: (talentId: string) => void;
  onClose: () => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ skillPoints, unlockedTalents, onUnlock, onClose }) => {
  // Helper to check if a node is unlockable (parent unlocked or is root)
  const canUnlock = (talent: Talent) => {
    if (unlockedTalents.includes(talent.id)) return false; // Already unlocked
    if (skillPoints < talent.cost) return false; // Too expensive
    if (!talent.prereq) return true; // No prereq (Root)
    return unlockedTalents.includes(talent.prereq); // Parent unlocked
  };

  const getDependencyWarning = (id: string): boolean => {
    return unlockedTalents.some(tid => {
        const t = TALENT_TREE.find(node => node.id === tid);
        return t?.prereq === id;
    });
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="w-[800px] h-[600px] bg-slate-900 border-2 border-slate-600 rounded-2xl shadow-2xl p-8 relative flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Ascension Grid
            </h2>
            <p className="text-slate-400 text-sm">Enhance your abilities with Aether energy.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 uppercase tracking-wider">Available Points</div>
            <div className="text-4xl font-black text-yellow-400 drop-shadow-glow">{skillPoints}</div>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 rounded-xl border border-slate-700 overflow-hidden">
          
          {/* Scaling Wrapper to "Zoom Out" */}
          <div className="w-full h-full transform scale-[0.7] origin-center relative">
              {/* Connector Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                 {TALENT_TREE.map(talent => {
                   if (!talent.prereq) return null;
                   const parent = TALENT_TREE.find(t => t.id === talent.prereq);
                   if (!parent) return null;
                   
                   return (
                     <line 
                       key={`${parent.id}-${talent.id}`}
                       x1={`${parent.x}%`} y1={`${parent.y}%`}
                       x2={`${talent.x}%`} y2={`${talent.y}%`}
                       stroke={unlockedTalents.includes(parent.id) ? '#60a5fa' : '#475569'}
                       strokeWidth="2"
                     />
                   );
                 })}
              </svg>

              {/* Nodes */}
              {TALENT_TREE.map(talent => {
                 const isUnlocked = unlockedTalents.includes(talent.id);
                 const isUnlockable = canUnlock(talent);
                 const isLocked = !isUnlocked && !isUnlockable;
                 const hasDependents = isUnlocked && getDependencyWarning(talent.id);

                 return (
                   <div 
                     key={talent.id}
                     onClick={() => {
                        if (isUnlockable || (isUnlocked && !hasDependents)) {
                            onUnlock(talent.id);
                        }
                     }}
                     className={`absolute w-14 h-14 -ml-7 -mt-7 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-300 group z-10
                       ${isUnlocked 
                          ? (hasDependents ? 'bg-blue-900/50 border-blue-600 cursor-not-allowed' : 'bg-blue-900/80 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-red-900/80 hover:border-red-400') 
                          : isUnlockable 
                            ? 'bg-slate-800 border-yellow-500/50 hover:border-yellow-400 hover:scale-110 animate-pulse' 
                            : 'bg-slate-900 border-slate-700 grayscale opacity-60'}
                     `}
                     style={{ left: `${talent.x}%`, top: `${talent.y}%` }}
                   >
                     {isUnlocked ? (
                        hasDependents ? <Check size={20} className="text-blue-500" /> : 
                        <div className="relative">
                            <Check size={20} className="text-blue-300 group-hover:opacity-0 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            <RotateCcw size={20} className="text-red-300 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                     ) : isLocked ? <Lock size={16} className="text-slate-600" /> : <Zap size={20} className="text-yellow-400" />}
                     
                     {/* Tooltip */}
                     <div className="absolute bottom-full mb-3 w-48 bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20 text-center">
                        <div className={`font-bold mb-1 ${isUnlocked ? 'text-blue-300' : 'text-white'}`}>{talent.name}</div>
                        <div className="text-xs text-slate-400 mb-2">{talent.description}</div>
                        
                        {isUnlocked ? (
                            hasDependents ? (
                                 <div className="text-xs font-bold text-orange-400 flex items-center justify-center gap-1">
                                    <ShieldAlert size={12}/> Locked by active child nodes
                                 </div>
                            ) : (
                                 <div className="text-xs font-bold text-red-400">Click to Refund (+{talent.cost} SP)</div>
                            )
                        ) : (
                           !isLocked && (
                              <div className={`text-xs font-bold ${skillPoints >= talent.cost ? 'text-green-400' : 'text-red-400'}`}>
                                Cost: {talent.cost} SP
                              </div>
                           )
                        )}
                     </div>
                   </div>
                 );
              })}
          </div>
        </div>

        <div className="mt-6 text-center text-slate-500 text-sm">
          Press <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">K</kbd> to Close
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default SkillTree;
