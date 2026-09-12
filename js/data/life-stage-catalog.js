/**
 * Progressive life arcs and one-shot turning points.
 * Age bands only. Completion is stamped by LifeStageManager.
 */

function opt(id, text, extras = {}) {
  return {
    id,
    text,
    trueText: text,
    effects: extras.effects || { mood: 0 },
    followUps: extras.followUps || ["這一步寫進戶口與往後能走的路。"],
    when: extras.when || { age: [5, 120] },
    lane: extras.lane || "family",
    hooks: extras.hooks || ["family"],
    addTags: extras.addTags || [],
    arc: extras.arc,
    turningPointId: extras.turningPointId,
    turningPoint: true,
    direction: extras.direction || "endure",
  };
}

export const LIFE_ARCS = Object.freeze([
  { id: "early_survival", label: "幼年生存", minAge: 5, maxAge: 6, order: 10, gate: false },
  { id: "first_school", label: "第一天上學", minAge: 7, maxAge: 8, order: 20, gate: true, requires: ["early_survival"] },
  { id: "primary_years", label: "就學歲月", minAge: 8, maxAge: 12, order: 30, gate: false, requires: ["first_school"] },
  { id: "exam_fork", label: "升學抉擇", minAge: 13, maxAge: 17, order: 40, gate: true, requires: ["first_school"] },
  { id: "society_entry", label: "出社會", minAge: 18, maxAge: 25, order: 50, gate: false, requires: ["exam_fork"] },
  {
    id: "conscription",
    label: "徵召",
    minAge: 18,
    maxAge: 25,
    order: 55,
    gate: true,
    optional: true,
    requires: ["society_entry"],
    threadsAny: ["conscription", "war"],
  },
  { id: "career", label: "職業生涯", minAge: 18, maxAge: 64, order: 60, gate: false, requires: ["society_entry"] },
  { id: "later_life", label: "中晚年", minAge: 45, maxAge: 120, order: 70, gate: false },
]);

export const TURNING_POINTS = Object.freeze({
  first_school: {
    id: "first_school",
    title: "第一天上學",
    journal: "你被帶到校門口。先生點名，戶口上從此有一格「入學」。",
    addTags: ["acquired_school_primary", "入學"],
    education: "primary",
    options: [
      opt("tp_school_report", "跟著家裏的人走到校門口，把名字報給先生", {
        arc: "first_school",
        turningPointId: "first_school",
        lane: "school",
        hooks: ["school"],
        addTags: ["acquired_school_primary", "入學"],
        when: { age: [7, 8] },
        effects: { mood: 1 },
        followUps: ["先生把你的名字寫進名冊。這一期起你要按鐘點到。"],
      }),
      opt("tp_school_slate", "把能用的石板或紙塞進口袋，按時去點名", {
        arc: "first_school",
        turningPointId: "first_school",
        lane: "school",
        hooks: ["school"],
        addTags: ["acquired_school_primary", "入學", "勤學"],
        when: { age: [7, 8] },
        effects: { mood: 0 },
        followUps: ["你坐進能坐的那一排。粉筆灰比家裏的灶灰細。"],
      }),
      opt("tp_school_late", "家裏缺人手，遲到也要進門，免得名冊上沒有你", {
        arc: "first_school",
        turningPointId: "first_school",
        lane: "school",
        hooks: ["school", "survival"],
        addTags: ["acquired_school_primary", "入學"],
        when: { age: [7, 8] },
        effects: { health: -1 },
        followUps: ["先生記了遲到。名冊上仍有你的名字。"],
      }),
    ],
  },
  exam_fork: {
    id: "exam_fork",
    title: "升學與否",
    journal: "這一期要決定：燈油留給功課，還是把手留給工、田或舖。",
    addTags: [],
    options: [
      opt("tp_exam_study", "把燈油留給功課，走升學這一條", {
        arc: "exam_fork",
        turningPointId: "exam_fork",
        lane: "adolescent",
        hooks: ["school"],
        addTags: ["升學", "勤學"],
        when: { age: [13, 17] },
        effects: { health: -1 },
        followUps: ["功課佔走晚上。出路還沒有保證，只是先把卷子寫完。"],
      }),
      opt("tp_exam_work", "去問工廠、舖面或田裏還收不收人手", {
        arc: "exam_fork",
        turningPointId: "exam_fork",
        lane: "adolescent",
        hooks: ["labor"],
        addTags: ["path_labor"],
        when: { age: [13, 17] },
        effects: { health: -1 },
        followUps: ["有人看你的手和年紀。工錢按日結，學籍可以先掛著。"],
      }),
      opt("tp_exam_trade", "跟師傅或熟臉學一門能換飯的手藝", {
        arc: "exam_fork",
        turningPointId: "exam_fork",
        lane: "adolescent",
        hooks: ["labor"],
        addTags: ["path_labor"],
        when: { age: [13, 17] },
        effects: { mood: 0 },
        followUps: ["手藝從重複開始。這一期你先學會被罵和被糾正。"],
      }),
    ],
  },
  conscription: {
    id: "conscription",
    title: "徵召",
    journal: "名冊傳到這戶。壯丁、雜役或後勤，都要有一個答覆。",
    addTags: ["world_draft_notice"],
    options: [
      opt("tp_draft_report", "按名冊去報到", {
        arc: "conscription",
        turningPointId: "conscription",
        lane: "adult_work",
        hooks: ["labor"],
        addTags: ["world_draft_notice", "path_militant"],
        when: { age: [18, 25] },
        effects: { health: -1 },
        followUps: ["你的名字從戶口轉到徵召那一本。"],
      }),
      opt("tp_draft_hide", "家裏把你藏起來，或改口說有病", {
        arc: "conscription",
        turningPointId: "conscription",
        lane: "adult_work",
        hooks: ["family"],
        addTags: ["world_draft_notice"],
        when: { age: [18, 25] },
        effects: { mood: -1 },
        followUps: ["藏得住一週，藏不住名冊上的格子。"],
      }),
      opt("tp_draft_rear", "去問有沒有文書、後勤或雜役可以頂替上前線", {
        arc: "conscription",
        turningPointId: "conscription",
        lane: "adult_work",
        hooks: ["labor"],
        addTags: ["world_draft_notice"],
        when: { age: [18, 25] },
        effects: { mood: 0 },
        followUps: ["後勤也要點名。只是離槍口遠一點。"],
      }),
    ],
  },
});

export const TURNING_POINT_POOL = Object.freeze(
  Object.values(TURNING_POINTS).flatMap((point) => point.options || []),
);
