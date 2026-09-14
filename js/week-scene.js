/**
 * Unified fortnight scene — one pressure, one chronicle paragraph, three stake-tied choices.
 * Chronicle and options are minted from the same scene so they stay causal.
 */
import { scanNarrativeFacts } from "./narrative-facts.js";
import { isMemeLegendCharacter } from "./meme-chronicle.js";
import { scrubPublicText } from "./data/public-text.js";
import { MATURE_ADULT_MIN } from "./data/age-gate-rules.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import { textsTooSimilar } from "./choice-similarity.js";

function roll01(rng) {
  return typeof rng === "function" ? rng() : Math.random();
}

function pick(rng, list = []) {
  if (!list.length) return "";
  return list[Math.floor(roll01(rng) * list.length) % list.length];
}

function seal(text) {
  const raw = scrubPublicText(String(text || "").trim());
  if (!raw) return "";
  return /[。！？]$/.test(raw) ? raw : `${raw}。`;
}

function joinPara(parts = []) {
  const out = [];
  const seen = new Set();
  for (const part of parts) {
    const line = seal(part);
    if (!line) continue;
    const key = line.slice(0, 18);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line.replace(/。$/, ""));
  }
  return out.length ? `${out.join("。")}。` : "";
}

function foodBit(facts = {}, pressure = "") {
  if (facts.hungry || facts.edema || facts.poor || /hunger|scarce|meme_scarce/.test(String(pressure))) {
    if (/japan|korea|east.?asia/i.test(String(facts.region || ""))) return "冷飯或稀粥";
    if (Number(facts.year || 0) >= 1980) return "還能進口的東西";
    return "冷饅頭或稀粥";
  }
  return "這一週的糧";
}

function whoBit(facts = {}) {
  if (facts.motherAlive && facts.motherName) return `母親${facts.motherName}`;
  if (facts.fatherAlive && facts.fatherName) return `父親${facts.fatherName}`;
  if (facts.motherAlive) return "母親";
  if (facts.fatherAlive) return "父親";
  return Number(facts.age || 0) >= MATURE_ADULT_MIN ? "還同住的人" : "家裏還能走動的人";
}

function eraPulse(facts = {}) {
  return facts.pulseTitle || facts.upheavalLabel || "";
}

function inferPressure(ctx = {}, facts = {}, options = []) {
  const situations = (options || []).map((row) => String(row?.situation || "")).filter(Boolean);
  const enc = String(ctx.weekEncounter?.pressure || "");
  if (isMemeLegendCharacter(ctx.character)) {
    const id = ctx.character.specialPresetId;
    if (situations.includes("illness")) return "meme_illness";
    if (situations.includes("hunger") || situations.includes("money")) return "meme_scarce";
    if (id === "ricardo_milos") return "meme_ricardo";
    if (id === "billy_herrington") return "meme_billy";
    return "meme_tadokoro";
  }
  if (enc === "hunger" || situations.includes("hunger") || facts.hungry || facts.edema) return "hunger";
  if (enc === "illness" || situations.includes("illness") || facts.fever || (facts.health != null && facts.health <= 32)) {
    return "illness";
  }
  if (enc === "papers" || enc === "war") return enc;
  if (situations.includes("money") || facts.poor) return "money";
  if (situations.includes("labor") && Number(facts.age || 0) >= MATURE_ADULT_MIN) return "labor";
  if (enc === "family" || situations.includes("family") || Number(facts.age || 0) < 13) return "family";
  if (situations.includes("labor")) return "labor";
  return enc || "daily";
}

function memeChronicle(rng, facts, pressure, id) {
  const city = facts.city || "此地";
  const year = facts.year || "";
  const age = facts.age ?? 24;
  const name = facts.name || "他";
  const pulse = eraPulse(facts);
  const pulseBit = pulse ? `街上還在傳${pulse}` : `${year}年的空氣比班表更吵`;
  if (id === "ricardo_milos") {
    return joinPara([
      pick(rng, [
        `${year}年的${city}，陽光比規矩先到。${age} 歲的${name}把紅色頭巾與巴西森巴踩進坡道，香蕉皮在石階上閃過又被踢開`,
        `${year}年，${city}港口風把汗味與熱帶果香吹成同一條節奏。${name}不簽班表，卻把整條坡道跳成舞台`,
      ]),
      pressure === "meme_scarce"
        ? `這兩週掌聲能換小費，也能換下一頓；收住腳步，就先輸了絕對自由`
        : `這兩週旁人議論規矩，他只議論下一拍從哪裡起——${pulseBit}`,
    ]);
  }
  if (id === "billy_herrington") {
    return joinPara([
      pick(rng, [
        `${year}年的${city}，體育館燈與摔角墊的味道比街燈更早叫醒人。${age} 歲的${name}把兄貴氣寫在肩線上`,
        `${year}年，${city}。哲學一句、摔角一記、義氣一聲，都能把困境看穿；溫柔不軟，重情不散`,
      ]),
      pressure === "meme_scarce"
        ? `這兩週鐵杠與工錢同一張帳：扛住能換掌聲與人情，鬆手就丟這一季的名聲`
        : `同伴低谷時他先伸手——${pulseBit}，勝負可以後算`,
    ]);
  }
  // tadokoro default
  return joinPara([
    pick(rng, [
      `${year}年的${city}，夜班燈把惡臭名場面的傳聞又照亮一截。${age} 歲的${name}夾著夏蜜柑的酸氣，按野獸先輩的走法過活`,
      `這兩週是${year}年，${city}。打工班表與窄巷汽笛同在，黑色幽默比薪水先到帳本`,
    ]),
    pressure === "meme_illness"
      ? `燒還沒退，班表卻不等；留下賭扣薪與惡名，走了賭下一頓還沒著落`
      : `這兩週留下就賭罰金與惡名，走了就賭下一頓還沒著落——${pulseBit}`,
  ]);
}

function normalChronicle(rng, facts, pressure) {
  const year = facts.year || "";
  const city = facts.city || "此地";
  const place = facts.place || city;
  const age = facts.age || 0;
  const cls = facts.classLabel || "未登記";
  const house = facts.housing || "屋裏";
  const who = whoBit(facts);
  const food = foodBit(facts, pressure);
  const pulse = eraPulse(facts);
  const pulseBit = pulse
    ? `街上這兩週聽得到${pulse}`
    : `${year}年在${city}，日子比口號更逼人`;

  if (age < 13) {
    const open = pick(rng, [
      `${year}年的${place}，${age} 歲的孩子住在${house}，戶口上還寫著「${cls}」`,
      `${year}年，${city}。${age} 歲，戶籍是「${cls}」，門一關就是${house}`,
    ]);
    if (pressure === "hunger") {
      return joinPara([
        open,
        `空碗比功課先到：${food}還沒著落，${who}的臉色比糧店窗板更早決定誰能走出巷口`,
        pulseBit,
      ]);
    }
    if (pressure === "papers" || pressure === "war") {
      return joinPara([
        open,
        `${city}路口在清人、查路條；口音一出口，大人就把孩子往身後撥`,
        pulseBit,
      ]);
    }
    if (pressure === "illness") {
      return joinPara([
        open,
        `燒或瀉先於規矩到來。冷毛巾與能喝的水，比任何口令都緊`,
        pulseBit,
      ]);
    }
    return joinPara([
      open,
      `這兩週的活路握在${who}手裏：聽話能換一口${food}，頂嘴可能連門都不讓出`,
      pulseBit,
    ]);
  }

  const adultOpen = pick(rng, [
    `${year}年的${place}，${age} 歲，戶籍與街坊仍把這戶叫作「${cls}」。人住在${house}`,
    `${year}年，${city}。${age} 歲的當事人仍要按「${cls}」這一行過活，門後是${house}`,
  ]);
  if (pressure === "labor") {
    return joinPara([
      adultOpen,
      `班表、罰金與工錢同一張帳：這兩週要不要把力氣交出去，直接改寫下一週的飯與名聲`,
      pulseBit,
    ]);
  }
  if (pressure === "money" || pressure === "hunger") {
    return joinPara([
      adultOpen,
      `口袋見底時，${food}與房租比面子先到。賒得動，就還能撐；賒不動，門就會響`,
      pulseBit,
    ]);
  }
  if (pressure === "illness") {
    return joinPara([
      adultOpen,
      `身子先垮時，扣薪與退燒搶同一口氣。躺下能活命，爬起來可能把病拖死`,
      pulseBit,
    ]);
  }
  if (pressure === "papers" || pressure === "war") {
    return joinPara([
      adultOpen,
      `核名冊與路條比解釋先到。這兩週多說一句，都可能變成名單上的另一行`,
      pulseBit,
    ]);
  }
  return joinPara([
    adultOpen,
    `這兩週的抉擇不在空話，而在${city}還認不認你這戶還能站得住的那一點`,
    pulseBit,
  ]);
}

/**
 * Three stakes: action + visible cost. Indexed 0/1/2.
 * Prefer rewriting existing option direction/situation when present.
 */
function buildStakes(rng, facts, pressure, options = [], memeId = null) {
  const city = facts.city || "此地";
  const year = facts.year || "";
  const food = foodBit(facts, pressure);
  const who = whoBit(facts);
  const age = Number(facts.age || 0);
  const adult = age >= MATURE_ADULT_MIN;

  const byDir = (dir, situation, drivers = []) => {
    const d = String(dir || "");
    const s = String(situation || pressure || "daily");

    if (memeId === "ricardo_milos" || drivers.some((tag) => /banana|samba|meme_dancer|invincible|absolute_freedom/i.test(tag))) {
      if (d === "seek" || d === "help") return `把巴西森巴踩進${city}街頭，用掌聲與小費換口糧——代價是規矩與工牌都先擱下`;
      if (d === "resist" || d === "guard") return `不拿絕對自由換一時班表——代價是少賺，卻守住自己的節奏`;
      if (d === "flee") return `規矩一緊就華麗轉身離開——代價是舞台空一拍，卻不被扣住`;
      return `紅色頭巾不收，把這兩週的舞步跳完——代價是汗與議論，換來名聲先於工牌`;
    }
    if (memeId === "billy_herrington" || drivers.some((tag) => /aniki|wrestle|biochem|forest_fairy|loyal_bond/i.test(tag))) {
      if (d === "seek") return `把力氣押進${city}還認摔角與鐵杠的那條路——代價是透支身子，換掌聲與下一季的人情`;
      if (d === "resist" || d === "guard") return `用摔角練出的身子硬扛${city}這兩週的衝突——代價是一身傷，換來名聲與人情不散`;
      if (d === "help") return `以兄貴氣度先把同伴從低谷拉起——代價是工錢後算，卻換來義氣帳`;
      if (d === "endure") return `勞動與體能交給鐵杠節奏——代價是透支身子，換這季還站得住`;
      if (d === "flee") return `先離開還在綁死你的場次或班表——代價是短期斷炊，卻不被這一局掐死`;
      return `哲學看淡一截，身子仍按摔角墊站穩——代價是慢，卻不把人丟下`;
    }
    if (memeId === "tadokoro_koji" || drivers.some((tag) => /beast|shimokita|114514|natsumikan|stench|onmad/i.test(tag))) {
      if (d === "resist" || d === "guard") return `憑野獸先輩的直覺在${city}找活路——代價是惡名上身，卻不把命押死在班表上`;
      if (d === "flee") return `危機一響就鑽進巷弄——代價是丟這份工，先保住下一頓`;
      if (d === "seek") return `按下北澤打工節奏搏薪水與怪事——代價是罰金與傳聞一起漲`;
      if (d === "endure") return `惡臭傳聞與罰金一起忍，把夜班熬完——代價是名聲更臭，錢包稍穩`;
      if (s === "illness" || pressure === "meme_illness") {
        return `燒還沒退也不把命押給班表——代價是扣薪或丟工，卻能先活命`;
      }
      return `帶著野獸氣息扛過這兩週的班表與空錢包——代價是荒謬日常，卻算一種活路`;
    }

    if (!adult && (s === "hunger" || pressure === "hunger")) {
      if (d === "seek") return `頂著盤問去${city}換一口${food}——代價是可能被攔在路口，連門都不准回`;
      if (d === "guard") return `先把${who}還沒扣走的那口${food}護住——代價是這兩週不敢出巷、也換不到更多`;
      if (d === "resist") return `不把${food}讓給先伸手的人——代價是挨罵、甚至空手過夜`;
      if (d === "help") return `把能分的${food}讓給${who}——代價是自己先餓一頓`;
      return `看準${who}的臉色再上路——代價是可能錯過唯一能換成${food}的空檔`;
    }
    if (!adult && (pressure === "papers" || pressure === "war" || s === "family")) {
      if (d === "flee") return `趁沒人看門溜出${city}的窄巷——代價是被抓回來時罰得更重`;
      if (d === "guard") return `把門栓插上，聽見拍門先裝作沒人——代價是這兩週的糧可能更晚到`;
      if (d === "resist") return `不按屋裏口令把名字或路條交出去——代價是挨打、也換不來通行`;
      return `把口音與出身收進回答裏，少說半句——代價是這兩週更不敢抬頭`;
    }
    if (s === "illness" || pressure === "illness" || pressure === "meme_illness") {
      if (d === "resist") return `不讓人把你從床上拖去上工——代價是扣薪，卻能把燒壓住`;
      if (d === "seek") return `去${city}求退燒藥或止瀉粉，寧可靠賒——代價是欠下一筆說不清的人情`;
      if (d === "help") return `先幫${who}把額上的熱降下來——代價是自己的班與名聲都後排`;
      if (d === "flee") return `燒還沒退也先離開還在逼出勤的地方——代價是丟工，卻保住命`;
      return `躺著把力氣留給退燒與下一頓——代價是這兩週工錢先擱下`;
    }
    if (s === "money" || pressure === "money" || pressure === "meme_scarce") {
      if (d === "seek") return `向${city}熟臉求一筆能換成${food}的賒——代價是下期利息與臉色都更難看`;
      if (d === "guard") return `先付會砸門的房租、糧或罰——代價是口袋見底，卻保住門面`;
      if (d === "resist") return `不把能當的東西一次交出去抵帳——代價是債主再來時更兇`;
      if (d === "flee") return `帶著還能當的東西離開會砸門的那一戶——代價是信用與住處一起丟`;
      return `把能當的東西換成${food}與房租——代價是家底更薄，卻能先活過這兩週`;
    }
    if (s === "labor" || pressure === "labor") {
      if (d === "flee") return `罰金付不起就先離開${city}的工位——代價是丟班，卻躲開這一輪扣款`;
      if (d === "endure" || d === "guard") return `手裂了仍把這兩週的活交上去——代價是傷與累，換來不被扣工錢`;
      if (d === "seek") return `把力氣押進${city}還肯給工錢的那條路——代價是把下一個十年的身子提前透支`;
      if (d === "resist") return `不按汽笛把活提前做完——代價是罰與惡名，卻留一口氣`;
      return `把這兩週的班先扛完再說話——代價是眼前的傷，換下期還能上工`;
    }
    if (adult) {
      if (d === "seek") return `去${city}把這兩週還能換成${food}或人情的路走完——代價是可能把僅剩的體面押進去`;
      if (d === "guard") return `先守住飯錢與門面，不把底牌一次交出去——代價是錯過一次暴利的空窗`;
      if (d === "resist") return `不按旁人口令交名字或底牌——代價是被記一筆，卻留住主動`;
      if (d === "flee") return `先離開還在綁著你的班表或門戶——代價是短期斷炊，換長期不被掐死`;
      if (d === "help") return `用還撐得住的力氣幫${who}結眼前的帳——代價是自己這週更緊`;
      return `按${year}年在${city}還認的規矩，把能扛的先扛過——代價是慢，卻少翻車`;
    }
    if (d === "seek") return `去找${who}要這兩週還能走的路——代價是欠下一聲聽話`;
    if (d === "guard") return `把門栓插上，先保住${who}還認的那張牀——代價是外面的機會一併關在門外`;
    if (d === "help") return `按${who}交代的把水打回來、把碗洗乾淨——代價是這兩週的玩與空檔都沒了`;
    return `把${who}護住，不讓人先扣走——代價是自己先挨罵或挨餓`;
  };

  return [0, 1, 2].map((index) => {
    const row = options[index] || {};
    const turnSalt = Math.floor(
      (Number(facts.year || 0) * 3)
      + (Number(facts.age || 0) * 5)
      + (Number(options.length ? index : 0))
      + Math.floor(roll01(rng) * 97),
    );
    const DIR_CYCLE = ["seek", "guard", "flee", "endure", "resist", "help"];
    const dir = row.direction || DIR_CYCLE[(turnSalt + index * 2) % DIR_CYCLE.length];
    const situation = row.situation || pressure;
    const drivers = (row.driverTags || []).map(String);
    const text = byDir(dir, situation, drivers);
    const costTail = /——(.+)$/.exec(text)?.[1] || "代價是這兩週的主動權";
    return {
      index,
      dir,
      situation,
      text,
      costTail,
    };
  });
}

/**
 * Build the fortnight scene used by chronicle + final triad copy.
 */
export function composeWeekScene(rng, ctx = {}, options = []) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const pressure = inferPressure(ctx, facts, options);
  const meme = isMemeLegendCharacter(ctx.character);
  // Force chronicle pick variance from turn entropy so consecutive fortnights diverge.
  const entropy = Number(ctx.weekEntropy);
  const saltRng = () => {
    const base = typeof rng === "function" ? rng() : Math.random();
    if (!Number.isFinite(entropy)) return base;
    return (base + entropy + (Number(ctx.turnCount || 0) * 0.017)) % 1;
  };
  let chronicle = meme
    ? memeChronicle(saltRng, { ...facts, name: ctx.character?.name || facts.name }, pressure, ctx.character.specialPresetId)
    : normalChronicle(saltRng, facts, pressure);
  const recent = ctx.character?.textHistory?.recentStems || ctx.character?.exclusionBuffer?.never || [];
  if (chronicle && recent.some((stem) => textsTooSimilar(String(stem), chronicle.slice(0, 40)))) {
    chronicle = meme
      ? memeChronicle(() => (saltRng() + 0.37) % 1, { ...facts, name: ctx.character?.name || facts.name }, pressure, ctx.character.specialPresetId)
      : normalChronicle(() => (saltRng() + 0.37) % 1, facts, pressure);
  }
  const stakes = buildStakes(saltRng, facts, pressure, options, meme ? ctx.character.specialPresetId : null);
  return {
    pressure,
    meme,
    chronicle: chronicle || seal(`${facts.year || ""}年，${facts.place || "此地"}。這兩週先過眼前的事`),
    stakes,
  };
}

function lineBlocked(character, id, text, used = []) {
  if (!text) return true;
  if (used.some((row) => textsTooSimilar(row, text))) return true;
  if (character && optionExcluded(character, id, text)) return true;
  if (character && textOnCooldown(character, text)) return true;
  return false;
}

/**
 * Align triad to scene: keep live mint wording when fresh; only fall back to
 * stake templates when excluded/cooldown/empty. Always ensure a visible cost.
 */
export function applySceneStakesToOptions(options = [], scene = null, ctx = {}) {
  const character = ctx.character || null;
  const used = [];
  return (options || []).slice(0, 3).map((row, index) => {
    const stake = scene?.stakes?.[index] || scene?.stakes?.[0] || null;
    let text = String(row?.trueText || row?.text || "").trim();
    const id = row?.id || `scene_${index}`;
    if (lineBlocked(character, id, text, used)) {
      text = String(stake?.text || "").trim();
    }
    if (lineBlocked(character, id, text, used) && stake?.text) {
      // Last resort: mutate stake with turn salt so it cannot identical-loop.
      const salt = Math.floor((Number(ctx.weekEntropy || 0) * 1000) + (Number(ctx.turnCount || 0) * 7) + index);
      const mut = [
        "先把眼前這一局了結",
        "這一步只押這一季",
        "換一條還能回頭的路",
        "寧可慢也不把底牌一次交出去",
      ][salt % 4];
      text = `${String(stake.text).replace(/——代價.+$/, "")}——${stake.costTail || "代價是這兩週的主動權"}（${mut}）`;
    }
    if (text && !/代價|換來|寧可|卻|賭/.test(text)) {
      const tail = stake?.costTail || "代價是這兩週的主動權";
      text = `${text.replace(/[。！？，、]+$/g, "")}——${tail}`;
    }
    if (used.some((rowText) => textsTooSimilar(rowText, text))) {
      text = `${text.replace(/——.+$/, "")}——代價是另一條更窄的活路`;
    }
    used.push(text);
    return {
      ...row,
      text,
      trueText: text,
      direction: row.direction || stake?.dir,
      situation: row.situation || stake?.situation,
      sceneAligned: true,
      weekPressure: scene?.pressure || null,
    };
  });
}
