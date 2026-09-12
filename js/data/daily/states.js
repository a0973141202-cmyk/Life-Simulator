/**
 * Life-state definitions. The daily engine picks one primary state per week.
 * Add states here, then add slice files; do not hard-code state lists in GameEngine.
 */

export const DAILY_STATES = Object.freeze({
  home_child: {
    id: "home_child",
    label: "家裏",
    audience: "child_safe",
    priority: 10,
  },
  school_child: {
    id: "school_child",
    label: "學堂",
    audience: "child_safe",
    priority: 20,
  },
  school_teen: {
    id: "school_teen",
    label: "學堂",
    audience: "teen",
    priority: 30,
  },
  labor_legal: {
    id: "labor_legal",
    label: "做工",
    audience: "adult",
    priority: 40,
  },
  office_white: {
    id: "office_white",
    label: "坐辦公室",
    audience: "adult",
    priority: 45,
  },
  commerce_floor: {
    id: "commerce_floor",
    label: "舖面",
    audience: "adult",
    priority: 46,
  },
  neet_depend: {
    id: "neet_depend",
    label: "待在家裏",
    audience: "gray",
    priority: 35,
  },
  politics_machine: {
    id: "politics_machine",
    label: "衙門與商會",
    audience: "adult",
    priority: 50,
  },
  underworld_cover: {
    id: "underworld_cover",
    label: "地下日子",
    audience: "gray",
    priority: 60,
  },
  prison: {
    id: "prison",
    label: "監禁日常",
    audience: "adult",
    priority: 80,
  },
  militant_wait: {
    id: "militant_wait",
    label: "等命令",
    audience: "adult",
    priority: 70,
  },
});
