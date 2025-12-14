import React from 'react';
import { ClassType } from '../types';
import { Shield, Crosshair, Flame, Skull, HandHeart, Axe, Trophy, Keyboard, MousePointer2 } from 'lucide-react';

interface MainMenuProps {
  onSelectClass: (c: ClassType) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelectClass }) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-slate-900 text-white bg-[url('https://picsum.photos/1920/1080?blur=5')] bg-cover bg-center bg-no-repeat bg-blend-multiply">
      <div className="w-full min-h-full flex flex-col items-center justify-center py-12 px-4 md:px-8">
      
        <h1 className="text-4xl md:text-6xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 drop-shadow-lg text-center animate-in slide-in-from-top-10 fade-in duration-700">
          AETHER HEROES
        </h1>
        <p className="text-slate-300 mb-8 md:mb-10 text-base md:text-lg text-center max-w-2xl animate-in slide-in-from-top-4 fade-in duration-1000 delay-200">
          Enter the void, select your champion, and survive the endless tides of darkness in this isometric action RPG.
        </p>

        {/* Class Selection */}
        <div className="flex gap-4 flex-wrap justify-center max-w-6xl mb-16 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-300">
          <ClassCard 
              type={ClassType.PALADIN} 
              color="yellow" 
              icon={<Shield size={32} />} 
              title="Paladin" 
              desc="Reflects damage & shields."
              onClick={() => onSelectClass(ClassType.PALADIN)} 
          />
          <ClassCard 
              type={ClassType.ROGUE} 
              color="green" 
              icon={<Crosshair size={32} />} 
              title="Rogue" 
              desc="Crit damage & speed."
              onClick={() => onSelectClass(ClassType.ROGUE)} 
          />
          <ClassCard 
              type={ClassType.MAGE} 
              color="blue" 
              icon={<Flame size={32} />} 
              title="Mage" 
              desc="AoE spells & control."
              onClick={() => onSelectClass(ClassType.MAGE)} 
          />
          <ClassCard 
              type={ClassType.BARBARIAN} 
              color="orange" 
              icon={<Axe size={32} />} 
              title="Barbarian" 
              desc="Spin attacks & raw power."
              onClick={() => onSelectClass(ClassType.BARBARIAN)} 
          />
          <ClassCard 
              type={ClassType.NECROMANCER} 
              color="purple" 
              icon={<Skull size={32} />} 
              title="Necromancer" 
              desc="Summons undead army."
              onClick={() => onSelectClass(ClassType.NECROMANCER)} 
          />
          <ClassCard 
              type={ClassType.PRIEST} 
              color="cyan" 
              icon={<HandHeart size={32} />} 
              title="Priest" 
              desc="Heals & converts enemies."
              onClick={() => onSelectClass(ClassType.PRIEST)} 
          />
        </div>

        {/* Game Guide Section */}
        <div className="max-w-5xl w-full bg-slate-950/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 md:p-8 shadow-2xl animate-in fade-in duration-1000 delay-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* How to Play */}
              <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                      <Trophy size={20} className="text-yellow-500" /> 
                      <span>How to Play</span>
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      Survive as long as possible against infinite waves of monsters. Defeating enemies grants <strong>XP</strong> to level up, which fully restores your health and grants Skill Points. Every 5 waves, a Boss appears.
                  </p>
                  
                  <div className="space-y-4">
                      <div className="flex items-start gap-3">
                          <div className="bg-slate-800 p-2 rounded text-slate-300"><Keyboard size={18}/></div>
                          <div>
                              <p className="text-white text-sm font-bold">Movement</p>
                              <p className="text-slate-500 text-xs">Use <span className="text-slate-300">WASD</span>, <span className="text-slate-300">Arrow Keys</span>, or the on-screen <span className="text-slate-300">Joystick</span>.</p>
                          </div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="bg-slate-800 p-2 rounded text-slate-300"><MousePointer2 size={18}/></div>
                          <div>
                              <p className="text-white text-sm font-bold">Combat & Skills</p>
                              <p className="text-slate-500 text-xs">Your hero attacks automatically. Use <span className="text-yellow-400">1, 2, 3</span> or click icons to cast Skills. Press <span className="text-yellow-400">K</span> to open the Talent Tree.</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Class Descriptions */}
              <div>
                   <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Class Overview</h3>
                   <div className="space-y-3 text-sm">
                      <DetailRow color="text-yellow-500" title="Paladin" desc="A holy tank. Reflects damage back at attackers and uses shields for protection." />
                      <DetailRow color="text-green-500" title="Rogue" desc="Agile assassin. High movement speed, evasive dashing, and massive critical hits." />
                      <DetailRow color="text-blue-500" title="Mage" desc="Elemental master. Chains lightning between foes and freezes groups with Frost Nova." />
                      <DetailRow color="text-orange-500" title="Barbarian" desc="Melee powerhouse. Spins to destroy crowds and throws heavy axes at range." />
                      <DetailRow color="text-purple-500" title="Necromancer" desc="Commander of the dead. Raises skeletal warriors and archers to fight for you." />
                      <DetailRow color="text-cyan-500" title="Priest" desc="Divine support. Heals friendly minions and converts enemies to join your side." />
                   </div>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

// --- Helper Components ---

const ClassCard = ({ type, color, icon, title, desc, onClick }: any) => {
    const borderColors: Record<string, string> = {
        yellow: 'border-yellow-600 hover:border-yellow-400 hover:shadow-yellow-500/30 text-yellow-500',
        green: 'border-green-600 hover:border-green-400 hover:shadow-green-500/30 text-green-500',
        blue: 'border-blue-600 hover:border-blue-400 hover:shadow-blue-500/30 text-blue-500',
        orange: 'border-orange-600 hover:border-orange-400 hover:shadow-orange-500/30 text-orange-500',
        purple: 'border-purple-600 hover:border-purple-400 hover:shadow-purple-500/30 text-purple-500',
        cyan: 'border-cyan-600 hover:border-cyan-400 hover:shadow-cyan-500/30 text-cyan-500',
    };

    return (
        <div 
          onClick={onClick}
          className={`w-36 md:w-40 bg-slate-900/80 backdrop-blur-sm border-2 rounded-xl p-4 flex flex-col items-center cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 group shadow-lg ${borderColors[color]}`}
        >
          <div className="mb-3 transition-transform group-hover:scale-110">{icon}</div>
          <h2 className="text-lg font-bold text-center mb-1 text-inherit">{title}</h2>
          <p className="text-[10px] text-slate-400 text-center leading-tight group-hover:text-slate-200">{desc}</p>
        </div>
    );
}

const DetailRow = ({ color, title, desc }: any) => (
    <div className="flex gap-3">
        <span className={`font-bold w-24 flex-shrink-0 ${color}`}>{title}</span>
        <span className="text-slate-400 leading-snug">{desc}</span>
    </div>
);

export default MainMenu;