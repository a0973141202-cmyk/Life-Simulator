/**
 * Forced mental-collapse fortnights. One fact, three costly stances.
 * No clinical English on the page. No sexual-minor copy. No halo exit.
 */

function breakdownIncident({
  id,
  age = [5, 120],
  year = [1920, 2025],
  weight = 1,
  fact,
  procedure = "",
  options = [],
}) {
  if (!id || !fact || options.length < 3) {
    throw new Error(`breakdownIncident ${id || "?"} needs id, fact, and 3 options`);
  }
  const when = { age: age.slice(), year: year.slice() };
  return {
    id,
    kind: "breakdown",
    lock: "breakdown",
    weight,
    when,
    fact,
    procedure,
    options: options.map((opt, index) => {
      const traumaTags = (opt.trauma?.tags || []).slice();
      return {
        id: opt.id || `${id}_${opt.stance || index}`,
        text: opt.text,
        effects: opt.effects || { sanity: -4 },
        followUps: opt.followUps || [],
        addTags: opt.addTags || [],
        hooks: opt.hooks || ["night", "hide"],
        risk: opt.risk || null,
        consequence: opt.consequence || null,
        attempt: opt.attempt || null,
        ending: opt.ending || null,
        path: opt.path || null,
        domain: opt.domain || "home",
        trauma: opt.trauma
          ? { ...opt.trauma, tags: traumaTags }
          : { tags: ["trauma_ptsd"], intensity: 10, domain: "home" },
        traumaVictim: true,
        traumaNonsexual: true,
        breakdownIncident: true,
        breakdownIncidentId: id,
        noSexualMinorActs: true,
        affectChoice: true,
        stance: opt.stance || "endure",
        tagDriven: true,
        when: { ...when },
        weight,
      };
    }),
  };
}

export const BREAKDOWN_INCIDENTS = Object.freeze([
  breakdownIncident({
    id: "bd_child_freeze",
    age: [5, 12],
    fact: "這一週你開始在不該停的地方停住。碗端到一半、門開了一條縫、有人喊你的名字，身體先不答應。大人以為你在賭氣。你不是。",
    procedure: "沒有醫生來寫病名。家裡用「嚇著了」「腦子不靈」交代。飯照吃，活照幹，空白的那段時間沒人記進帳。",
    options: [
      {
        stance: "endure",
        text: "把臉埋進膝蓋，等聲音自己過去",
        effects: { sanity: -3, health: -1, charm: -1 },
        trauma: { tags: ["trauma_ptsd", "trauma_dissociation"], intensity: 12, domain: "home" },
        hooks: ["hide", "night", "family"],
        followUps: [
          "你聽見自己的呼吸比門外的腳步響。等你再抬頭，碗已經涼了。這一週家裡開始用「又發了」來叫你。",
        ],
      },
      {
        stance: "hide",
        text: "鑽進床底或柴房，把耳朵堵死",
        effects: { sanity: -2, health: -1, charm: -2 },
        trauma: { tags: ["trauma_persecution", "trauma_cannot_ask_help"], intensity: 11, domain: "home" },
        hooks: ["hide", "night"],
        followUps: [
          "灰塵和木頭味變成安全。有人找你時你不應。後來你連該應的呼喚也開始懷疑。",
        ],
      },
      {
        stance: "cling",
        text: "死抓住最近一個大人的衣角，不讓對方走開",
        effects: { sanity: -2, charm: -1, mood: -2 },
        trauma: { tags: ["trauma_attachment_starve", "trauma_melancholia"], intensity: 10, domain: "home" },
        hooks: ["family", "ask"],
        followUps: [
          "衣角被扯皺。對方先是抱你，後來嫌你重。你學會在被推開以前先自己鬆手。",
        ],
      },
    ],
  }),
  breakdownIncident({
    id: "bd_teen_crack",
    age: [13, 17],
    fact: "這一週課堂、工地或家門口的聲音會突然變得很近。你答不上話，或答了不該答的。旁人把這看成頂撞或懶。",
    procedure: "沒有請假單能寫「神智先垮」。缺席、頂嘴、砸東西都會進別人的嘴。你自己也分不清哪一句是現在，哪一句是舊的。",
    options: [
      {
        stance: "withdraw",
        text: "不上學、不出門，把被子拉過頭頂",
        effects: { sanity: -2, intelligence: -1, charm: -2 },
        trauma: { tags: ["trauma_melancholia", "trauma_dissociation"], intensity: 12, domain: "school" },
        hooks: ["night", "wait", "study"],
        followUps: [
          "缺席被記成懶。被子裡的空氣變濁。你開始相信自己本來就不該出現在有人的地方。",
        ],
      },
      {
        stance: "lash",
        text: "對最近一個開口的人發火，把能摔的摔了",
        effects: { sanity: -3, charm: -2, health: -1 },
        trauma: { tags: ["trauma_persona_crack", "trauma_rage_leak"], intensity: 13, domain: "home" },
        hooks: ["street", "family", "crime"],
        followUps: [
          "手比話先到。對方後退的樣子會跟著你很久。你從此更難用普通音量把事情說完。",
        ],
        consequence: { heat: 3, trust: -4, infamy: 2, eventLabel: "當眾發作" },
      },
      {
        stance: "scan",
        text: "反覆確認門窗、名單和誰在看你",
        effects: { sanity: -3, intelligence: 0, charm: -1 },
        trauma: { tags: ["trauma_persecution", "trauma_hypervigilance"], intensity: 12, domain: "authority" },
        hooks: ["hide", "official", "night"],
        followUps: [
          "插銷檢查第三遍時你自己也嫌煩，手卻停不下來。街上有人對看一眼，你就把那一眼存成證據。",
        ],
      },
    ],
  }),
  breakdownIncident({
    id: "bd_adult_split",
    age: [18, 64],
    fact: "這一週工位、灶台或隊列裡，你的手還在動，人卻有一段不在場。工錢、配給和孩子的飯不會因此停收。",
    procedure: "單位寫怠工，家裏寫發瘋，街上寫不正常。沒有一欄給你解釋舊傷為什麼在這一週到期。",
    options: [
      {
        stance: "numb",
        text: "把身體交給班表，腦子關掉，少開口",
        effects: { sanity: -2, intelligence: -1, health: -1 },
        trauma: { tags: ["trauma_dissociation", "trauma_melancholia"], intensity: 13, domain: "labor" },
        hooks: ["labor", "wait"],
        followUps: [
          "活幹完了，過程記不得。有人問你話，你用「嗯」打發。空白開始誤事，也開始被當成冷。",
        ],
      },
      {
        stance: "suspect",
        text: "把同事、鄰居或幹部的每句話當成圈套",
        effects: { sanity: -3, charm: -2, intelligence: -1 },
        trauma: { tags: ["trauma_persecution", "trauma_authority_terror"], intensity: 14, domain: "authority" },
        hooks: ["official", "hide", "social"],
        followUps: [
          "你少挨了一次可能的出賣，也推開了一次真的援手。名單在你腦子裡比單位的名單更長。",
        ],
      },
      {
        stance: "distort",
        text: "用更硬、更損人的法子先保住自己這一週",
        effects: { sanity: -3, charm: -2, health: -1 },
        trauma: { tags: ["trauma_persona_crack", "trauma_cruelty_rehearsal"], intensity: 14, domain: "labor" },
        hooks: ["street", "crime", "survival"],
        followUps: [
          "你過了這一週。看見自己下手的方式時，你認出從前打你的人。這不是變強，是傳染落戶。",
        ],
        consequence: { heat: 4, trust: -5, infamy: 3, eventLabel: "發作傷人" },
      },
    ],
  }),
  breakdownIncident({
    id: "bd_elder_return",
    age: [65, 120],
    fact: "這一週舊年的聲音比現在的飯香更近。孫輩說話你聽成口令，門響你聽成當年的人。身子已經慢了，驚跳沒有慢。",
    procedure: "沒有人會為一個老人的神智再開一張病床。家裏用「老糊塗」交代。你自己知道那不是糊塗。",
    options: [
      {
        stance: "endure",
        text: "坐在原位，等畫面自己退潮",
        effects: { sanity: -3, health: -2 },
        trauma: { tags: ["trauma_ptsd", "trauma_dissociation"], intensity: 12, domain: "home" },
        hooks: ["night", "wait"],
        followUps: [
          "潮退之後碗還在。你的手在抖。家裏把這週寫成「又犯了老毛病」，沒有人問那毛病從哪一年來。",
        ],
      },
      {
        stance: "hide",
        text: "把自己關進裡屋，不讓人靠近窗",
        effects: { sanity: -2, charm: -2, health: -1 },
        trauma: { tags: ["trauma_persecution", "trauma_cannot_ask_help"], intensity: 11, domain: "home" },
        hooks: ["hide", "night"],
        followUps: [
          "門栓的金屬味比藥味熟悉。有人送飯你也不開。孤立被練成晚年的日常。",
        ],
      },
      {
        stance: "withdraw",
        text: "少吃飯、少說話，把剩下的力氣留給別發病的日子",
        effects: { sanity: -2, health: -2, charm: -1 },
        trauma: { tags: ["trauma_melancholia", "trauma_self_blame"], intensity: 12, domain: "home" },
        hooks: ["health", "wait"],
        followUps: [
          "飯量下降被說成胃口不好。你開始覺得自己活太久，佔了屋裏的位置。這想法不會自己散。",
        ],
      },
    ],
  }),
]);

export const BREAKDOWN_INCIDENT_INDEX = Object.freeze(
  Object.fromEntries(BREAKDOWN_INCIDENTS.map((row) => [row.id, row])),
);
