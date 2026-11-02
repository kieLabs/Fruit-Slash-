import { BLADES } from './blades.js';

export const BACKGROUNDS = [
  { id:'dojo', name:'Classic Dojo', cost:0, a:'#102c35', b:'#07151e', accent:'#48cbb4' },
  { id:'tropical', name:'Tropical Paradise', cost:160, a:'#0d514e', b:'#102c32', accent:'#f1c86c' },
  { id:'neon', name:'Neon Arena', cost:220, a:'#1e1747', b:'#070d27', accent:'#e85aff' },
  { id:'garden', name:'Japanese Garden', cost:260, a:'#173f37', b:'#071e20', accent:'#db9c9e' },
  { id:'beach', name:'Sunset Beach', cost:320, a:'#7b3d49', b:'#211b37', accent:'#ffc16e' },
  { id:'frozen', name:'Frozen World', cost:400, a:'#174e70', b:'#081b36', accent:'#b7f5ff' },
  { id:'lava', name:'Lava Arena', cost:480, a:'#5b231e', b:'#1e0c18', accent:'#ff7c42' },
  { id:'galaxy', name:'Space Galaxy', cost:580, a:'#241744', b:'#090d2b', accent:'#8c8cff' },
  { id:'temple', name:'Golden Temple', cost:700, a:'#51401f', b:'#171923', accent:'#ffd77b' },
  { id:'cyber', name:'Cyber Arena', cost:850, a:'#073d49', b:'#071a2c', accent:'#28f0dd' }
];

export function getShopItems(category) {
  if (category === 'blades') return BLADES;
  if (category === 'backgrounds') return BACKGROUNDS;
  if (category === 'effects') return [
    {id:'classic',name:'Classic Juice',cost:0,description:'Clean fruit splash'},
    {id:'neon',name:'Neon Burst',cost:180,description:'Bright glowing particles'},
    {id:'confetti',name:'Confetti Pop',cost:260,description:'Colorful celebratory effects'}
  ];
  if (category === 'powerups') return [
    {id:'freeze',name:'Freeze Time',cost:35,description:'One use'},
    {id:'double',name:'Double Points',cost:45,description:'One use'},
    {id:'frenzy',name:'Frenzy Mode',cost:55,description:'One use'},
    {id:'slow',name:'Slow Motion',cost:40,description:'One use'},
    {id:'mega',name:'Mega Combo',cost:70,description:'One use'},
    {id:'life',name:'Extra Life',cost:90,description:'One use · Classic / Challenge / Survival'},
    {id:'blade',name:'Special Blade',cost:85,description:'One use · temporary rainbow blade trail'}
  ];
  return [
    {id:'mint',name:'Mint Theme',cost:0,description:'Fresh GamerKie mint'},
    {id:'sunset',name:'Sunset Theme',cost:180,description:'Warm arcade glow'},
    {id:'electric',name:'Electric Theme',cost:320,description:'High-voltage colors'}
  ];
}

export function purchaseItem(save, category, item) {
  let ownedKey, equipKey;
  if (category === 'blades') { ownedKey = 'unlockedBlades'; equipKey = 'equippedBlade'; }
  else if (category === 'backgrounds') { ownedKey = 'unlockedBackgrounds'; equipKey = 'equippedBackground'; }
  else if (category === 'effects') { ownedKey = 'unlockedEffects'; equipKey = 'equippedEffect'; }
  else if (category === 'themes') { ownedKey = 'unlockedThemes'; equipKey = 'equippedTheme'; }
  else if (category === 'powerups') {
    if (save.coins < item.cost) return { ok:false, reason:'Not enough coins.' };
    save.coins -= item.cost; save.powerupInventory ||= {}; save.powerupInventory[item.id] = (save.powerupInventory[item.id] || 0) + 1;
    return { ok:true, purchased:true, consumable:true };
  }
  else return { ok:false, reason:'Unknown shop category.' };
  if (save[ownedKey].includes(item.id)) {
    if (equipKey) save[equipKey] = item.id;
    return { ok:true, equipped:true };
  }
  if (save.coins < item.cost) return { ok:false, reason:'Not enough coins.' };
  save.coins -= item.cost;
  save[ownedKey].push(item.id);
  if (equipKey) save[equipKey] = item.id;
  return { ok:true, purchased:true };
}
