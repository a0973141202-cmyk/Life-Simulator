/**
 * Life-state definitions. The daily engine picks one primary state per week.
 * Add states here, then add slice files; do not hard-code state lists in GameEngine.
 */

export const DAILY_STATES = Object.freeze({
  home_child: {
    id: "home_child",
    label: "家庭依附（學齡前／課後）",
    audience: "child_safe",
    priority: 10,
  },
  school_child: {
    id: "school_child",
    label: "小學／啟蒙學校生態",
    audience: "child_safe",
    priority: 20,
  },
  school_teen: {
    id: "school_teen",
    label: "中學／技職生態",
    audience: "teen",
    priority: 30,
  },
  labor_legal: {
    id: "labor_legal",
    label: "合法基層勞動",
    audience: "adult",
    priority: 40,
  },
  office_white: {
    id: "office_white",
    label: "白領／機關基層",
    audience: "adult",
    priority: 45,
  },
  commerce_floor: {
    id: "commerce_floor",
    label: "商場／舖面日常",
    audience: "adult",
    priority: 46,
  },
  neet_depend: {
    id: "neet_depend",
    label: "依附／啃老／無業在宅",
    audience: "gray",
    priority: 35,
  },
  politics_machine: {
    id: "politics_machine",
    label: "政商與機關日常",
    audience: "adult",
    priority: 50,
  },
  underworld_cover: {
    id: "underworld_cover",
    label: "地下生活與合法偽裝",
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
    label: "武裝政治的等待與自我洗腦",
    audience: "adult",
    priority: 70,
  },
});
