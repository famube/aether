
import React from 'react';
import { ClassType } from '../types';
import { COLORS } from '../constants';
import { Shield, Crosshair, Flame, Skull, HandHeart } from 'lucide-react';

interface MainMenuProps {
  onSelectClass: (c: ClassType) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectClass }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center bg-no-repeat bg-blend-multiply">
      <h1 className="text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 drop-shadow-lg">
        AETHER CHRONICLES
      </h1>
      <p className="text-slate-300 mb-12 text-lg">Choose your destiny, hero.</p>

      <div className="flex gap-6 flex-wrap justify-center max-w-6xl">
        {/* Paladin */}
        <div 
          onClick={() => onSelectClass(ClassType.PALADIN)}
          className="w-56 bg-slate-800/90 backdrop-blur border-2 border-yellow-600 hover:border-yellow-400 rounded-2xl p-5 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] group"
        >
          <div className="flex justify-center mb-4 text-yellow-500">
            <Shield size={50} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-yellow-500">Paladin</h2>
          <p className="text-xs text-slate-300 text-center mb-4">
            High Defense & Retaliation.
          </p>
        </div>

        {/* Rogue */}
        <div 
          onClick={() => onSelectClass(ClassType.ROGUE)}
          className="w-56 bg-slate-800/90 backdrop-blur border-2 border-green-600 hover:border-green-400 rounded-2xl p-5 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] group"
        >
          <div className="flex justify-center mb-4 text-green-500">
            <Crosshair size={50} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-green-500">Rogue</h2>
          <p className="text-xs text-slate-300 text-center mb-4">
            Speed & Precision.
          </p>
        </div>

        {/* Mage */}
        <div 
          onClick={() => onSelectClass(ClassType.MAGE)}
          className="w-56 bg-slate-800/90 backdrop-blur border-2 border-blue-600 hover:border-blue-400 rounded-2xl p-5 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] group"
        >
          <div className="flex justify-center mb-4 text-blue-500">
            <Flame size={50} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-blue-500">Mage</h2>
          <p className="text-xs text-slate-300 text-center mb-4">
            Elemental Destruction.
          </p>
        </div>

        {/* Necromancer */}
        <div 
          onClick={() => onSelectClass(ClassType.NECROMANCER)}
          className="w-56 bg-slate-800/90 backdrop-blur border-2 border-purple-600 hover:border-purple-400 rounded-2xl p-5 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] group"
        >
          <div className="flex justify-center mb-4 text-purple-500">
            <Skull size={50} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-purple-500">Necromancer</h2>
          <p className="text-xs text-slate-300 text-center mb-4">
            Summoner of the Dead.
          </p>
        </div>

        {/* Priest */}
        <div 
          onClick={() => onSelectClass(ClassType.PRIEST)}
          className="w-56 bg-slate-800/90 backdrop-blur border-2 border-cyan-500 hover:border-cyan-400 rounded-2xl p-5 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] group"
        >
          <div className="flex justify-center mb-4 text-cyan-500">
            <HandHeart size={50} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-center mb-2 text-cyan-500">Priest</h2>
          <p className="text-xs text-slate-300 text-center mb-4">
            Conversion & Protection.
          </p>
           <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4 text-left mt-2">
            <li><span className="text-white">Convert:</span> Turn Enemies</li>
            <li><span className="text-white">Mend:</span> Heal Minions</li>
            <li><span className="text-white">Aura:</span> Buff Army</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default MainMenu;
