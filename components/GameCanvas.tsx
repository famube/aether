
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  EntityType, 
  GameState, 
  Entity, 
  Vector2, 
  ClassType, 
  InputState,
  Stats,
  PlayerProfile
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  COLORS, 
  CLASS_STATS, 
  SKILLS,
  TALENT_TREE
} from '../constants';
import { generateNarrative } from '../services/geminiService';
import SkillTree from './SkillTree';

interface GameCanvasProps {
  selectedClass: ClassType;
  initialProfile: PlayerProfile;
  onGameOver: (score: number, profile: PlayerProfile) => void;
  onLogUpdate: (log: string) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ selectedClass, initialProfile, onGameOver, onLogUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Initialize state with initialProfile props
  const gameStateRef = useRef<GameState>({
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      pos: { x: 0, y: 0 }, 
      vel: { x: 0, y: 0 },
      radius: 12,
      color: COLORS[selectedClass],
      classType: selectedClass,
      stats: { ...CLASS_STATS[selectedClass] }
    },
    enemies: [],
    minions: [],
    projectiles: [],
    particles: [],
    skills: JSON.parse(JSON.stringify(SKILLS[selectedClass])),
    activeSkillIndex: 0,
    score: 0,
    wave: 1,
    profile: { ...initialProfile },
    gameTime: 0,
    isGameOver: false,
    isPaused: false,
    isSkillTreeOpen: false,
    narrativeLog: [],
    screenShake: 0
  });

  const inputRef = useRef<InputState>({
    keys: {},
    mouse: { x: 0, y: 0 },
    mouseDown: false
  });

  // UI Sync State
  const [uiStats, setUiStats] = useState({
    hp: 0, maxHp: 100, energy: 0, maxEnergy: 100, 
    skills: [] as any[], wave: 1, score: 0, activeSkillIndex: 0,
    level: 1, xp: 0, xpToNext: 100, skillPoints: 0, isSkillTreeOpen: false, unlockedTalents: [] as string[]
  });

  // Apply initial stat bonuses from profile
  useEffect(() => {
    const state = gameStateRef.current;
    const flatHp = state.profile.unlockedTalents.reduce((acc, id) => {
      const t = TALENT_TREE.find(node => node.id === id);
      return acc + (t?.stat === 'maxHp' ? t.value : 0);
    }, 0);
    
    state.player.stats!.maxHp += flatHp;
    state.player.stats!.hp = state.player.stats!.maxHp;
  }, []);

  // --- TALENT HELPERS ---
  const getStatMultiplier = (statKey: keyof Stats | 'cooldown'): number => {
     let mult = 1;
     const state = gameStateRef.current;
     state.profile.unlockedTalents.forEach(tid => {
       const t = TALENT_TREE.find(tree => tree.id === tid);
       if (t && t.effectType === 'STAT' && t.stat === statKey) {
          if (statKey === 'cooldown') {
             mult -= t.value; 
          } else if (['maxHp', 'maxEnergy', 'defense'].includes(statKey as string) && t.value > 5) {
             // Flat values ignored here
          } else {
             mult += t.value;
          }
       }
     });
     return Math.max(0.1, mult);
  };

  const getMinionModifiers = () => {
    const state = gameStateRef.current;
    let max = 3; // Base max minions
    let hp = 1;
    let dmg = 1;
    
    state.profile.unlockedTalents.forEach(id => {
      const t = TALENT_TREE.find(node => node.id === id);
      if (t?.stat === 'maxMinions') max += t.value;
      if (t?.stat === 'minionHp') hp += t.value;
      if (t?.stat === 'minionDmg') dmg += t.value;
    });
    return { max, hp, dmg };
  };

  const getMechanicValue = (mech: 'MULTI_PROJ' | 'BOUNCE' | 'SPLIT' | 'AOE_SIZE' | 'EXPLODE_ON_HIT'): number => {
    let val = 0;
    gameStateRef.current.profile.unlockedTalents.forEach(tid => {
       const t = TALENT_TREE.find(tree => tree.id === tid);
       if (t && t.mechanic === mech) val += t.value;
    });
    return val;
  };

  const hasMechanic = (mech: string) => getMechanicValue(mech as any) > 0;

  // --- HELPER MATH ---
  const distance = (a: Vector2, b: Vector2) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  
  const getNearestEnemy = (maxRange: number = 600): Entity | null => {
    const state = gameStateRef.current;
    let nearest: Entity | null = null;
    let minDist = maxRange;
    
    state.enemies.forEach(e => {
      const d = distance(state.player.pos, e.pos);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    });
    return nearest;
  };

  // For enemies to decide who to attack
  const getNearestTarget = (fromPos: Vector2): Entity => {
    const state = gameStateRef.current;
    let target: Entity = state.player;
    let minDist = distance(fromPos, state.player.pos);

    state.minions.forEach(m => {
      const d = distance(fromPos, m.pos);
      if (d < minDist) {
        minDist = d;
        target = m;
      }
    });
    return target;
  };

  // --- SPAWNERS ---
  const spawnDamageText = (pos: Vector2, amount: number, isCrit: boolean = false) => {
    gameStateRef.current.particles.push({
      id: `txt_${Date.now()}_${Math.random()}`,
      type: EntityType.PARTICLE,
      effectType: 'TEXT',
      pos: { x: pos.x, y: pos.y - 20 },
      vel: { x: (Math.random() - 0.5) * 1, y: -1.5 },
      radius: 0,
      color: isCrit ? '#fbbf24' : '#ffffff',
      text: Math.floor(amount).toString(),
      lifeTime: 60,
      maxLifeTime: 60,
      opacity: 1,
      scale: isCrit ? 1.5 : 1
    });
  };

  const spawnParticle = (opts: Partial<Entity>) => {
    gameStateRef.current.particles.push({
      id: `part_${Date.now()}_${Math.random()}`,
      type: EntityType.PARTICLE,
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      radius: 2,
      color: '#fff',
      lifeTime: 30,
      maxLifeTime: 30,
      opacity: 1,
      rotation: 0,
      ...opts
    } as Entity);
  };

  const spawnEnemy = (count: number) => {
    const state = gameStateRef.current;
    const playerPos = state.player.pos;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 600 + Math.random() * 300; 
      
      // Enemy Type Generation
      let subType: Entity['subType'] = 'BASIC';
      let stats = { ...state.enemies[0]?.stats } || { hp: 40, maxHp: 40, energy: 0, maxEnergy: 0, attack: 8, defense: 0, speed: 2 };
      let radius = 16;
      let color = COLORS.ENEMY_BASIC;

      const wave = state.wave;
      const roll = Math.random();

      // Boss Logic
      const isBoss = wave % 5 === 0 && i === 0;
      if (isBoss) {
         subType = 'BOSS';
         radius = 40;
         color = COLORS.ENEMY_BOSS;
         stats = { hp: 300, maxHp: 300, energy: 0, maxEnergy: 0, attack: 15, defense: 5, speed: 2.5 };
      } else {
         // Standard Variations
         if (wave >= 2 && roll < 0.2) {
            subType = 'SPEEDSTER';
            color = '#fca5a5'; // light red
            radius = 12;
            stats = { hp: 30, maxHp: 30, energy: 0, maxEnergy: 0, attack: 6, defense: 0, speed: 4.5 };
         } else if (wave >= 3 && roll > 0.8) {
            subType = 'TANK';
            color = '#7f1d1d'; // dark red
            radius = 22;
            stats = { hp: 80, maxHp: 80, energy: 0, maxEnergy: 0, attack: 12, defense: 5, speed: 1.2 };
         } else if (wave >= 4 && roll > 0.6 && roll <= 0.8) {
            subType = 'RANGER';
            color = '#c084fc'; // purple-ish
            radius = 14;
            stats = { hp: 35, maxHp: 35, energy: 0, maxEnergy: 0, attack: 10, defense: 0, speed: 2.8 };
         } else {
            subType = 'BASIC';
            stats = { hp: 50, maxHp: 50, energy: 0, maxEnergy: 0, attack: 10, defense: 0, speed: 2.5 };
         }
      }
      
      // Scale Stats by Wave
      stats.hp *= (1 + wave * 0.15);
      stats.maxHp = stats.hp;
      stats.attack *= (1 + wave * 0.1);
      
      state.enemies.push({
        id: `enemy_${Date.now()}_${i}`,
        type: EntityType.ENEMY,
        subType: subType,
        pos: {
          x: playerPos.x + Math.cos(angle) * dist,
          y: playerPos.y + Math.sin(angle) * dist
        },
        vel: { x: 0, y: 0 },
        radius: radius,
        color: color,
        stats: stats,
        behavior: (subType === 'RANGER') ? 'RANGED' : (isBoss ? 'BOSS' : 'CHASE'),
        rotation: 0
      });
    }
  };

  const spawnMinion = (type: 'WARRIOR' | 'ARCHER') => {
    const state = gameStateRef.current;
    const { max, hp, dmg } = getMinionModifiers();
    
    // Enforce Max Minions
    if (state.minions.length >= max) {
      const removed = state.minions.shift();
      if (removed) {
         spawnParticle({ effectType: 'SMOKE', pos: removed.pos, color: '#d8b4fe', radius: 20, lifeTime: 20 });
      }
    }

    const playerPos = state.player.pos;
    const angle = Math.random() * Math.PI * 2;
    const dist = 50;
    
    const baseHp = 100 + (state.profile.level * 10);
    const baseAtk = (type === 'WARRIOR' ? 15 : 10) + (state.profile.level * 2);

    state.minions.push({
      id: `minion_${Date.now()}_${Math.random()}`,
      type: EntityType.MINION,
      pos: {
         x: playerPos.x + Math.cos(angle) * dist,
         y: playerPos.y + Math.sin(angle) * dist
      },
      vel: { x: 0, y: 0 },
      radius: 12,
      color: COLORS.MINION,
      ownerId: 'player',
      behavior: type === 'WARRIOR' ? 'CHASE' : 'RANGED',
      stats: {
        hp: baseHp * hp,
        maxHp: baseHp * hp,
        energy: 0, maxEnergy: 0,
        attack: baseAtk * dmg,
        defense: 5,
        speed: type === 'WARRIOR' ? 3.5 : 2.5
      },
      lastAttackTime: 0
    });

    spawnParticle({ effectType: 'SMOKE', pos: playerPos, color: '#d8b4fe', radius: 20, lifeTime: 20 });
  };

  // --- ACTIONS ---

  const activateSkill = (index: number, targetEntity?: Entity) => {
    const state = gameStateRef.current;
    if (index < 0 || index >= state.skills.length) return;
    
    state.activeSkillIndex = index;
    const skill = state.skills[index];

    const cdMult = getStatMultiplier('cooldown');
    if (skill.currentCooldown > 0) return;
    if (state.player.stats!.energy < skill.energyCost) return;

    // Consume Resources
    state.player.stats!.energy -= skill.energyCost;
    skill.currentCooldown = skill.cooldown * cdMult;

    // Targeting
    let targetPos = { ...inputRef.current.mouse };
    if (targetEntity) {
      targetPos = targetEntity.pos;
    } else {
       const camX = state.player.pos.x - CANVAS_WIDTH / 2;
       const camY = state.player.pos.y - CANVAS_HEIGHT / 2;
       targetPos = {
         x: inputRef.current.mouse.x + camX,
         y: inputRef.current.mouse.y + camY
       };
    }

    const angle = Math.atan2(targetPos.y - state.player.pos.y, targetPos.x - state.player.pos.x);
    const dmgMult = getStatMultiplier('attack');
    const baseDamage = state.player.stats!.attack * dmgMult;
    
    // --- SKILL LOGIC ---
    
    // Projectile Modifiers (Applied ONLY if type is PROJECTILE)
    const isProjectile = skill.type === 'PROJECTILE';
    
    const extraProj = isProjectile ? getMechanicValue('MULTI_PROJ') : 0;
    const projectileCount = 1 + extraProj;
    
    const canSplit = isProjectile && hasMechanic('SPLIT');
    const splitCount = isProjectile ? getMechanicValue('SPLIT') : 0; // 1 or 2
    
    const bounceCount = isProjectile ? getMechanicValue('BOUNCE') : 0;
    const explodeOnHit = isProjectile && hasMechanic('EXPLODE_ON_HIT');

    // AoE Modifiers
    const aoeBonus = getMechanicValue('AOE_SIZE');
    const aoeMult = 1 + aoeBonus;

    const arcSpread = 0.4;

    for (let i = 0; i < projectileCount; i++) {
       const finalAngle = (projectileCount > 1)
          ? angle - (arcSpread/2) + (arcSpread / (projectileCount-1)) * i
          : angle;

       // MELEE / INSTANT / AOE HANDLERS
       if (skill.id === 'p_bash') {
         const range = skill.range! * aoeMult;
         spawnParticle({
            effectType: 'SLASH',
            pos: { x: state.player.pos.x + Math.cos(finalAngle)*40, y: state.player.pos.y + Math.sin(finalAngle)*40 },
            rotation: finalAngle,
            lifeTime: 12,
            radius: 60 * aoeMult
         });
         state.screenShake = 5;
         
         state.enemies.forEach(e => {
            if (distance(state.player.pos, e.pos) < range + e.radius) {
               const eAngle = Math.atan2(e.pos.y - state.player.pos.y, e.pos.x - state.player.pos.x);
               if (Math.abs(eAngle - finalAngle) < 1.2 || distance(state.player.pos, e.pos) < 40) {
                 e.stats!.hp -= baseDamage * 1.5;
                 e.vel.x += Math.cos(finalAngle) * 15; 
                 e.vel.y += Math.sin(finalAngle) * 15;
                 spawnDamageText(e.pos, baseDamage * 1.5);
                 spawnParticle({ effectType: 'SWING', pos: e.pos, radius: 20, color: '#fff', lifeTime: 10 });
               }
            }
         });
         break; // Melee doesn't loop projectiles

       } else if (skill.id === 'p_guard') {
          state.player.isShieldActive = true;
          spawnParticle({ effectType: 'NOVA', pos: state.player.pos, color: '#fbbf24', radius: 80, lifeTime: 30 });
          setTimeout(() => { if(gameStateRef.current) gameStateRef.current.player.isShieldActive = false; }, 5000);
          break;

       } else if (skill.id === 'r_stab') {
         const backstabTarget = targetEntity || getNearestEnemy(250);
         
         if (backstabTarget) {
           const angleToTarget = Math.atan2(backstabTarget.pos.y - state.player.pos.y, backstabTarget.pos.x - state.player.pos.x);
           // Teleport to the "back" of the enemy relative to player (pass through them)
           const teleportDist = distance(state.player.pos, backstabTarget.pos) + 40;
           
           // Trail
           spawnParticle({ effectType: 'TRAIL', pos: { ...state.player.pos }, color: COLORS.ROGUE, radius: 12, lifeTime: 20 });
           
           // Update pos
           state.player.pos.x += Math.cos(angleToTarget) * teleportDist;
           state.player.pos.y += Math.sin(angleToTarget) * teleportDist;
           
           // Damage
           const dmg = baseDamage * 3.0; 
           backstabTarget.stats!.hp -= dmg;
           spawnDamageText(backstabTarget.pos, dmg, true);
           spawnParticle({ effectType: 'SLASH', pos: { ...backstabTarget.pos }, rotation: Math.random() * Math.PI, lifeTime: 15, radius: 40, color: '#ef4444' });
         } else {
            // Just dash if no target
            state.player.pos.x += Math.cos(finalAngle) * 120;
            state.player.pos.y += Math.sin(finalAngle) * 120;
            spawnParticle({ effectType: 'TRAIL', pos: state.player.pos, color: COLORS.ROGUE, radius: 10, lifeTime: 15 });
         }
         break;

       } else if (skill.id === 'r_rain') {
          let impactX = 0;
          let impactY = 0;
          
          // AUTO TARGET NEAREST ENEMY
          const nearby = getNearestEnemy(skill.range || 600);
          
          if (nearby) {
             impactX = nearby.pos.x;
             impactY = nearby.pos.y;
          } else {
             // If no enemies exist, cast at fixed distance in front of player
             const dist = 400;
             impactX = state.player.pos.x + Math.cos(finalAngle) * dist;
             impactY = state.player.pos.y + Math.sin(finalAngle) * dist;
          }

          const areaSize = 100 * aoeMult;
          // Count influenced by AoE
          const dropCount = Math.floor((10 + extraProj * 2) * aoeMult);
          
          for(let k=0; k < dropCount; k++) {
             setTimeout(() => {
                if (!gameStateRef.current.isGameOver) {
                  const rx = impactX + (Math.random()-0.5) * areaSize * 1.5;
                  const ry = impactY + (Math.random()-0.5) * areaSize * 1.5;
                  
                  // Visual: Falling Arrow
                  const fallSpeed = 25;
                  const fallDuration = 12; // frames
                  const startY = ry - (fallSpeed * fallDuration);

                  spawnParticle({ 
                      effectType: 'ARROW_FALL', 
                      pos: {x: rx, y: startY}, 
                      vel: {x: 0, y: fallSpeed},
                      radius: 2, 
                      color: COLORS.ROGUE, 
                      lifeTime: fallDuration,
                      maxLifeTime: fallDuration
                  });

                  // Delay impact to match arrow landing
                  setTimeout(() => {
                      if (gameStateRef.current.isGameOver) return;
                      spawnParticle({ effectType: 'EXPLOSION', pos: {x: rx, y: ry}, radius: 30, color: COLORS.ROGUE, lifeTime: 15 });
                      
                      state.enemies.forEach(e => {
                        if (distance({x: rx, y: ry}, e.pos) < 30) {
                           e.stats!.hp -= baseDamage * 0.5; 
                           spawnDamageText(e.pos, baseDamage * 0.5);
                        }
                      });
                  }, fallDuration * 16); 
                }
             }, k * 60);
          }
          break;

       } else if (skill.id === 'm_bolt') {
         // Chain lightning - Not projectile
         let curr = getNearestEnemy(600);
         if (curr) {
            state.screenShake = 3;
            spawnParticle({ effectType: 'LIGHTNING', pos: state.player.pos, targetPos: curr.pos, color: '#60a5fa', lifeTime: 12 });
            curr.stats!.hp -= baseDamage * 1.2;
            spawnDamageText(curr.pos, baseDamage * 1.2);
            
            const bounceBonus = getMechanicValue('BOUNCE');
            let jumps = 3 + (extraProj) + bounceBonus; // Ricochet increases chain count
            let lastPos = curr.pos;
            const hitList = [curr.id];

            state.enemies.forEach(next => {
               if (jumps > 0 && !hitList.includes(next.id) && distance(lastPos, next.pos) < 250 && next.stats!.hp > 0) {
                  spawnParticle({ effectType: 'LIGHTNING', pos: lastPos, targetPos: next.pos, color: '#93c5fd', lifeTime: 12 });
                  next.stats!.hp -= baseDamage * 0.9;
                  spawnDamageText(next.pos, baseDamage * 0.9);
                  lastPos = next.pos;
                  hitList.push(next.id);
                  jumps--;
               }
            });
         }
         break;

       } else if (skill.id === 'm_nova') {
          const radius = 200 * aoeMult;
          spawnParticle({ effectType: 'NOVA', pos: state.player.pos, color: '#3b82f6', radius: radius, lifeTime: 25 });
          
          // Snowflakes for visuals
          for(let k=0; k<8; k++) {
             const sa = (Math.PI * 2 * k) / 8;
             const sx = state.player.pos.x + Math.cos(sa) * (radius * 0.5);
             const sy = state.player.pos.y + Math.sin(sa) * (radius * 0.5);
             spawnParticle({ 
                 effectType: 'SNOWFLAKE', 
                 pos: {x: sx, y: sy}, 
                 vel: {x: Math.cos(sa)*2, y: Math.sin(sa)*2}, 
                 lifeTime: 40, 
                 color: '#bae6fd', 
                 radius: 5 
             });
          }

          state.enemies.forEach(e => {
             if (distance(state.player.pos, e.pos) < radius) {
                e.stats!.hp -= baseDamage;
                // Apply Chill
                e.buffs = {
                    ...e.buffs,
                    isChilled: true,
                    expiresAt: state.gameTime + 180 // 3 seconds chill
                };
                spawnDamageText(e.pos, baseDamage);
                spawnParticle({ effectType: 'TEXT', pos: e.pos, text: "CHILL", color: '#bae6fd', lifeTime: 40, vel: {x:0, y:-1} });
             }
          });
          break;
       } 

       // NECROMANCER SKILLS
       else if (skill.id === 'n_warrior') {
          spawnMinion('WARRIOR');
          break;
       }
       else if (skill.id === 'n_archer') {
          spawnMinion('ARCHER');
          break;
       }

       // PRIEST SKILLS
       else if (skill.id === 'pr_heal') {
          // Heal all minions
          if (state.minions.length === 0) {
             spawnParticle({ effectType: 'TEXT', pos: state.player.pos, text: "No minions!", color: '#94a3b8', lifeTime: 40, vel: {x:0,y:-1} });
          } else {
             spawnParticle({ effectType: 'NOVA', pos: state.player.pos, color: '#67e8f9', radius: 150, lifeTime: 30 });
             state.minions.forEach(m => {
                const healAmount = 50 + (state.profile.level * 5);
                m.stats!.hp = Math.min(m.stats!.maxHp, m.stats!.hp + healAmount);
                spawnParticle({ effectType: 'TEXT', pos: m.pos, text: `+${Math.floor(healAmount)}`, color: '#4ade80', lifeTime: 40, vel: {x:0,y:-1} });
                spawnParticle({ effectType: 'GLOW', pos: m.pos, radius: 20, color: '#4ade80', lifeTime: 20 });
             });
          }
          break;
       }
       else if (skill.id === 'pr_buff') {
          // Protection Aura
          if (state.minions.length === 0) {
             spawnParticle({ effectType: 'TEXT', pos: state.player.pos, text: "No minions!", color: '#94a3b8', lifeTime: 40, vel: {x:0,y:-1} });
          } else {
             spawnParticle({ effectType: 'NOVA', pos: state.player.pos, color: '#fcd34d', radius: 200, lifeTime: 40 });
             const duration = 600; // 10 seconds
             state.minions.forEach(m => {
                m.buffs = {
                   isProtected: true,
                   isEmpowered: true,
                   expiresAt: state.gameTime + duration
                };
                spawnParticle({ effectType: 'TEXT', pos: m.pos, text: "BUFFED!", color: '#fcd34d', lifeTime: 50, vel: {x:0,y:-1} });
             });
          }
          break;
       }
       
       // PROJECTILE HANDLERS
       else {
         const isShield = skill.id === 'p_shield';
         const isConvert = skill.id === 'pr_convert';
         const isArrow = skill.id === 'r_arrow';

         if (isShield) {
             state.player.isShieldActive = true;
             spawnParticle({ effectType: 'GLOW', pos: state.player.pos, color: COLORS.PALADIN, radius: 40, lifeTime: 30 });
         }
         if (isArrow) {
             spawnParticle({
                 effectType: 'WIND_RING',
                 pos: { ...state.player.pos },
                 color: 'rgba(255, 255, 255, 0.4)',
                 radius: 10,
                 lifeTime: 20,
                 maxLifeTime: 20
             });
         }
         
         const launchSpeed = isShield ? 22 : (isConvert ? 14 : (isArrow ? 18 : 12)); 

         // Soul Projectile behavior is WANDER
         const behavior = isShield ? 'BOOMERANG' : (skill.id === 'n_soul' ? 'WANDER' : undefined);
         const pColor = isShield ? '#fbbf24' : (skill.id === 'm_fire' ? '#fca5a5' : (skill.id === 'n_soul' ? '#d8b4fe' : (isConvert ? COLORS.PRIEST : (isArrow ? COLORS.ROGUE : '#f0f9ff'))));

         state.projectiles.push({
            id: `proj_${Date.now()}_${i}`, 
            type: EntityType.PROJECTILE,
            pos: { ...state.player.pos },
            vel: { x: Math.cos(finalAngle) * launchSpeed, y: Math.sin(finalAngle) * launchSpeed },
            radius: isShield ? 10 : (skill.id === 'm_fire' ? 10 : (skill.id === 'n_soul' ? 6 : 4)), 
            color: pColor,
            ownerId: 'player', 
            damage: baseDamage,
            lifeTime: isShield ? 70 : 60, 
            maxLifeTime: isShield ? 70 : 60,
            behavior: behavior,
            rotation: finalAngle, // Initialize rotation
            rotationSpeed: isShield ? 0.3 : 0,
            isConversion: isConvert,
            effectType: isArrow ? 'ARROW' : undefined,
            // Modifiers
            canSplit: !isConvert && canSplit, // Conversion ray shouldn't split easily
            bounces: bounceCount,
            explodeOnHit: !isConvert && explodeOnHit
          });
       }
    }
  };

  const gainXp = (amount: number) => {
     const state = gameStateRef.current;
     state.profile.xp += amount;
     if (state.profile.xp >= state.profile.xpToNextLevel) {
       state.profile.xp -= state.profile.xpToNextLevel;
       state.profile.level++;
       state.profile.skillPoints++;
       state.profile.xpToNextLevel = Math.floor(state.profile.xpToNextLevel * 1.2);
       
       spawnParticle({
         effectType: 'TEXT', pos: state.player.pos, text: "LEVEL UP!", color: '#fcd34d', scale: 2, lifeTime: 100, vel: {x:0, y:-1}
       });
       spawnParticle({
         effectType: 'NOVA', pos: state.player.pos, radius: 150, color: '#fcd34d', lifeTime: 60
       });
       
       // Full heal
       state.player.stats!.hp = state.player.stats!.maxHp;
     }
  };

  // --- GAME LOOP ---

  const updatePhysics = () => {
    const state = gameStateRef.current;
    const input = inputRef.current;
    
    if (state.isGameOver || state.isPaused || state.isSkillTreeOpen) return;

    state.gameTime++;
    if (state.screenShake > 0) state.screenShake *= 0.9;

    // 1. Player Movement
    const baseSpeed = CLASS_STATS[state.player.classType!].speed;
    const speedMult = getStatMultiplier('speed');
    const currentSpeed = baseSpeed * speedMult;

    let dx = 0;
    let dy = 0;

    if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const mag = Math.sqrt(dx * dx + dy * dy);
      state.player.pos.x += (dx / mag) * currentSpeed;
      state.player.pos.y += (dy / mag) * currentSpeed;
    }

    // Passive Regen
    if (state.gameTime % 10 === 0) {
      const baseMaxEnergy = CLASS_STATS[state.player.classType!].maxEnergy;
      const energyMult = getStatMultiplier('maxEnergy');
      state.player.stats!.maxEnergy = baseMaxEnergy * energyMult;
      
      const unlockedHp = state.profile.unlockedTalents.reduce((acc, id) => {
        const t = TALENT_TREE.find(node => node.id === id);
        return acc + (t?.stat === 'maxHp' ? t.value : 0);
      }, 0);
      state.player.stats!.maxHp = CLASS_STATS[state.player.classType!].maxHp + unlockedHp;

      if (state.player.stats!.energy < state.player.stats!.maxEnergy) {
        state.player.stats!.energy = Math.min(
          state.player.stats!.maxEnergy, 
          state.player.stats!.energy + 3
        );
      }
    }

    // Cooldowns
    state.skills.forEach(skill => {
      if (skill.currentCooldown > 0) skill.currentCooldown--;
    });

    // 2. Input & Auto-Attack
    if (input.keys['Digit1']) activateSkill(0);
    if (input.keys['Digit2']) activateSkill(1);
    if (input.keys['Digit3']) activateSkill(2);
    
    const currentSkill = state.skills[state.activeSkillIndex];
    if (currentSkill && currentSkill.currentCooldown <= 0 && state.gameTime % 12 === 0) {
      const range = currentSkill.range || 600;
      const autoTarget = getNearestEnemy(range);
      if (autoTarget) {
         activateSkill(state.activeSkillIndex, autoTarget);
      }
    }

    // 3. Minions Logic
    for (let i = state.minions.length - 1; i >= 0; i--) {
       const m = state.minions[i];
       
       // Teleport if too far
       if (distance(m.pos, state.player.pos) > 700) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 100;
          m.pos.x = state.player.pos.x + Math.cos(angle) * dist;
          m.pos.y = state.player.pos.y + Math.sin(angle) * dist;
          spawnParticle({ effectType: 'SMOKE', pos: m.pos, color: COLORS.MINION_CONVERTED, radius: 20, lifeTime: 20 });
       }

       const target = getNearestEnemy(500); // Minion vision range
       
       // Check Buff Expiration
       if (m.buffs && m.buffs.expiresAt && state.gameTime > m.buffs.expiresAt) {
          // Clear only expired buffs if complex, but for now clear all
          m.buffs = undefined;
       }

       if (target) {
          const d = distance(m.pos, target.pos);
          
          // Move
          if ((m.behavior === 'CHASE' && d > 20) || (m.behavior === 'RANGED' && d > 250)) {
             const angle = Math.atan2(target.pos.y - m.pos.y, target.pos.x - m.pos.x);
             m.pos.x += Math.cos(angle) * m.stats!.speed;
             m.pos.y += Math.sin(angle) * m.stats!.speed;
          } else if (m.behavior === 'RANGED' && d < 150) {
             // Back away
             const angle = Math.atan2(target.pos.y - m.pos.y, target.pos.x - m.pos.x);
             m.pos.x -= Math.cos(angle) * (m.stats!.speed * 0.8);
             m.pos.y -= Math.sin(angle) * (m.stats!.speed * 0.8);
          }

          // Attack
          if (state.gameTime - (m.lastAttackTime || 0) > (m.behavior === 'CHASE' ? 40 : 80)) {
              // Buff Check
              const dmgBoost = (m.buffs?.isEmpowered) ? 1.5 : 1.0;

              if (m.behavior === 'CHASE' && d < 40) { // Increased range slightly for larger minions
                 const finalDmg = m.stats!.attack * dmgBoost;
                 target.stats!.hp -= finalDmg;
                 spawnDamageText(target.pos, finalDmg);
                 spawnParticle({ effectType: 'SLASH', pos: target.pos, radius: 15, color: '#d8b4fe', lifeTime: 10, rotation: Math.random() * Math.PI });
                 m.lastAttackTime = state.gameTime;
              } else if (m.behavior === 'RANGED' && d < 350) {
                 // Shoot arrow
                 const angle = Math.atan2(target.pos.y - m.pos.y, target.pos.x - m.pos.x);
                 state.projectiles.push({
                    id: `m_arrow_${Date.now()}_${Math.random()}`,
                    type: EntityType.PROJECTILE,
                    pos: { ...m.pos },
                    vel: { x: Math.cos(angle) * 8, y: Math.sin(angle) * 8 },
                    radius: 3,
                    color: '#d8b4fe',
                    ownerId: 'minion', // Friendly fire safe
                    damage: m.stats!.attack * dmgBoost,
                    lifeTime: 50,
                    maxLifeTime: 50
                 });
                 m.lastAttackTime = state.gameTime;
              }
          }
       } else {
          // Follow Player if no enemies
          const d = distance(m.pos, state.player.pos);
          if (d > 80) {
             const angle = Math.atan2(state.player.pos.y - m.pos.y, state.player.pos.x - m.pos.x);
             m.pos.x += Math.cos(angle) * (m.stats!.speed * 1.2);
             m.pos.y += Math.sin(angle) * (m.stats!.speed * 1.2);
          }
       }
       
       // Rotation for visuals (especially for SPEEDSTER type minions)
       if (m.subType === 'SPEEDSTER') m.rotation = (m.rotation || 0) + 0.2;

       // Minion Death?
       if (m.stats!.hp <= 0) {
          spawnParticle({ effectType: 'EXPLOSION', pos: m.pos, color: '#d8b4fe', radius: 20, lifeTime: 20 });
          state.minions.splice(i, 1);
       }
    }

    // 4. Enemies
    state.enemies.forEach(enemy => {
      // Target either player or minion
      const target = getNearestTarget(enemy.pos);
      const d = distance(enemy.pos, target.pos);

      // Check Buffs/Debuffs
      if (enemy.buffs && enemy.buffs.expiresAt && state.gameTime > enemy.buffs.expiresAt) {
          enemy.buffs = undefined;
      }

      // Apply Chill Slow
      let moveSpeed = enemy.stats!.speed;
      if (enemy.buffs?.isChilled) {
          moveSpeed *= 0.5;
      }

      // RANGED ENEMY BEHAVIOR
      if (enemy.behavior === 'RANGED') {
         const desiredDist = 300;
         if (d < desiredDist - 50) {
            // Retreat
            const angle = Math.atan2(target.pos.y - enemy.pos.y, target.pos.x - enemy.pos.x);
            enemy.pos.x -= Math.cos(angle) * moveSpeed * 0.8;
            enemy.pos.y -= Math.sin(angle) * moveSpeed * 0.8;
         } else if (d > desiredDist + 50) {
            // Approach
            const angle = Math.atan2(target.pos.y - enemy.pos.y, target.pos.x - enemy.pos.x);
            enemy.pos.x += Math.cos(angle) * moveSpeed;
            enemy.pos.y += Math.sin(angle) * moveSpeed;
         }

         // Shoot
         if (state.gameTime % 120 === 0 && d < 600) {
            const angle = Math.atan2(target.pos.y - enemy.pos.y, target.pos.x - enemy.pos.x);
            state.projectiles.push({
               id: `e_proj_${Date.now()}_${Math.random()}`,
               type: EntityType.PROJECTILE,
               pos: { ...enemy.pos },
               vel: { x: Math.cos(angle) * 6, y: Math.sin(angle) * 6 },
               radius: 5,
               color: '#fca5a5',
               ownerId: 'enemy',
               damage: enemy.stats!.attack,
               lifeTime: 80,
               maxLifeTime: 80
            });
         }

      } else {
         // MELEE BEHAVIOR
         if (d > enemy.radius + target.radius) {
           const angle = Math.atan2(target.pos.y - enemy.pos.y, target.pos.x - enemy.pos.x);
           enemy.pos.x += Math.cos(angle) * moveSpeed;
           enemy.pos.y += Math.sin(angle) * moveSpeed;
         } else {
           if (state.gameTime % 30 === 0) {
             const rawDmg = enemy.stats!.attack;
             
             if (target.type === EntityType.PLAYER) {
                const defMult = getStatMultiplier('defense');
                const defense = state.player.stats!.defense * defMult;
                let finalDmg = Math.max(1, rawDmg - (defense * 0.25));
                if (state.player.classType === ClassType.PALADIN && state.player.isShieldActive) {
                  finalDmg *= 0.4;
                  enemy.stats!.hp -= rawDmg * 0.5; // Reflection
                  spawnDamageText(enemy.pos, rawDmg * 0.5, true);
                  spawnParticle({ effectType: 'EXPLOSION', pos: state.player.pos, color: '#fbbf24', radius: 30, lifeTime: 10 });
                }
                target.stats!.hp -= finalDmg;
                spawnDamageText(target.pos, finalDmg, false);
                state.screenShake = 3;
             } else {
                // Minion takes damage
                let finalDmg = Math.max(1, rawDmg - (target.stats?.defense || 0));
                // Check Protection Aura
                if (target.buffs?.isProtected) {
                    finalDmg *= 0.5; // 50% damage reduction
                    spawnParticle({ effectType: 'GLOW', pos: target.pos, color: '#fcd34d', radius: 15, lifeTime: 10 });
                }
                target.stats!.hp -= finalDmg;
                spawnDamageText(target.pos, finalDmg, false);
             }
           }
         }
      }
      // Rotation for visuals
      if (enemy.subType === 'SPEEDSTER') enemy.rotation = (enemy.rotation || 0) + 0.2;
    });

    // 5. Projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const p = state.projectiles[i];
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.lifeTime = (p.lifeTime || 0) - 1;
      if (p.rotationSpeed) p.rotation = (p.rotation || 0) + p.rotationSpeed;
      
      // Trails
      if (state.gameTime % 2 === 0) {
         let trailPos = { x: p.pos.x, y: p.pos.y };
         // Offset trail for arrow to be at the tail
         if (p.effectType === 'ARROW') {
            const backDist = 10;
            trailPos.x -= Math.cos(p.rotation || 0) * backDist;
            trailPos.y -= Math.sin(p.rotation || 0) * backDist;
         }

         spawnParticle({ 
            effectType: 'GLOW', pos: trailPos, 
            vel: { x: 0, y: 0 }, color: p.color, radius: p.radius, lifeTime: 10, opacity: 0.3 
         });
      }

      // MECHANIC: Soul Projectile Wander
      if (p.behavior === 'WANDER') {
         // Randomly perturb velocity direction
         const angle = Math.atan2(p.vel.y, p.vel.x) + (Math.random() - 0.5) * 0.5;
         const speed = Math.sqrt(p.vel.x*p.vel.x + p.vel.y*p.vel.y);
         p.vel.x = Math.cos(angle) * speed;
         p.vel.y = Math.sin(angle) * speed;
      }

      // MECHANIC: Splitting
      if (p.canSplit && !p.hasSplit && p.lifeTime! < (p.maxLifeTime! * 0.7) && p.behavior !== 'BOOMERANG') {
          p.hasSplit = true;
          const speed = Math.sqrt(p.vel.x*p.vel.x + p.vel.y*p.vel.y);
          const currentAngle = Math.atan2(p.vel.y, p.vel.x);
          const splitLevel = getMechanicValue('SPLIT'); // 1 or 2
          
          // If splitLevel is 2, split into 3, else 2
          const count = splitLevel > 1 ? 3 : 2;
          const spread = 0.6;
          
          for(let k=0; k<count; k++) {
             const a = currentAngle - (spread/2) + (spread/(count-1))*k;
             state.projectiles.push({
               ...p,
               id: p.id + '_split_' + Math.random(),
               vel: { x: Math.cos(a) * speed, y: Math.sin(a) * speed },
               radius: p.radius * 0.8,
               damage: (p.damage || 10) * 0.7,
               hasSplit: true, // Cannot split again
               lifeTime: 30,
               pos: { ...p.pos },
               rotation: a
             });
          }
          state.projectiles.splice(i, 1);
          continue;
      }

      // MECHANIC: Boomerang Return
      if (p.behavior === 'BOOMERANG') {
        const halfLife = p.maxLifeTime! / 2;
        
        if (p.lifeTime! > halfLife) {
            // Outward Phase: Decelerate
            p.vel.x *= 0.92;
            p.vel.y *= 0.92;
            p.rotationSpeed = 0.4;
        } else {
            // Return Phase: Accelerate towards player
            const angle = Math.atan2(state.player.pos.y - p.pos.y, state.player.pos.x - p.pos.x);
            
            const timeReturning = halfLife - p.lifeTime!;
            const speed = 2 + (timeReturning * 1.0); // Acceleration
            
            p.vel.x = Math.cos(angle) * speed;
            p.vel.y = Math.sin(angle) * speed;
            p.rotationSpeed = 0.6;

            if (distance(p.pos, state.player.pos) < 20) { 
                state.projectiles.splice(i, 1); 
                continue; 
            }
        }
      }

      if (p.lifeTime! <= 0) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Collision Logic
      if (p.ownerId === 'player' || p.ownerId === 'minion') {
        // Player Projectile vs Enemy
        let hit = false;
        for (let j = 0; j < state.enemies.length; j++) {
          const enemy = state.enemies[j];
          if (distance(p.pos, enemy.pos) < (p.radius + enemy.radius)) {
            hit = true;
            
            // PRIEST CONVERSION LOGIC
            if (p.isConversion) {
                const { max, hp, dmg } = getMinionModifiers();
                if (state.minions.length < max) {
                    // Successful Convert
                    const enemyStats = enemy.stats!;
                    // We copy the enemy stats but apply the minion multiplier bonuses from talents
                    // This ensures high level enemies are strong minions
                    
                    state.minions.push({
                        id: `converted_${Date.now()}_${Math.random()}`,
                        type: EntityType.MINION,
                        pos: { ...enemy.pos },
                        vel: { x: 0, y: 0 },
                        radius: enemy.radius,
                        subType: enemy.subType, // COPY VISUAL
                        color: COLORS.MINION_CONVERTED,
                        ownerId: 'player',
                        // Map Enemy behaviors to Minion behaviors
                        behavior: enemy.behavior === 'RANGED' ? 'RANGED' : 'CHASE', 
                        stats: {
                            hp: enemyStats.maxHp * hp,
                            maxHp: enemyStats.maxHp * hp,
                            energy: 0, maxEnergy: 0,
                            attack: enemyStats.attack * dmg,
                            defense: enemyStats.defense,
                            speed: enemyStats.speed
                        },
                        rotation: enemy.rotation,
                        lastAttackTime: state.gameTime
                    });
                    
                    // Remove enemy
                    spawnParticle({ effectType: 'TEXT', pos: enemy.pos, text: "CONVERTED!", color: COLORS.PRIEST, scale: 1.5, lifeTime: 50, vel: {x:0, y:-1} });
                    spawnParticle({ effectType: 'NOVA', pos: enemy.pos, color: COLORS.PRIEST, radius: 50, lifeTime: 30 });
                    state.enemies.splice(j, 1);
                } else {
                    // Failed convert (cap reached), just deal damage
                    spawnParticle({ effectType: 'TEXT', pos: enemy.pos, text: "MAX MINIONS", color: '#9ca3af', lifeTime: 30, vel: {x:0, y:-1} });
                    enemy.stats!.hp -= (p.damage || 10);
                    spawnDamageText(enemy.pos, p.damage || 10);
                }
                
                state.projectiles.splice(i, 1);
                break; // Stop processing this projectile
            }

            // STANDARD DAMAGE LOGIC
            const didCrit = Math.random() < (state.player.stats!.critRate || 0.05);
            const critMult = didCrit ? (state.player.stats!.critDmg || 1.5) : 1;
            const finalDmg = (p.damage || 10) * critMult;

            enemy.stats!.hp -= finalDmg;
            spawnDamageText(enemy.pos, finalDmg, didCrit);
            spawnParticle({ effectType: 'EXPLOSION', pos: { ...enemy.pos }, radius: p.radius * 3, color: p.color, lifeTime: 15 });

            // MECHANIC: EXPLODE ON HIT
            if (p.explodeOnHit) {
               spawnParticle({ effectType: 'NOVA', pos: enemy.pos, radius: 50, color: '#ef4444', lifeTime: 10 });
               state.enemies.forEach(nearby => {
                  if (nearby !== enemy && distance(enemy.pos, nearby.pos) < 50) {
                     nearby.stats!.hp -= finalDmg * 0.5;
                  }
               });
            }

            // MECHANIC: BOUNCE
            if (p.bounces && p.bounces > 0) {
               p.bounces--;
               const nearby = getNearestEnemy(400);
               if (nearby && nearby.id !== enemy.id) {
                  const a = Math.atan2(nearby.pos.y - p.pos.y, nearby.pos.x - p.pos.x);
                  const s = Math.sqrt(p.vel.x*p.vel.x + p.vel.y*p.vel.y);
                  p.vel.x = Math.cos(a) * s;
                  p.vel.y = Math.sin(a) * s;
                  p.damage = (p.damage || 10) * 0.85; 
                  p.rotation = a; // Update rotation
               } else {
                 p.vel.x = -p.vel.x;
                 p.vel.y = -p.vel.y;
                 p.rotation = (p.rotation || 0) + Math.PI;
               }
               hit = false; // Keep projectile alive
            } else if (p.behavior !== 'BOOMERANG') {
               state.projectiles.splice(i, 1);
               j = state.enemies.length; // break inner
            }
            if (hit && p.behavior !== 'BOOMERANG') break;
          }
        }
      } else if (p.ownerId === 'enemy') {
         // Enemy Projectile vs Player/Minion
         const targets = [state.player, ...state.minions];
         for (const target of targets) {
             if (distance(p.pos, target.pos) < (p.radius + target.radius)) {
                 let incDmg = (p.damage || 5);
                 if (target.type === EntityType.MINION && target.buffs?.isProtected) {
                    incDmg *= 0.5;
                 }
                 target.stats!.hp -= incDmg;
                 spawnDamageText(target.pos, incDmg, false);
                 spawnParticle({ effectType: 'EXPLOSION', pos: p.pos, color: '#ef4444', radius: 10, lifeTime: 10 });
                 state.projectiles.splice(i, 1);
                 break;
             }
         }
      }
    }

    // 6. Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
       const part = state.particles[i];
       part.lifeTime = (part.lifeTime || 0) - 1;
       part.pos.x += part.vel.x;
       part.pos.y += part.vel.y;
       if (part.maxLifeTime) part.opacity = part.lifeTime! / part.maxLifeTime;
       if (part.lifeTime! <= 0) state.particles.splice(i, 1);
    }
    
    // 7. Cleanup
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      if (state.enemies[i].stats!.hp <= 0) {
        gainXp(20 * state.wave);
        state.score += 100 * state.wave;
        spawnParticle({ effectType: 'EXPLOSION', pos: state.enemies[i].pos, color: '#7f1d1d', radius: 40, lifeTime: 25 });
        state.enemies.splice(i, 1);
      }
    }

    if (state.enemies.length === 0) {
      state.wave++;
      onLogUpdate(`Wave ${state.wave} approaching...`);
      spawnEnemy(3 + Math.ceil(state.wave * 1.5));
    }

    if (state.player.stats!.hp <= 0) {
      state.isGameOver = true;
      // Pass the profile back up
      onGameOver(state.score, state.profile);
    }
  };

  // --- RENDER ---
  const draw = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    
    const cx = state.player.pos.x - CANVAS_WIDTH / 2;
    const cy = state.player.pos.y - CANVAS_HEIGHT / 2;

    // Screen Shake
    const shakeX = (Math.random() - 0.5) * state.screenShake;
    const shakeY = (Math.random() - 0.5) * state.screenShake;

    ctx.fillStyle = COLORS.GROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.save();
    ctx.translate(-cx + shakeX, -cy + shakeY);

    // Grid
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    const gridSize = 100;
    const startX = Math.floor(cx / gridSize) * gridSize;
    const startY = Math.floor(cy / gridSize) * gridSize;
    
    ctx.beginPath();
    for (let x = startX; x < cx + CANVAS_WIDTH + gridSize; x += gridSize) {
      ctx.moveTo(x, cy - 100);
      ctx.lineTo(x, cy + CANVAS_HEIGHT + 100);
    }
    for (let y = startY; y < cy + CANVAS_HEIGHT + gridSize; y += gridSize) {
      ctx.moveTo(cx - 100, y);
      ctx.lineTo(cx + CANVAS_WIDTH + 100, y);
    }
    ctx.stroke();

    // Entities
    [...state.minions, ...state.enemies, state.player, ...state.projectiles].forEach(entity => {
      ctx.shadowBlur = 0;
      
      // Glow for player/projectiles
      if (entity.type === EntityType.PROJECTILE || entity.id === 'player') {
         ctx.shadowBlur = 10;
         ctx.shadowColor = entity.color;
      }

      // DISTINCT SHAPES FOR ENEMIES AND CONVERTED MINIONS
      if (entity.type === EntityType.ENEMY || (entity.type === EntityType.MINION && entity.subType)) {
         ctx.fillStyle = entity.color;
         ctx.beginPath();

         if (entity.subType === 'BOSS') {
            // Spiky shape
            const spikes = 8;
            const outerRadius = entity.radius;
            const innerRadius = entity.radius / 2;
            for (let i = 0; i < spikes * 2; i++) {
                const r = (i % 2 === 0) ? outerRadius : innerRadius;
                const a = (Math.PI * i) / spikes + (entity.rotation || 0);
                const px = entity.pos.x + Math.cos(a) * r;
                const py = entity.pos.y + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
         } else if (entity.subType === 'SPEEDSTER') {
            // Triangle
            const r = entity.radius;
            const rot = entity.rotation || 0;
            for (let i = 0; i < 3; i++) {
               const a = rot + (i * 2 * Math.PI) / 3;
               const px = entity.pos.x + Math.cos(a) * r;
               const py = entity.pos.y + Math.sin(a) * r;
               if (i === 0) ctx.moveTo(px, py);
               else ctx.lineTo(px, py);
            }
            ctx.closePath();
         } else if (entity.subType === 'TANK') {
            // Square / Box
            const r = entity.radius;
            ctx.rect(entity.pos.x - r, entity.pos.y - r, r * 2, r * 2);
         } else if (entity.subType === 'RANGER') {
            // Diamond
            const r = entity.radius;
            ctx.moveTo(entity.pos.x, entity.pos.y - r * 1.2);
            ctx.lineTo(entity.pos.x + r * 0.8, entity.pos.y);
            ctx.lineTo(entity.pos.x, entity.pos.y + r * 1.2);
            ctx.lineTo(entity.pos.x - r * 0.8, entity.pos.y);
            ctx.closePath();
         } else {
            // Basic Circle
            ctx.arc(entity.pos.x, entity.pos.y, entity.radius, 0, Math.PI * 2);
         }
         ctx.fill();

         // Chill Visual
         if (entity.buffs?.isChilled) {
            ctx.fillStyle = 'rgba(186, 230, 253, 0.5)'; // Light blue overlay
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();
         }

      } else if (entity.effectType === 'ARROW') {
         ctx.save();
         ctx.translate(entity.pos.x, entity.pos.y);
         ctx.rotate(entity.rotation || 0);
         
         // Arrowhead
         ctx.fillStyle = entity.color;
         ctx.beginPath();
         ctx.moveTo(8, 0);
         ctx.lineTo(-4, 5);
         ctx.lineTo(-4, -5);
         ctx.fill();

         // Shaft
         ctx.strokeStyle = entity.color;
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.moveTo(8, 0);
         ctx.lineTo(-12, 0);
         ctx.stroke();

         // Fletching
         ctx.beginPath();
         ctx.moveTo(-12, 0);
         ctx.lineTo(-16, 4);
         ctx.moveTo(-12, 0);
         ctx.lineTo(-16, -4);
         ctx.stroke();

         ctx.restore();
      } else {
         // Standard rendering for others (Player, Projectiles, Generic Minions)
         ctx.fillStyle = entity.color;
         ctx.beginPath();
         ctx.arc(entity.pos.x, entity.pos.y, entity.radius, 0, Math.PI * 2);
         ctx.fill();
      }

      if (entity.id === 'player' && entity.isShieldActive) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbbf24';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(entity.pos.x, entity.pos.y, entity.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Minion Indicators & Buffs
      if (entity.type === EntityType.MINION) {
          // Buff Aura
          if (entity.buffs?.isProtected) {
              ctx.strokeStyle = '#fcd34d';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(entity.pos.x, entity.pos.y, entity.radius + 5, 0, Math.PI * 2);
              ctx.stroke();
          }

          ctx.font = '12px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.fillText(entity.behavior === 'CHASE' ? '⚔️' : '🏹', entity.pos.x, entity.pos.y + 4);
      }
      
      ctx.shadowBlur = 0; // Reset

      // HP Bar
      if ((entity.type === EntityType.ENEMY || entity.type === EntityType.MINION) && entity.stats) {
         const hpPct = Math.max(0, entity.stats.hp / entity.stats.maxHp);
         ctx.fillStyle = '#000';
         ctx.fillRect(entity.pos.x - 15, entity.pos.y - 25, 30, 4);
         ctx.fillStyle = entity.type === EntityType.MINION ? '#a855f7' : '#ef4444';
         ctx.fillRect(entity.pos.x - 15, entity.pos.y - 25, 30 * hpPct, 4);
      }
    });

    // Particles
    state.particles.forEach(p => {
       ctx.globalAlpha = p.opacity || 1;
       
       if (p.effectType === 'TEXT') {
         ctx.fillStyle = p.color;
         ctx.shadowBlur = 5;
         ctx.shadowColor = 'black';
         ctx.font = `bold ${16 * (p.scale || 1)}px monospace`;
         ctx.fillText(p.text || '', p.pos.x, p.pos.y);
       } else if (p.effectType === 'LIGHTNING' && p.targetPos) {
         // Main Bolt
         ctx.strokeStyle = p.color;
         ctx.lineWidth = 3;
         ctx.shadowBlur = 15;
         ctx.shadowColor = p.color;
         
         const segments = 6;
         
         // Helper to draw a jagged line
         const drawBolt = (offsetMagnitude: number, width: number, opacity: number) => {
            ctx.lineWidth = width;
            ctx.globalAlpha = opacity;
            ctx.beginPath();
            ctx.moveTo(p.pos.x, p.pos.y);
            let currX = p.pos.x;
            let currY = p.pos.y;
            for(let i=1; i<=segments; i++) {
               const t = i / segments;
               const targetX = p.pos.x + (p.targetPos!.x - p.pos.x) * t;
               const targetY = p.pos.y + (p.targetPos!.y - p.pos.y) * t;
               
               // Add noise
               const noiseX = (Math.random() - 0.5) * offsetMagnitude;
               const noiseY = (Math.random() - 0.5) * offsetMagnitude;
               
               // If it's the last point, snap to target
               const nextX = i === segments ? p.targetPos!.x : targetX + noiseX;
               const nextY = i === segments ? p.targetPos!.y : targetY + noiseY;
               
               ctx.lineTo(nextX, nextY);
               currX = nextX;
               currY = nextY;
            }
            ctx.stroke();
         };

         drawBolt(30, 3, 1); // Main
         drawBolt(50, 1, 0.6); // Tendril 1
         drawBolt(50, 1, 0.6); // Tendril 2

       } else if (p.effectType === 'SLASH') {
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(p.rotation || 0);
          ctx.strokeStyle = p.color || '#fff';
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color || '#fff';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, -Math.PI/3, Math.PI/3);
          ctx.stroke();
          ctx.restore();
       } else if (p.effectType === 'ARROW_FALL') {
           ctx.save();
           ctx.strokeStyle = p.color;
           ctx.lineWidth = 2;
           ctx.shadowBlur = 5;
           ctx.shadowColor = p.color;
           
           ctx.beginPath();
           // Shaft
           ctx.moveTo(p.pos.x, p.pos.y - 25);
           ctx.lineTo(p.pos.x, p.pos.y);
           // Head
           ctx.lineTo(p.pos.x - 4, p.pos.y - 8);
           ctx.moveTo(p.pos.x, p.pos.y);
           ctx.lineTo(p.pos.x + 4, p.pos.y - 8);
           // Fletching
           ctx.moveTo(p.pos.x, p.pos.y - 25);
           ctx.lineTo(p.pos.x - 3, p.pos.y - 30);
           ctx.moveTo(p.pos.x, p.pos.y - 25);
           ctx.lineTo(p.pos.x + 3, p.pos.y - 30);
           ctx.stroke();
           
           ctx.restore();
       } else if (p.effectType === 'WIND_RING') {
           ctx.beginPath();
           ctx.strokeStyle = p.color; 
           ctx.lineWidth = 2;
           // Expand radius over time
           const expansion = (p.maxLifeTime! - p.lifeTime!) * 3;
           ctx.arc(p.pos.x, p.pos.y, p.radius + expansion, 0, Math.PI * 2);
           ctx.stroke();
       } else if (p.effectType === 'SNOWFLAKE') {
           ctx.save();
           ctx.translate(p.pos.x, p.pos.y);
           // Spin the snowflake
           const spin = (p.maxLifeTime! - p.lifeTime!) * 0.1;
           ctx.rotate(spin);
           
           ctx.strokeStyle = p.color;
           ctx.lineWidth = 2;
           ctx.beginPath();
           for(let k=0; k<3; k++) {
               ctx.rotate(Math.PI / 3);
               ctx.moveTo(-p.radius, 0);
               ctx.lineTo(p.radius, 0);
           }
           ctx.stroke();
           ctx.restore();

       } else if (p.effectType === 'EXPLOSION' || p.effectType === 'NOVA') {
         ctx.fillStyle = p.color;
         ctx.shadowBlur = 15;
         ctx.shadowColor = p.color;
         ctx.beginPath();
         ctx.arc(p.pos.x, p.pos.y, p.radius * (1 - (p.lifeTime!/p.maxLifeTime!)*0.5), 0, Math.PI * 2);
         ctx.fill();
       } else {
         ctx.fillStyle = p.color;
         if (p.effectType === 'GLOW') {
             ctx.globalCompositeOperation = 'lighter';
             ctx.shadowBlur = 10;
             ctx.shadowColor = p.color;
         }
         ctx.beginPath();
         ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
         ctx.fill();
         ctx.globalCompositeOperation = 'source-over';
       }
       ctx.shadowBlur = 0;
       ctx.globalAlpha = 1;
    });

    ctx.restore();
  };

  const loop = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        updatePhysics();
        draw(ctx);
      }
    }
    
    if (gameStateRef.current.gameTime % 10 === 0) {
       const s = gameStateRef.current;
       setUiStats({
          hp: s.player.stats!.hp,
          maxHp: s.player.stats!.maxHp,
          energy: s.player.stats!.energy,
          maxEnergy: s.player.stats!.maxEnergy,
          skills: [...s.skills],
          wave: s.wave,
          score: s.score,
          activeSkillIndex: s.activeSkillIndex,
          level: s.profile.level,
          xp: s.profile.xp,
          xpToNext: s.profile.xpToNextLevel,
          skillPoints: s.profile.skillPoints,
          isSkillTreeOpen: s.isSkillTreeOpen,
          unlockedTalents: s.profile.unlockedTalents
       });
    }

    requestRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    spawnEnemy(3);
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [loop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       if (e.code === 'KeyK') {
         gameStateRef.current.isSkillTreeOpen = !gameStateRef.current.isSkillTreeOpen;
         setUiStats(prev => ({...prev, isSkillTreeOpen: gameStateRef.current.isSkillTreeOpen}));
       }
       inputRef.current.keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => inputRef.current.keys[e.code] = false;
    const handleMouseMove = (e: MouseEvent) => {
       const rect = canvasRef.current?.getBoundingClientRect();
       if (rect) {
         inputRef.current.mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
       }
    };
    const handleMouseDown = () => inputRef.current.mouseDown = true;
    const handleMouseUp = () => inputRef.current.mouseDown = false;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleTalentToggle = (id: string) => {
    const state = gameStateRef.current;
    const talent = TALENT_TREE.find(t => t.id === id);
    if (!talent) return;

    const isUnlocked = state.profile.unlockedTalents.includes(id);

    if (isUnlocked) {
       // Refund Logic
       // Check for dependent nodes that are currently unlocked
       const hasDependents = state.profile.unlockedTalents.some(tid => {
          const t = TALENT_TREE.find(node => node.id === tid);
          return t?.prereq === id;
       });

       if (hasDependents) {
          // Cannot refund because other nodes depend on this one
          // In a full UI we'd show a toast message here
          return; 
       }

       // Refund
       state.profile.skillPoints += talent.cost;
       state.profile.unlockedTalents = state.profile.unlockedTalents.filter(tid => tid !== id);

       // Immediate Stat Corrections (for flat bonuses like HP)
       // MaxHP is mostly handled in the update loop, but we should clamp current HP immediately
       // to prevent having more HP than Max.
       if (talent.effectType === 'STAT' && talent.stat === 'maxHp') {
          // We let the loop recalculate proper maxHp, but we force a quick check
          const currentBonus = state.profile.unlockedTalents.reduce((acc, tid) => {
             const t = TALENT_TREE.find(node => node.id === tid);
             return acc + (t?.stat === 'maxHp' ? t.value : 0);
          }, 0);
          const newMax = CLASS_STATS[state.player.classType!].maxHp + currentBonus;
          if (state.player.stats!.hp > newMax) {
             state.player.stats!.hp = newMax;
          }
       }

    } else {
       // Unlock Logic
       if (talent.prereq && !state.profile.unlockedTalents.includes(talent.prereq)) return;
       if (state.profile.skillPoints < talent.cost) return;

       state.profile.skillPoints -= talent.cost;
       state.profile.unlockedTalents.push(id);
       
       // Immediate Bonus for flat HP
       if (talent.effectType === 'STAT' && talent.stat === 'maxHp') {
          state.player.stats!.hp += talent.value;
          state.player.stats!.maxHp += talent.value;
       }
    }

    setUiStats(prev => ({
       ...prev,
       skillPoints: state.profile.skillPoints,
       unlockedTalents: [...state.profile.unlockedTalents]
    }));
  };

  return (
    <div className="relative w-full h-full">
       <canvas 
         ref={canvasRef}
         width={CANVAS_WIDTH}
         height={CANVAS_HEIGHT}
         className="bg-slate-900 shadow-2xl rounded-lg cursor-crosshair"
       />
       
       {/* HUD */}
       <div className="absolute bottom-4 left-4 right-4 flex gap-4 text-white pointer-events-none">
          {/* HP/Energy */}
          <div className="flex-1 bg-slate-900/80 p-4 rounded border border-slate-700">
             <div className="mb-2 flex justify-between text-sm font-bold">
                <span className="text-red-400">HP {Math.floor(uiStats.hp)}/{Math.floor(uiStats.maxHp)}</span>
                <span className="text-blue-400">MP {Math.floor(uiStats.energy)}/{Math.floor(uiStats.maxEnergy)}</span>
             </div>
             <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${(uiStats.hp/uiStats.maxHp)*100}%`}} />
             </div>
             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-200" style={{ width: `${(uiStats.energy/uiStats.maxEnergy)*100}%`}} />
             </div>
          </div>

          {/* Skills */}
          <div className="flex gap-2 items-center bg-slate-900/80 p-2 rounded border border-slate-700">
             {uiStats.skills.map((skill, idx) => (
                <div key={skill.id} className={`relative w-12 h-12 flex items-center justify-center bg-slate-800 border-2 ${uiStats.activeSkillIndex === idx ? 'border-yellow-500' : 'border-slate-600'} rounded`}>
                   <span className="text-2xl">{skill.icon}</span>
                   <span className="absolute top-0 left-1 text-xs text-slate-400">{idx+1}</span>
                   {skill.currentCooldown > 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold">
                         {Math.ceil(skill.currentCooldown / 60)}s
                      </div>
                   )}
                </div>
             ))}
          </div>
          
          {/* Level/XP */}
          <div className="bg-slate-900/80 p-4 rounded border border-slate-700 text-center min-w-[150px]">
             <div className="text-xs text-slate-400">Level {uiStats.level}</div>
             <div className="h-1 w-full bg-slate-700 mt-1 mb-1">
                <div className="h-full bg-yellow-500" style={{ width: `${(uiStats.xp / uiStats.xpToNext) * 100}%` }} />
             </div>
             <div className="text-xs text-yellow-300 font-bold">
                {uiStats.skillPoints > 0 ? `${uiStats.skillPoints} SP Available (Press K)` : 'Ascension Tree (K)'}
             </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded border border-slate-700 text-center">
             <div className="text-2xl font-black text-slate-200">{uiStats.score}</div>
             <div className="text-xs text-slate-500 uppercase">Score</div>
          </div>
       </div>

       {/* Skill Tree Overlay */}
       {uiStats.isSkillTreeOpen && (
          <div className="absolute inset-0 pointer-events-auto">
             <SkillTree 
               skillPoints={uiStats.skillPoints}
               unlockedTalents={uiStats.unlockedTalents}
               onUnlock={handleTalentToggle}
               onClose={() => {
                  gameStateRef.current.isSkillTreeOpen = false;
                  setUiStats(prev => ({...prev, isSkillTreeOpen: false}));
               }}
             />
          </div>
       )}
    </div>
  );
};

export default GameCanvas;
