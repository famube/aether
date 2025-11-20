
export enum ClassType {
  PALADIN = 'PALADIN',
  ROGUE = 'ROGUE',
  MAGE = 'MAGE',
  NECROMANCER = 'NECROMANCER',
  PRIEST = 'PRIEST'
}

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE',
  PARTICLE = 'PARTICLE',
  ITEM = 'ITEM',
  MINION = 'MINION'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  speed: number;
  critRate?: number; // 0-1
  critDmg?: number; // Multiplier (e.g., 1.5)
}

export interface Skill {
  id: string;
  name: string;
  type: 'MELEE' | 'PROJECTILE' | 'AOE' | 'BUFF' | 'INSTANT';
  cooldown: number;
  currentCooldown: number;
  energyCost: number;
  description: string;
  icon: string;
  range?: number; // Max distance for auto-targeting
}

export interface Talent {
  id: string;
  name: string;
  description: string;
  cost: number;
  x: number; // % position 0-100
  y: number; // % position 0-100
  prereq?: string;
  effectType: 'STAT' | 'MECHANIC';
  stat?: 'attack' | 'defense' | 'maxHp' | 'maxEnergy' | 'speed' | 'cooldown' | 'critRate' | 'critDmg' | 'maxMinions' | 'minionHp' | 'minionDmg';
  mechanic?: 'MULTI_PROJ' | 'BOUNCE' | 'SPLIT' | 'AOE_SIZE' | 'EXPLODE_ON_HIT';
  value: number;
}

export interface EntityBuffs {
  isProtected?: boolean; // Defense up
  isEmpowered?: boolean; // Damage up
  isChilled?: boolean; // Slow down
  expiresAt?: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  stats?: Stats;
  
  // Specifics
  classType?: ClassType;
  subType?: 'BASIC' | 'BOSS' | 'SPEEDSTER' | 'TANK' | 'RANGER';
  ownerId?: string;
  damage?: number;
  lifeTime?: number;
  maxLifeTime?: number;
  behavior?: 'CHASE' | 'RANGED' | 'BOSS' | 'BOOMERANG' | 'PIERCE' | 'STATIONARY' | 'WANDER';
  isDead?: boolean;
  
  // Projectile modifiers
  bounces?: number;
  canSplit?: boolean;
  hasSplit?: boolean;
  explodeOnHit?: boolean;
  isConversion?: boolean; // Priest specific

  // Paladin specific
  isShieldActive?: boolean;
  // Rogue specific
  isStealthed?: boolean;
  // Minion specific
  lastAttackTime?: number;
  buffs?: EntityBuffs; // Priest/Mage specific

  // Visual Enhancements
  rotation?: number; // In radians
  rotationSpeed?: number;
  effectType?: 'SWING' | 'EXPLOSION' | 'LIGHTNING' | 'NOVA' | 'TRAIL' | 'TEXT' | 'SMOKE' | 'SLASH' | 'GLOW' | 'WARNING' | 'ARROW_FALL' | 'ARROW' | 'WIND_RING' | 'SNOWFLAKE';
  targetPos?: Vector2; // For beams/lightning
  text?: string; // For floating text
  opacity?: number;
  scale?: number;
}

export interface PlayerProfile {
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  unlockedTalents: string[];
}

export interface GameState {
  player: Entity;
  enemies: Entity[];
  minions: Entity[];
  projectiles: Entity[];
  particles: Entity[];
  skills: Skill[];
  activeSkillIndex: number;
  
  // Progression (Run specific)
  score: number;
  wave: number;
  
  // Persistent derived state
  profile: PlayerProfile;

  gameTime: number;
  isGameOver: boolean;
  isPaused: boolean;
  isSkillTreeOpen: boolean;
  narrativeLog: string[];
  
  // Visuals
  screenShake: number;
}

export interface InputState {
  keys: Record<string, boolean>;
  mouse: Vector2;
  mouseDown: boolean;
  joystick: Vector2;
}
