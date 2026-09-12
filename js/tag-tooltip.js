/**
 * Fixed-position tag hover tip. Lives on document.body so overflow
 * on the dossier cannot clip it; clamped to the viewport.
 */
import { composeTagGloss, tagGloss } from "./data/tag-gloss.js";
import { isDossierLeakSentence, scrubPublicText } from "./data/public-text.js";

export const TAG_TOOLTIP_ID = "tag-tooltip";

const PAD = 10;

export function ensureTagTooltip() {
  let tip = document.getElementById(TAG_TOOLTIP_ID);
  if (tip) return tip;
  tip = document.createElement("div");
  tip.id = TAG_TOOLTIP_ID;
  tip.className = "tag-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);
  return tip;
}

function placeTooltip(anchor, tip) {
  const rect = anchor.getBoundingClientRect();
  const width = tip.offsetWidth || tip.getBoundingClientRect().width;
  const height = tip.offsetHeight || tip.getBoundingClientRect().height;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = Math.max(PAD, vw - width - PAD);
  const maxTop = Math.max(PAD, vh - height - PAD);
  let left = rect.left + rect.width / 2 - width / 2;
  let top = rect.top - height - PAD;
  if (top < PAD) top = rect.bottom + PAD;
  if (top > maxTop) top = Math.max(PAD, rect.top - height - PAD);
  if (top < PAD && rect.bottom + PAD + height <= vh - PAD) top = rect.bottom + PAD;
  left = Math.min(maxLeft, Math.max(PAD, left));
  top = Math.min(maxTop, Math.max(PAD, top));
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

export function hideTagTooltip() {
  const tip = document.getElementById(TAG_TOOLTIP_ID);
  if (!tip) return;
  tip.hidden = true;
  tip.textContent = "";
  tip.removeAttribute("data-open");
}

export function showTagTooltip(anchor) {
  if (!anchor) return;
  const gloss = String(anchor.dataset.gloss || "").trim();
  if (!gloss) return;
  const tip = ensureTagTooltip();
  tip.textContent = gloss;
  tip.hidden = false;
  tip.dataset.open = "1";
  tip.style.left = "0px";
  tip.style.top = "0px";
  placeTooltip(anchor, tip);
  requestAnimationFrame(() => {
    if (!tip.hidden) placeTooltip(anchor, tip);
  });
}

export function decorateTagChip(chip, record = {}) {
  const gloss = scrubPublicText(composeTagGloss(record) || tagGloss(record));
  const safe = gloss && !isDossierLeakSentence(gloss) ? gloss : "街坊能叫得出來的公開標記。";
  chip.dataset.gloss = safe;
  chip.tabIndex = 0;
  chip.setAttribute("aria-describedby", TAG_TOOLTIP_ID);
  const label = record.label || chip.textContent || "";
  chip.setAttribute("aria-label", `${label}。${safe}`);
}

export function bindTagTooltips() {
  if (typeof document === "undefined") return;
  if (document.documentElement.dataset.tagTooltipBound) return;
  document.documentElement.dataset.tagTooltipBound = "1";
  ensureTagTooltip();

  const fromEvent = (event) => event.target?.closest?.(".tag") || null;

  document.addEventListener("pointerover", (event) => {
    const chip = fromEvent(event);
    if (chip) showTagTooltip(chip);
  });
  document.addEventListener("pointerout", (event) => {
    const chip = fromEvent(event);
    if (!chip) return;
    const next = event.relatedTarget;
    if (next && (chip.contains(next) || next.closest?.(".tag") === chip)) return;
    hideTagTooltip();
  });
  document.addEventListener("pointerdown", (event) => {
    const chip = fromEvent(event);
    if (chip) {
      showTagTooltip(chip);
      return;
    }
    hideTagTooltip();
  });
  document.addEventListener("focusin", (event) => {
    const chip = fromEvent(event);
    if (chip) showTagTooltip(chip);
  });
  document.addEventListener("focusout", (event) => {
    const chip = fromEvent(event);
    if (!chip) return;
    const next = event.relatedTarget;
    if (next?.closest?.(".tag") === chip) return;
    hideTagTooltip();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTagTooltip();
  });
  window.addEventListener("scroll", hideTagTooltip, true);
  window.addEventListener("resize", hideTagTooltip);
}
