/**
 * Heritable personal aptitudes independent of ethnicity.
 * These are rolled on each parent, then may pass to the child
 * as parent_trait_* tags with an explicit bloodline reason.
 */

function p(id, label, description, hooks, statMods = {}) {
  return {
    id,
    tag: `parent_trait_${id}`,
    label,
    description,
    hooks,
    statMods,
    inheritChance: 0.46,
  };
}

export const PARENT_APTITUDE_DATABASE = [
  p("math_aptitude", "數量直覺", "心算、估量與符號排列來得比同齡人快。", ["study", "trade"], { intelligence: 3 }),
  p("verbal_aptitude", "語文天分", "記詞、對仗與說服的句子來得自然。", ["language", "social"], { intelligence: 2, charm: 1 }),
  p("spatial_aptitude", "空間推理", "在腦子裡旋轉結構、路線與機械。", ["craft", "navigation"], { intelligence: 2 }),
  p("musical_aptitude", "音準與節奏", "音高、節拍與和聲的身體記憶強。", ["art", "sensory"], { charm: 2, mood: 1 }),
  p("visual_art", "造型眼", "對比例、顏色與構圖的偏差極敏感。", ["art", "craft"], { charm: 2, intelligence: 1 }),
  p("athletic_burst", "爆發體能", "短跑、跳躍與瞬間發力佔優。", ["health"], { health: 3 }),
  p("athletic_endurance", "有氧底盤", "長時間勞動或奔跑不易迅速崩掉。", ["health", "travel"], { health: 3 }),
  p("fine_motor", "精細肌群", "針線、樂器、修理的小動作穩。", ["craft"], { intelligence: 1, wealth: 1 }),
  p("social_empathy", "情緒讀臉", "能很快察覺房間裡沒說出口的氣氛。", ["social"], { charm: 3 }),
  p("mechanical_intuition", "機具直覺", "對槓桿、齒輪與「哪裡會壞」有畫面。", ["craft", "labor"], { intelligence: 2 }),
  p("memory_rote", "強記", "名單、路順與口訣能整段背下。", ["memory", "study"], { intelligence: 2 }),
  p("language_ear", "語音模仿", "口音學得快，腔調學得像。", ["language"], { charm: 2, intelligence: 1 }),
  p("culinary_sense", "味覺記憶", "能拆解氣味與火候。", ["health", "social"], { charm: 1, mood: 1 }),
  p("leadership_presence", "場勢", "開口時別人會先停一下。", ["social"], { charm: 3 }),
  p("pain_stoic", "痛感忍耐", "對慢性勞損與短痛的抱怨閾較高。", ["health", "labor"], { health: 2, mood: 1 }),
  p("night_focus", "夜醒專注", "在別人想睡的時段仍能把事情做完。", ["study", "labor"], { intelligence: 1, mood: -1 }),
  p("green_thumb", "植物手感", "對土壤乾濕與病葉的判斷快。", ["survival", "craft"], { wealth: 1, mood: 1 }),
  p("animal_calm", "撫畜", "動物在他身邊比較不炸毛。", ["animals", "social"], { charm: 2 }),
  p("absolute_pitch", "絕對音感", "不靠參照音也能叫出音高。", ["art", "sensory"], { intelligence: 1, charm: 1 }),
  p("calm_hands", "穩手", "緊張時手仍不抖，適合縫補、止血、上膛。", ["craft", "health"], { health: 1, intelligence: 1 }),
];

export const PARENT_APTITUDE_BY_ID = Object.fromEntries(
  PARENT_APTITUDE_DATABASE.map((item) => [item.id, item]),
);
