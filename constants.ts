
import { ClassType, Skill, Talent } from './types';

export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const TILE_SIZE = 32;

// Color Palette
export const COLORS = {
  PALADIN: '#eab308', // yellow-500
  ROGUE: '#22c55e',   // green-500
  MAGE: '#3b82f6',    // blue-500
  NECROMANCER: '#9333ea', // purple-600
  PRIEST: '#06b6d4',  // cyan-500
  MINION: '#d8b4fe',  // purple-300
  MINION_CONVERTED: '#67e8f9', // cyan-300
  ENEMY_BASIC: '#ef4444', // red-500
  ENEMY_BOSS: '#7f1d1d', // red-900
  PROJECTILE_PLAYER: '#f0f9ff',
  PROJECTILE_ENEMY: '#fca5a5',
  GROUND: '#0f172a', // slate-900
  GRID: '#1e293b',   // slate-800
};

// Class Definitions
export const CLASS_STATS = {
  [ClassType.PALADIN]: {
    hp: 250, maxHp: 250, energy: 200, maxEnergy: 200, attack: 20, defense: 30, speed: 2.5, critRate: 0.05, critDmg: 1.5
  },
  [ClassType.ROGUE]: {
    hp: 150, maxHp: 150, energy: 300, maxEnergy: 300, attack: 40, defense: 10, speed: 4.5, critRate: 0.25, critDmg: 2.0
  },
  [ClassType.MAGE]: {
    hp: 120, maxHp: 120, energy: 500, maxEnergy: 500, attack: 55, defense: 5, speed: 3, critRate: 0.15, critDmg: 1.5
  },
  [ClassType.NECROMANCER]: {
    hp: 180, maxHp: 180, energy: 400, maxEnergy: 400, attack: 25, defense: 15, speed: 3, critRate: 0.1, critDmg: 1.5
  },
  [ClassType.PRIEST]: {
    hp: 200, maxHp: 200, energy: 450, maxEnergy: 450, attack: 15, defense: 20, speed: 3, critRate: 0.05, critDmg: 1.5
  }
};

export const SKILLS: Record<ClassType, Skill[]> = {
  [ClassType.PALADIN]: [
    { id: 'p_bash', name: 'Mace Bash', type: 'MELEE', cooldown: 40, currentCooldown: 0, energyCost: 10, description: 'Heavy melee swing', icon: '🔨', range: 100 },
    { id: 'p_shield', name: 'Boomerang Shield', type: 'PROJECTILE', cooldown: 180, currentCooldown: 0, energyCost: 30, description: 'Throws shield that returns', icon: '🛡️', range: 600 },
    { id: 'p_guard', name: 'Divine Guard', type: 'BUFF', cooldown: 400, currentCooldown: 0, energyCost: 50, description: 'Reflect projectiles', icon: '✨', range: 0 },
  ],
  [ClassType.ROGUE]: [
    { id: 'r_arrow', name: 'Quick Shot', type: 'PROJECTILE', cooldown: 20, currentCooldown: 0, energyCost: 5, description: 'Fires a fast arrow', icon: '🏹', range: 700 },
    { id: 'r_rain', name: 'Arrow Rain', type: 'AOE', cooldown: 240, currentCooldown: 0, energyCost: 40, description: 'Area of effect damage', icon: '🌧️', range: 550 },
    { id: 'r_stab', name: 'Backstab', type: 'MELEE', cooldown: 33, currentCooldown: 0, energyCost: 20, description: 'Critical Dash strike', icon: '🗡️', range: 250 },
  ],
  [ClassType.MAGE]: [
    { id: 'm_fire', name: 'Fireball', type: 'PROJECTILE', cooldown: 50, currentCooldown: 0, energyCost: 15, description: 'Explosive projectile', icon: '🔥', range: 700 },
    { id: 'm_bolt', name: 'Lightning', type: 'INSTANT', cooldown: 120, currentCooldown: 0, energyCost: 35, description: 'Chains to enemies', icon: '⚡', range: 600 },
    { id: 'm_nova', name: 'Frost Nova', type: 'AOE', cooldown: 300, currentCooldown: 0, energyCost: 50, description: 'Freezes nearby enemies', icon: '❄️', range: 250 },
  ],
  [ClassType.NECROMANCER]: [
    { id: 'n_warrior', name: 'Raise Warrior', type: 'INSTANT', cooldown: 180, currentCooldown: 0, energyCost: 40, description: 'Summons a skeletal warrior', icon: '💀', range: 100 },
    { id: 'n_archer', name: 'Raise Archer', type: 'INSTANT', cooldown: 180, currentCooldown: 0, energyCost: 45, description: 'Summons a skeletal archer', icon: '🦴', range: 100 },
    { id: 'n_soul', name: 'Soul Projectile', type: 'PROJECTILE', cooldown: 40, currentCooldown: 0, energyCost: 10, description: 'Fires a wandering spirit', icon: '👻', range: 600 },
  ],
  [ClassType.PRIEST]: [
    { id: 'pr_convert', name: 'Conversion Ray', type: 'PROJECTILE', cooldown: 100, currentCooldown: 0, energyCost: 40, description: 'Converts an enemy to fight for you', icon: '🙏', range: 500 },
    { id: 'pr_heal', name: 'Holy Mending', type: 'INSTANT', cooldown: 300, currentCooldown: 0, energyCost: 60, description: 'Heals all active minions', icon: '💚', range: 0 },
    { id: 'pr_buff', name: 'Protection Aura', type: 'BUFF', cooldown: 600, currentCooldown: 0, energyCost: 80, description: 'Minions gain Def & Dmg', icon: '🛡️', range: 0 },
  ]
};

// Talent Tree Definition
export const TALENT_TREE: Talent[] = [
  // CENTER START
  { id: 'core_power', name: 'Core Power', description: '+10% Damage', cost: 1, x: 50, y: 50, effectType: 'STAT', stat: 'attack', value: 0.1 },
  
  // OFFENSE BRANCH (UP - Projectiles & Crit)
  { id: 'lethality_1', name: 'Lethality I', description: '+10% Critical Rate', cost: 1, x: 50, y: 35, prereq: 'core_power', effectType: 'STAT', stat: 'critRate', value: 0.1 },
  { id: 'crit_dmg', name: 'Precision', description: '+50% Critical Damage', cost: 2, x: 50, y: 20, prereq: 'lethality_1', effectType: 'STAT', stat: 'critDmg', value: 0.5 },
  { id: 'multi_proj', name: 'Barrage I', description: '+2 Projectiles', cost: 3, x: 50, y: 5, prereq: 'crit_dmg', effectType: 'MECHANIC', mechanic: 'MULTI_PROJ', value: 2 },
  { id: 'multi_proj_2', name: 'Barrage II', description: '+2 Projectiles', cost: 5, x: 35, y: 5, prereq: 'multi_proj', effectType: 'MECHANIC', mechanic: 'MULTI_PROJ', value: 2 },
  { id: 'explode_hit', name: 'Volatile Impact', description: 'Projectiles Explode on Hit', cost: 5, x: 65, y: 5, prereq: 'multi_proj', effectType: 'MECHANIC', mechanic: 'EXPLODE_ON_HIT', value: 1 },

  // UTILITY BRANCH (RIGHT - Speed & Splitting)
  { id: 'haste', name: 'Haste', description: '-15% Cooldowns', cost: 1, x: 65, y: 50, prereq: 'core_power', effectType: 'STAT', stat: 'cooldown', value: 0.15 },
  { id: 'speed', name: 'Swiftness', description: '+20% Move Speed', cost: 1, x: 80, y: 50, prereq: 'haste', effectType: 'STAT', stat: 'speed', value: 0.2 },
  { id: 'split', name: 'Fracture I', description: 'Projectiles split in flight', cost: 3, x: 95, y: 50, prereq: 'speed', effectType: 'MECHANIC', mechanic: 'SPLIT', value: 1 },
  { id: 'split_2', name: 'Fracture II', description: 'Split projectiles split again', cost: 5, x: 95, y: 35, prereq: 'split', effectType: 'MECHANIC', mechanic: 'SPLIT', value: 1 },

  // DEFENSE BRANCH (LEFT - Survival & Bounce)
  { id: 'iron_skin', name: 'Iron Skin', description: '+30% Defense', cost: 1, x: 35, y: 50, prereq: 'core_power', effectType: 'STAT', stat: 'defense', value: 0.3 },
  { id: 'vitality', name: 'Vitality', description: '+50 Max HP', cost: 1, x: 20, y: 50, prereq: 'iron_skin', effectType: 'STAT', stat: 'maxHp', value: 50 },
  { id: 'bounce', name: 'Ricochet I', description: 'Projectiles Bounce (+1)', cost: 3, x: 5, y: 50, prereq: 'vitality', effectType: 'MECHANIC', mechanic: 'BOUNCE', value: 1 },
  { id: 'bounce_2', name: 'Ricochet II', description: 'Projectiles Bounce (+2)', cost: 4, x: 5, y: 35, prereq: 'bounce', effectType: 'MECHANIC', mechanic: 'BOUNCE', value: 2 },

  // ENERGY/AREA BRANCH (DOWN)
  { id: 'flow', name: 'Mana Flow', description: '+50% Max Energy', cost: 1, x: 50, y: 65, prereq: 'core_power', effectType: 'STAT', stat: 'maxEnergy', value: 0.5 },
  { id: 'area_1', name: 'Expansion I', description: '+25% Area of Effect', cost: 2, x: 50, y: 80, prereq: 'flow', effectType: 'MECHANIC', mechanic: 'AOE_SIZE', value: 0.25 },
  { id: 'area_2', name: 'Expansion II', description: '+50% Area of Effect', cost: 4, x: 50, y: 95, prereq: 'area_1', effectType: 'MECHANIC', mechanic: 'AOE_SIZE', value: 0.50 },
  { id: 'lethality_2', name: 'Lethality II', description: '+10% Critical Rate', cost: 2, x: 35, y: 80, prereq: 'flow', effectType: 'STAT', stat: 'critRate', value: 0.1 },

  // MINION BRANCH (TOP-LEFT)
  { id: 'horde_1', name: 'Necromancy I', description: '+1 Max Minion', cost: 2, x: 35, y: 35, prereq: 'core_power', effectType: 'STAT', stat: 'maxMinions', value: 1 },
  { id: 'minion_dmg', name: 'Soul Bond', description: '+25% Minion Damage', cost: 2, x: 25, y: 25, prereq: 'horde_1', effectType: 'STAT', stat: 'minionDmg', value: 0.25 },
  { id: 'minion_hp', name: 'Undead Fortitude', description: '+50% Minion HP', cost: 2, x: 40, y: 20, prereq: 'horde_1', effectType: 'STAT', stat: 'minionHp', value: 0.5 },
  { id: 'horde_2', name: 'Necromancy II', description: '+2 Max Minions', cost: 4, x: 15, y: 15, prereq: 'minion_dmg', effectType: 'STAT', stat: 'maxMinions', value: 2 },
];
