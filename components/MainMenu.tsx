
import React from 'react';
import { ClassType } from '../types';
import { COLORS } from '../constants';
import { Shield, Crosshair, Flame, Skull, HandHeart } from 'lucide-react';

interface MainMenuProps {
  onSelectClass: (c: ClassType) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectClass }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center bg-no-repeat bg-blend-multiply px-4">
      <h1 className="text-4xl md:text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 drop-shadow-lg text-center">
        AETHER CHRONICLES
      </h1>
      <p className="text-slate-300 mb-8 md:mb-12 text-base md:text-lg text-center">Choose your destiny, hero.</p>

      <div className="flex gap-4 flex-wrap justify-center max-w-5xl">
        {/* Paladin */}
        <div 
          onClick={() => onSelectClass(ClassType.PALADIN)}
          className="w-40 bg-slate-800/90 backdrop-blur border-2 border-yellow-600 hover:border-yellow-400 rounded-xl p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] group"
        >
          <div className="flex justify-center mb-2 text-yellow-500">
            <Shield size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-center mb-1 text-yellow-500">Paladin</h2>
          <p className="text-[10px] text-slate-300 text-center mb-2 leading-tight">
            High Defense & Retaliation.
          </p>
        </div>

        {/* Rogue */}
        <div 
          onClick={() => onSelectClass(ClassType.ROGUE)}
          className="w-40 bg-slate-800/90 backdrop-blur border-2 border-green-600 hover:border-green-400 rounded-xl p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] group"
        >
          <div className="flex justify-center mb-2 text-green-500">
            <Crosshair size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-center mb-1 text-green-500">Rogue</h2>
          <p className="text-[10px] text-slate-300 text-center mb-2 leading-tight">
            Speed & Precision.
          </p>
        </div>

        {/* Mage */}
        <div 
          onClick={() => onSelectClass(ClassType.MAGE)}
          className="w-40 bg-slate-800/90 backdrop-blur border-2 border-blue-600 hover:border-blue-400 rounded-xl p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group"
        >
          <div className="flex justify-center mb-2 text-blue-500">
            <Flame size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-center mb-1 text-blue-500">Mage</h2>
          <p className="text-[10px] text-slate-300 text-center mb-2 leading-tight">
            Elemental Destruction.
          </p>
        </div>

        {/* Necromancer */}
        <div 
          onClick={() => onSelectClass(ClassType.NECROMANCER)}
          className="w-40 bg-slate-800/90 backdrop-blur border-2 border-purple-600 hover:border-purple-400 rounded-xl p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] group"
        >
          <div className="flex justify-center mb-2 text-purple-500">
            <Skull size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-center mb-1 text-purple-500">Necromancer</h2>
          <p className="text-[10px] text-slate-300 text-center mb-2 leading-tight">
            Summoner of the Dead.
          </p>
        </div>

        {/* Priest */}
        <div 
          onClick={() => onSelectClass(ClassType.PRIEST)}
          className="w-40 bg-slate-800/90 backdrop-blur border-2 border-cyan-500 hover:border-cyan-400 rounded-xl p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] group"
        >
          <div className="flex justify-center mb-2 text-cyan-500">
            <HandHeart size={36} strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-center mb-1 text-cyan-500">Priest</h2>
          <p className="text-[10px] text-slate-300 text-center mb-2 leading-tight">
            Conversion & Protection.
          </p>
           <ul className="text-[9px] text-slate-400 space-y-0.5 list-disc pl-4 text-left mt-1">
          </ul>
        </div>

      </div>
    </div>
  );
};

export default MainMenu;
