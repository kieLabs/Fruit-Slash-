export const MODES = {
  classic: { id:'classic', name:'Classic', subtitle:'Three lives. No mistakes.', icon:'🍉', lives:3, timed:false, bombs:true, missesCostLife:true, levelled:true, description:'Slice fruit, avoid bombs and complete your level target.' },
  arcade: { id:'arcade', name:'Arcade', subtitle:'60 seconds of fruit frenzy.', icon:'⚡', lives:0, timed:true, duration:60, bombs:true, missesCostLife:false, levelled:false, description:'Score as much as you can before the timer runs out.' },
  zen: { id:'zen', name:'Zen', subtitle:'Relax. Slice. Find your flow.', icon:'🌸', lives:0, timed:false, bombs:false, missesCostLife:false, levelled:false, description:'No bombs and no lives. Just satisfying fruit slicing.' },
  survival: { id:'survival', name:'Survival', subtitle:'The waves never stop.', icon:'🔥', lives:1, timed:false, bombs:true, missesCostLife:false, levelled:false, description:'Endless waves with rising speed and dangerous bomb patterns.' },
  challenge: { id:'challenge', name:'Challenge', subtitle:'Complete the objective.', icon:'🎯', lives:2, timed:true, duration:45, bombs:true, missesCostLife:false, levelled:true, description:'Short missions test accuracy, combos and special-fruit skill.' }
};

export function getMode(id) { return MODES[id] || MODES.classic; }
