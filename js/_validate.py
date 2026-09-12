# -*- coding: utf-8 -*-
"""Static consistency checks for ethnicity / trait / settlement data.
Run: python js/_validate.py
Does not execute the game engine (Node may be absent).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"

ETH_RE = re.compile(r'\beth\(\s*"([a-z0-9_]+)"')
TRAIT_DEF_RE = re.compile(r'\bt\(\s*"([a-z0-9_]+)"')
TRAIT_LIST_RE = re.compile(r'\["([a-z0-9_]+)"(?:\s*,\s*"([a-z0-9_]+)")*')
SETTLE_ID_RE = re.compile(r'\bs\(\s*\{\s*id:\s*"([a-z0-9_]+)"')
SETTLE_ETH_RE = re.compile(r"ethnicities:\s*\[([^\]]*)\]")
COORD_RE = re.compile(r"^\s*([a-z0-9_]+):\s*\{\s*lat:", re.M)
FORBIDDEN_RE = re.compile(r"sentinel|北哨兵", re.I)
SETTLE_PACK_SKIP = {"schema.js", "index.js"}


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def ethnicity_ids() -> set[str]:
    ids: set[str] = set()
    for path in (DATA / "ethnicities").glob("*.js"):
        ids.update(ETH_RE.findall(read(path)))
    ids.update(ETH_RE.findall(read(DATA / "ethnicities-database.js")))
    return ids


def trait_ids() -> set[str]:
    return set(TRAIT_DEF_RE.findall(read(DATA / "traits-database.js")))


def ethnicity_trait_refs() -> list[tuple[str, str]]:
    blob = ""
    for path in (DATA / "ethnicities").glob("*.js"):
        blob += read(path) + "\n"
    blob += read(DATA / "ethnicities-database.js")
    pattern = re.compile(
        r'eth\(\s*"([a-z0-9_]+)"\s*,\s*"(?:\\.|[^"\\])*"\s*,\s*"(?:\\.|[^"\\])*"\s*,\s*"[^"]*"\s*,\s*\[[^\]]*\]\s*,\s*\[([^\]]*)\]',
    )
    refs = []
    for match in pattern.finditer(blob):
        eth_id = match.group(1)
        for trait in re.findall(r'"([a-z0-9_]+)"', match.group(2)):
            refs.append((eth_id, trait))
    return refs


def settlement_pack_files() -> list[Path]:
    pack_dir = DATA / "settlements"
    return sorted(
        path for path in pack_dir.glob("*.js") if path.name not in SETTLE_PACK_SKIP
    )


def settlement_ids() -> list[str]:
    ids: list[str] = []
    for path in settlement_pack_files():
        ids.extend(SETTLE_ID_RE.findall(read(path)))
    return ids


def settlement_ethnicity_refs() -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    array_re = re.compile(
        r"(?:ethnicities:\s*\[([^\]]*)\]|e\(\s*\d+\s*,\s*(?:YEAR_MAX|\d+)\s*,\s*\[([^\]]*)\])"
    )
    for path in settlement_pack_files():
        parts = re.split(r'\bs\(\s*\{\s*id:\s*"', read(path))
        for part in parts[1:]:
            sid = part[: part.find('"')]
            for group in array_re.findall(part):
                blob = group[0] or group[1]
                for eid in re.findall(r'"([a-z0-9_]+)"', blob):
                    out.append((sid, eid))
    return out


def coord_ids() -> set[str]:
    covered = set(COORD_RE.findall(read(DATA / "settlement-geo.js")))
    for path in settlement_pack_files():
        parts = re.split(r'\bs\(\s*\{\s*id:\s*"', read(path))
        for part in parts[1:]:
            sid = part[: part.find('"')]
            if re.search(r"\blat:\s*-?\d", part):
                covered.add(sid)
    return covered


def main() -> None:
    errors: list[str] = []
    eth_ids = ethnicity_ids()
    traits = trait_ids()
    settle_ids = settlement_ids()
    coords = coord_ids()

    live_ids = " ".join(settle_ids) + " " + " ".join(eth_ids)
    if FORBIDDEN_RE.search(live_ids):
        errors.append("forbidden id leaked into live catalogs")

    missing_traits = sorted({f"{e}:{t}" for e, t in ethnicity_trait_refs() if t not in traits})
    if missing_traits:
        errors.append("missing traits: " + ", ".join(missing_traits[:40]))

    missing_eth = sorted({f"{s}->{e}" for s, e in settlement_ethnicity_refs() if e not in eth_ids})
    if missing_eth:
        errors.append("settlement ethnicity missing: " + ", ".join(missing_eth))

    dup_settle = [i for i in settle_ids if settle_ids.count(i) > 1]
    if dup_settle:
        errors.append("duplicate settlements: " + ", ".join(sorted(set(dup_settle))))

    missing_coords = sorted(set(settle_ids) - coords)
    if missing_coords:
        errors.append("missing coords (will fall back to region lat): " + ", ".join(missing_coords))

    if len(eth_ids) < 180:
        errors.append(f"ethnicity count too small: {len(eth_ids)}")
    if len(settle_ids) < 200:
        errors.append(f"settlement count too small: {len(settle_ids)}")
    if len(settlement_pack_files()) < 8:
        errors.append("settlement regional packs missing")
    schema = read(DATA / "settlements" / "schema.js")
    for needle in ("getSettlementCountry", "getSettlementEthnicities", "localizeSettlement", "countryBand", "ethnicityBand"):
        if needle not in schema:
            errors.append(f"settlement schema missing {needle}")
    catalog = read(DATA / "settlements" / "index.js")
    for needle in ("SETTLEMENT_PACKS", "SETTLEMENT_CATALOG", "eastAsia", "arctic"):
        if needle not in catalog:
            errors.append(f"settlement catalog missing {needle}")
    settlements_js = read(ROOT / "settlements.js")
    if "SETTLEMENT_CATALOG" not in settlements_js:
        errors.append("settlements.js must assemble from SETTLEMENT_CATALOG")
    if "s({ id:" in settlements_js:
        errors.append("settlements.js must not hold the city catalog")
    names_keys = read(DATA / "name-packs.js")
    for needle in ('["法屬印度支那", "viet"]', '["荷屬東印度", "malay"]', '["英屬印度", "hindi"]', '["滿洲國", "han"]'):
        if needle not in names_keys:
            errors.append(f"COUNTRY_NAME_KEYS missing colonial needle {needle}")
    if names_keys.find('["法屬印度支那"') > names_keys.find('["印度", "hindi"]'):
        errors.append("法屬印度支那 must precede 印度 in COUNTRY_NAME_KEYS")
    if names_keys.find('["荷屬東印度"') > names_keys.find('["印度", "hindi"]'):
        errors.append("荷屬東印度 must precede 印度 in COUNTRY_NAME_KEYS")
    if names_keys.find('["英屬印度"') > names_keys.find('["印度", "hindi"]'):
        errors.append("英屬印度 must precede 印度 in COUNTRY_NAME_KEYS")

    calendar = read(DATA / "calendar.js")
    if "year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)" not in calendar:
        errors.append("leap-year rule missing from calendar.js")
    if "randomDateInYear" not in calendar:
        errors.append("randomDateInYear missing")

    genesis = read(ROOT / "genesis.js")
    for needle in ("birthIso", "natalEnvironment", "dateCityLocked", "parseDateInput", "natalEnvironmentTags", "generateCharacter"):
        if needle not in genesis:
            errors.append(f"genesis missing {needle}")
    for needle in ("resolveLocalNamingEthnicity", "pickParentOrigin", "culturalNameMatching", "indigenousNaming"):
        if needle not in genesis:
            errors.append(f"genesis missing cultural naming {needle}")
    if "formatName(namingEthnicity, gender, rng, settlement, birthYear)" not in genesis and "composeCulturalName(namingEthnicity, gender, rng, settlement, birthYear)" not in genesis:
        errors.append("genesis child naming must pass birthYear for era overlays")
    if "formatName(primary, gender, rng, origin, birthYear)" not in genesis:
        errors.append("genesis parent naming must pass birthYear for era overlays")
    if "this.registry.getEthnicity(father.primaryEthnicityId)" in genesis and "resolveLocalNamingEthnicity" not in genesis:
        errors.append("child name still follows father ethnicity only")
    names_packs = read(DATA / "name-packs.js")
    for needle in ("viet:", "filipino:", "khmer:", "burmese:", "COUNTRY_NAME_KEYS", '["越南", "viet"]'):
        if needle not in names_packs:
            errors.append(f"name-packs missing {needle}")
    if 'namesFromKey(key) {\n  return NAME_PACKS[key] || NAME_PACKS.english;' in names_packs:
        errors.append("namesFromKey must not silently fall back to english")
    se_asia = read(DATA / "ethnicities" / "southeast-asia.js")
    if 'filipino_tagalog' in se_asia and '"spanish"' in se_asia.split("filipino_tagalog")[1][:400]:
        errors.append("Tagalog still uses Spanish name pack")
    if '"viet"' not in se_asia:
        errors.append("vietnamese ethnicity missing viet name pack")
    if 'eth("hmong"' in se_asia and '"han"' in se_asia.split('eth("hmong"')[1][:400]:
        errors.append("Hmong still uses Han name pack")
    americas = read(DATA / "ethnicities" / "americas.js")
    if 'eth("cree"' in americas and '"english"' in americas.split('eth("cree"')[1][:400]:
        errors.append("Cree still uses English name pack")
    naming_engine = read(ROOT / "naming-engine.js")
    for needle in ("formatCulturalName", "resolveEraNamePack", "composeCulturalName", "namePackForCountry"):
        if needle not in naming_engine:
            errors.append(f"naming-engine missing {needle}")
    minority_packs = read(DATA / "minority-name-packs.js")
    for needle in ("hmong:", "cree:", "cherokee:", "amazigh:", "sami:", "maori:"):
        if needle not in minority_packs:
            errors.append(f"minority-name-packs missing {needle}")
    minority_rules = read(DATA / "minority-name-rules.js")
    for needle in ("band(1995, 2025, \"formosa\", \"han\"", "overlay-given", "BOARDING_ENGLISH", "where"):
        if needle not in minority_rules:
            errors.append(f"minority-name-rules missing {needle}")

    seasons = read(DATA / "seasons.js")
    for needle in ("date_winter", "env_extreme_cold", "current_"):
        if needle not in seasons:
            errors.append(f"seasons missing {needle}")

    boundary = read(ROOT / "boundary.js")
    rules = read(DATA / "boundary-rules.js")
    if "MINOR_PROTECT_AGE = 12" not in rules:
        errors.append("minor protect age must be 12")
    if "evaluateBoundary" not in boundary:
        errors.append("boundary.js missing evaluateBoundary")
    if "REDLINE_PATTERNS" not in rules:
        errors.append("boundary-rules missing REDLINE_PATTERNS")

    sandbox = read(DATA / "sandbox-actions.js")
    crisis = read(DATA / "crisis-actions.js")
    age_re = re.compile(r"age:\s*\[(\d+)")
    for name, blob in (("sandbox", sandbox), ("crisis", crisis)):
        ages = [int(n) for n in age_re.findall(blob)]
        if not ages:
            errors.append(f"{name} actions missing age gates")
        young = [n for n in ages if n < 16]
        if young:
            errors.append(f"{name} action min age < 16: {young[:8]}")
    if "domain: \"narcotics\"" not in sandbox or "domain: \"militant\"" not in sandbox:
        errors.append("sandbox missing hard adult domains")
    if "attempt:" not in sandbox:
        errors.append("sandbox missing political/historical attempts")
    if "crisis: true" not in crisis:
        errors.append("crisis pool not marked crisis")

    redline_blob = sandbox + crisis
    if re.search(r"兒童色情|虐童|CSAM|child\s*porn", redline_blob, re.I):
        errors.append("sandbox/crisis texts hit child-harm redline lexicon")

    engine = read(ROOT / "consequence-engine.js")
    risk = read(ROOT / "risk-calculator.js")
    for needle in ("applyChoiceConsequences", "checkDestructiveEnding"):
        if needle not in engine:
            errors.append(f"consequence-engine missing {needle}")
    if "evaluateAttempt" not in risk:
        errors.append("risk-calculator missing evaluateAttempt")

    play = read(DATA / "play-range.js")
    if "PLAY_AGE_MIN = 5" not in play or "PLAY_AGE_MAX = 120" not in play:
        errors.append("play range must be 5–120")
    if "SOCIETY_ENTRY_AGE = 18" not in play:
        errors.append("play-range missing SOCIETY_ENTRY_AGE = 18")
    if "PLAY_AGE_MAX = 18" in play:
        errors.append("core play-range must not hardcode the beta age cap")
    beta_cfg = read(DATA / "beta-config.js")
    if "BETA_CONFIG" not in beta_cfg or "birthYearMax: 1980" not in beta_cfg:
        errors.append("beta-config missing closed-beta year lock")
    if "playAgeMax: 18" not in beta_cfg:
        errors.append("beta-config missing closed-beta age cap")
    if "canBeginNewLife" not in read(ROOT / "life-session.js"):
        errors.append("life-session missing permanent canBeginNewLife lock")
    if "canBeginNewLife" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine must refuse initNewGame while a life is active")
    if "shouldClosePlayWindow" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine must close the play window via life-bounds helper")
    if "effectiveGenesisYearRange" not in read(ROOT / "genesis.js"):
        errors.append("genesis must read birth years from life-bounds, not beta literals")
    if "1980" in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine must not hardcode beta year 1980")
    if "1980" in read(ROOT / "genesis.js"):
        errors.append("genesis must not hardcode beta year 1980")
    if "lifeLockUntilSettlement" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing lifeLockUntilSettlement")
    if "EVENT_COOLDOWN_CAP" not in read(ROOT / "event-memory.js"):
        errors.append("event-memory missing EVENT_COOLDOWN_CAP")
    if "filterCooledPool" not in read(ROOT / "world-event-engine.js"):
        errors.append("world-event-engine must filter recently fired incidents")
    if "assembleWeeklyChronicle" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must assemble varied weekly chronicle text")
    if "HUNGER_LINES" not in read(DATA / "chronicle-lexicon.js"):
        errors.append("chronicle-lexicon missing hunger/illness/labor/neighbor banks")
    if "scanNarrativeFacts" not in read(ROOT / "narrative-facts.js"):
        errors.append("narrative-facts missing scanNarrativeFacts four-pillar sheet")
    if "composePeriodChronicle" not in read(ROOT / "dynamic-prose.js"):
        errors.append("dynamic-prose missing composePeriodChronicle")
    if "fourPillarProse" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing fourPillarProse")
    if "dynamicComputationEngine" not in read(ROOT / "genesis.js"):
        errors.append("genesis missing dynamicComputationEngine flag")
    if "attachLifeProgress" not in read(ROOT / "life-stage-manager.js"):
        errors.append("life-stage-manager missing attachLifeProgress")
    if "LIFE_ARCS" not in read(DATA / "life-stage-catalog.js"):
        errors.append("life-stage-catalog missing LIFE_ARCS")
    if "applyTheme" not in read(ROOT / "theme-manager.js"):
        errors.append("theme-manager missing applyTheme")
    if "STAGE_SKINS" not in read(DATA / "ui-themes.js"):
        errors.append("ui-themes missing STAGE_SKINS")
    if "progressiveLifeStages" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing progressiveLifeStages")
    if "themeManager" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing themeManager")
    if "applyTheme" not in read(ROOT / "ui.js"):
        errors.append("ui.js must apply ThemeManager skins")
    if "progressAllowsAction" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must gate options through LifeStageManager")
    if "eventCooldown" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing eventCooldown")
    if "composeOpeningDossier" not in read(ROOT / "opening-chronicle.js"):
        errors.append("opening-chronicle missing composeOpeningDossier")
    if "YEAR_PRESSURE_SLOTS" not in read(DATA / "opening-lexicon.js"):
        errors.append("opening-lexicon missing year/upheaval pressure slots")
    if "composeOpeningDossier" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine must compose a dynamic opening dossier")
    if "dynamicOpeningChronicle" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing dynamicOpeningChronicle")
    if "seedSessionCooldown" not in read(ROOT / "event-memory.js"):
        errors.append("event-memory missing cross-life seedSessionCooldown")
    if "TEXT_HISTORY_TURNS" not in read(ROOT / "text-history.js"):
        errors.append("text-history missing TEXT_HISTORY_TURNS buffer")
    if "recentTextHistory" not in read(ROOT / "text-history.js"):
        errors.append("text-history missing recentTextHistory")
    if "varyGenericNarrative" not in read(ROOT / "narrative-variator.js"):
        errors.append("narrative-variator missing varyGenericNarrative")
    if "VARIATOR_KINDS" not in read(DATA / "variator-lexicon.js"):
        errors.append("variator-lexicon missing VARIATOR_KINDS")
    if "beginTextTurn" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must start a text-history turn each week")
    if "weaveVariatorLine" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must weave year/place/class matrix lines")
    if "globalTextDedup" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing globalTextDedup")
    if "attachLifeContext" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must scan household/tags before sampling")
    if "beginExclusionTurn" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must open an exclusion turn each week")
    if "composeExclusiveFill" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must mint exclusive fills instead of recycling options")
    if "noOptionRecycling" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator missing noOptionRecycling gate")
    if "把這一週過完，不做多餘的決定" in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must not recycle the canned fill option")
    if "EXCLUSION_TURNS" not in read(ROOT / "exclusion-buffer.js"):
        errors.append("exclusion-buffer missing EXCLUSION_TURNS")
    if "attachLifeContext" not in read(ROOT / "life-context.js"):
        errors.append("life-context missing attachLifeContext")
    if "contextAwareRandom" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing contextAwareRandom")
    if "exclusiveOptions" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing exclusiveOptions")
    if "noOptionRecycling" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing noOptionRecycling")
    chaos = read(ROOT / "chaos-engine.js")
    hint = read(ROOT / "hint-engine.js")
    fog = read(DATA / "fog-lexicon.js")
    prose = read(DATA / "prose-rules.js")
    for needle in ("distortOption", "pickChaosProfile"):
        if needle not in chaos:
            errors.append(f"chaos-engine missing {needle}")
    for needle in ("dressOption", "publicEventView", "blunt", "fog", "FOG_KEEPS_ACTION"):
        if needle not in hint:
            errors.append(f"hint-engine missing {needle}")
    if "FOG_LINES" not in fog or "FOG_HIDDEN_WEAVES" not in fog or "FOG_COST_HINTS" not in fog:
        errors.append("fog-lexicon incomplete")
    if "拒絕謎語人" not in prose or "FOG_KEEPS_ACTION" not in prose or "PROSE_VOICE_NOTE" not in prose:
        errors.append("prose-rules missing concise/no-riddle voice spec")
    for needle in ("SYSTEM_VOICE_NOTE", "NPC_VOICE_NOTE", "NPC_GLOSS_NOTE", "主體敘述直白清晰"):
        if needle not in prose:
            errors.append(f"prose-rules missing {needle}")
    if "RIDDLE_PATTERNS" not in prose:
        errors.append("prose-rules missing RIDDLE_PATTERNS")
    if "RIDDLE_REPLACEMENTS" not in prose:
        errors.append("prose-rules missing RIDDLE_REPLACEMENTS")
    if "scrubRiddleText" not in read(DATA / "public-text.js"):
        errors.append("public-text missing scrubRiddleText")
    if "composeLifeResolution" not in read(ROOT / "life-resolution.js"):
        errors.append("life-resolution missing composeLifeResolution")
    if "explicitDeathPanel" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing explicitDeathPanel")
    index_html = read(ROOT.parent / "index.html")
    if 'id="death-resolution"' not in index_html or 'id="btn-rebirth"' not in index_html:
        errors.append("index.html missing explicit death resolution panel")
    if "重新投胎（開新局）" not in index_html:
        errors.append("death panel missing rebirth button copy")
    life_res = read(ROOT / "life-resolution.js")
    if "封閉測試" not in life_res or "測試版本" not in life_res:
        errors.append("session-close copy must name the closed-beta 18-year stage")
    if "你在" not in life_res or "過世" not in life_res:
        errors.append("death copy must state age, cause, and place of death")
    if "得年" not in life_res or "病逝" not in life_res:
        errors.append("death copy must read like a medical/historical record with 得年 and 病逝")
    if "嚴重水腫" not in life_res or "長期營養不良" not in life_res:
        errors.append("death copy must name malnutrition and edema when the body collapses")
    if "十八歲結算" in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine must not hardcode 十八歲結算 regardless of actual age")
    for banned in ("身體還在", "能一週週寫下的日子到此為止"):
        if banned in life_res or banned in read(ROOT / "GameEngine.js"):
            errors.append(f"resolution copy still uses riddle closer: {banned}")
    if "封閉測試" in read(ROOT / "ui.js"):
        errors.append("ui.js must not hardcode closed-beta slogans outside the resolution dossier")
    for banned in ("還沒有名字的東西", "體內有一枚尚未被公開的標籤", "把影子留在原地", "數到三再眨眼", "命運的風鈴", "暗影在呼吸中交織", "聽起來輕", "好處變薄", "帳從別處扣"):
        if banned in fog:
            errors.append(f"fog-lexicon still uses riddle line: {banned}")
    for path, blob in (
        (ROOT / "eventGenerator.js", read(ROOT / "eventGenerator.js")),
        (ROOT / "trauma-engine.js", read(ROOT / "trauma-engine.js")),
        (ROOT / "world-event-engine.js", read(ROOT / "world-event-engine.js")),
        (ROOT / "school-engine.js", read(ROOT / "school-engine.js")),
    ):
        for banned in ("好處變薄", "帳從別處扣", "舊傷先發制人", "聽起來輕的那一步"):
            if banned in blob:
                errors.append(f"{path.name} still emits riddle aside: {banned}")
    if "trueText" not in hint or "FOG_KEEPS_ACTION" not in hint:
        errors.append("hint-engine must keep option action readable under fog")
    if "${preview}" in hint or "〔${preview}〕" in hint or "〔${hint}〕" in hint:
        errors.append("hint-engine must not concatenate invoices or fog hints onto choice labels")
    ui_js_hint = read(ROOT / "ui.js")
    if "option.preview" in ui_js_hint:
        errors.append("ui must not paint option.preview invoices on choice buttons")
    constants = read(ROOT / "constants.js")
    if '"health"' not in constants or '"sanity"' not in constants:
        errors.append("STAT_KEYS must include health and sanity")
    if "intelligence:" in constants or '"魅力"' in constants:
        errors.append("constants must not expose intelligence/charm as core stats")
    if "export function canonicalizeEffects" not in read(ROOT / "stat-canon.js"):
        errors.append("missing stat-canon canonicalizeEffects")
    if "export function stripChoiceSpoilers" not in read(DATA / "public-text.js"):
        errors.append("public-text missing stripChoiceSpoilers")
    if "canonicalizeEffects" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must canonicalize option effects before applying")
    if "PROSE_VOICE_NOTE" not in read(ROOT.parent / "script.js"):
        errors.append("script.js missing PROSE_VOICE_NOTE export")
    script_js_early = read(ROOT.parent / "script.js")
    for needle in ("SYSTEM_VOICE_NOTE", "NPC_VOICE_NOTE", "attachNpcSpeech"):
        if needle not in script_js_early:
            errors.append(f"script.js missing {needle} export")
    gen = read(ROOT / "eventGenerator.js")
    if "迷霧選項會說謊" in gen:
        errors.append("eventGenerator still advertises riddle fog")
    if "renderSliceLead" not in read(ROOT / "daily-engine.js"):
        errors.append("daily log must use a single lead beat, not a recap reel")
    game = read(ROOT / "GameEngine.js")
    for needle in ("createClockAtAge", "shouldClosePlayWindow", "publicEventView", "_comingOfAge"):
        if needle not in game:
            errors.append(f"GameEngine missing {needle}")
    timejs = read(ROOT / "time.js")
    if "createClockAtAge" not in timejs:
        errors.append("time.js missing createClockAtAge")
    if "dateAtAgeTurn" not in timejs:
        errors.append("time.js missing dateAtAgeTurn for 24 fortnights per year")
    if "addDays(current, 7)" in timejs:
        errors.append("time.js must not advance the clock by a single week")
    if "TURNS_PER_YEAR = 24" not in read(ROOT / "constants.js"):
        errors.append("constants must set TURNS_PER_YEAR = 24")
    if "DAYS_PER_TURN = 14" not in read(ROOT / "constants.js"):
        errors.append("constants must set DAYS_PER_TURN = 14")
    if "TURNS_TO_AGE_18 = 18 * TURNS_PER_YEAR" not in read(ROOT / "constants.js"):
        errors.append("constants must define TURNS_TO_AGE_18 as 18×24")
    if "advanceClock(this.clock, this.character)" not in game:
        errors.append("GameEngine must advance the clock against the birth date")
    if "biweeklyTurns: true" not in game:
        errors.append("GameEngine sandbox missing biweeklyTurns")
    if "biweeklyTurns: true" not in genesis:
        errors.append("genesis missing biweeklyTurns flag")
    if "turnsToAge18: 432" not in genesis:
        errors.append("genesis must stamp 432 turns to age 18")
    if "1 / 52" in read(ROOT / "mortality-engine.js"):
        errors.append("mortality-engine must convert annual risk with TURNS_PER_YEAR, not 52 weeks")
    if "TURNS_PER_YEAR" not in read(ROOT.parent / "script.js"):
        errors.append("script.js must export TURNS_PER_YEAR")
    awakening = read(DATA / "awakening-actions.js")
    ages = [int(n) for n in age_re.findall(awakening)]
    if any(n < 5 for n in ages):
        errors.append("awakening actions below age 5")

    daily_dir = DATA / "daily"
    daily_files = list(daily_dir.glob("*.js")) if daily_dir.exists() else []
    if len(daily_files) < 8:
        errors.append(f"daily data modules too few: {len(daily_files)}")
    daily_blob = "\n".join(read(p) for p in daily_files)
    if "dailySlice" not in daily_blob and "schema.js" not in [p.name for p in daily_files]:
        errors.append("daily schema helper missing")
    if re.search(r"兒童色情|虐童|CSAM|child\s*porn", daily_blob, re.I):
        errors.append("daily modules hit child-harm redline lexicon")
    engine_js = read(ROOT / "daily-engine.js")
    for needle in ("resolveDailyState", "pickDailyTexture", "renderDailyNarrative"):
        if needle not in engine_js:
            errors.append(f"daily-engine missing {needle}")
    if "school_child" not in daily_blob or "underworld_cover" not in daily_blob or "prison" not in daily_blob:
        errors.append("core daily states missing from data")

    trauma_names = ("trauma-home.js", "trauma-authority.js", "trauma-labor.js")
    for name in trauma_names:
        if not (daily_dir / name).exists():
            errors.append(f"missing daily trauma module {name}")
    trauma_blob = "\n".join(read(daily_dir / name) for name in trauma_names if (daily_dir / name).exists())
    writing = read(DATA / "trauma-writing-rules.js")
    tags_db = read(DATA / "trauma-tags-database.js")
    climate = read(DATA / "household-climate.js")
    trauma_engine = read(ROOT / "trauma-engine.js")
    catalog = read(daily_dir / "catalog.js")
    chaos = read(ROOT / "chaos-engine.js")
    if "SEXUAL_MINOR_PATTERNS" not in writing:
        errors.append("trauma writing rules missing SEXUAL_MINOR_PATTERNS")
    if "TRAUMA_HOME_SLICES" not in catalog or "TRAUMA_AUTHORITY_SLICES" not in catalog or "TRAUMA_LABOR_SLICES" not in catalog:
        errors.append("daily catalog missing trauma slice modules")
    if re.search(r"兒童色情|兒童性侵|CSAM|child\s*porn|性侵.{0,10}(孩|童)|猥褻", trauma_blob, re.I):
        errors.append("trauma modules contain sexual-minor lexicon")
    if re.search(r"因禍得福|打是親罵是愛|愛的管教成就了你|甜蜜的痛", trauma_blob):
        errors.append("trauma modules romanticize injury")
    for needle in ("trauma_hypervigilance", "trauma_cannot_ask_help", "trauma_labor_scar", "trauma_cruelty_rehearsal"):
        if needle not in tags_db:
            errors.append(f"trauma tags missing {needle}")
    for needle in ("household_volatile", "household_alcohol", "household_extractive", "rollHouseholdClimate"):
        if needle not in climate:
            errors.append(f"household climate missing {needle}")
    for needle in ("applyTrauma", "weeklyTraumaPressure", "modifyResolutionForTrauma"):
        if needle not in trauma_engine:
            errors.append(f"trauma-engine missing {needle}")
    if "rollHouseholdClimate" not in genesis or "emptyTraumaState" not in genesis or "traumaEngine" not in genesis:
        errors.append("genesis missing household climate / trauma engine wiring")
    if "applyTrauma" not in game or "weeklyTraumaPressure" not in game:
        errors.append("GameEngine missing trauma application")
    if "traumaVictim" not in chaos:
        errors.append("chaos-engine must lock trauma victim options against bless/invert")
    if "injectChance" not in engine_js and "household_" not in engine_js:
        errors.append("daily-engine missing trauma slice injection")
    if trauma_blob.count("traumaVictim") + trauma_blob.count("trauma:") < 8:
        errors.append("trauma slices look too thin")

    school_dir = DATA / "school-incidents"
    school_names = ("child.js", "teen.js", "extreme.js", "catalog.js", "schema.js")
    for name in school_names:
        if not (school_dir / name).exists():
            errors.append(f"missing school incident module {name}")
    school_blob = "\n".join(read(school_dir / name) for name in school_names if (school_dir / name).exists())
    school_rules = read(DATA / "school-dark-rules.js")
    school_tags = read(DATA / "school-tags-database.js")
    school_engine = read(ROOT / "school-engine.js")
    if "SCHOOL_STANCE_NOTE" not in school_rules or "SCHOOL_COST_NOTE" not in school_rules:
        errors.append("school dark rules incomplete")
    if "perpetrator: true" not in school_blob:
        errors.append("school incidents missing perpetrator stances")
    if school_blob.count("stance:") < 20:
        errors.append("school incidents too thin on stances")
    if re.search(r"兒童色情|兒童性侵|CSAM|child\s*porn|性侵.{0,10}(孩|童)|猥褻", school_blob, re.I):
        errors.append("school incidents contain sexual-minor lexicon")
    if re.search(r"霸凌讓人成長|打出真感情|校園暴力是青春|幫派是家", school_blob):
        errors.append("school incidents romanticize harm")
    for needle in ("school_bully", "school_gang", "school_hated", "school_expelled", "school_weapon"):
        if needle not in school_tags:
            errors.append(f"school tags missing {needle}")
    for needle in ("pickSchoolIncident", "applySchoolChoice", "weeklySchoolFallout"):
        if needle not in school_engine:
            errors.append(f"school-engine missing {needle}")
    if "pickSchoolIncident" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator missing school incident pick")
    if "applySchoolChoice" not in game or "weeklySchoolFallout" not in game:
        errors.append("GameEngine missing school application")
    if "rollSchoolClimate" not in genesis or "schoolEngine" not in genesis:
        errors.append("genesis missing school climate / engine wiring")
    if "schoolPeerHarm" not in boundary:
        errors.append("boundary missing schoolPeerHarm exception")
    if "schoolIncident" not in chaos:
        errors.append("chaos-engine must lock school incidents against bless/invert")

    caste_files = ("prison-caste.js", "society-caste.js")
    for name in caste_files:
        if not (daily_dir / name).exists():
            errors.append(f"missing daily caste module {name}")
    caste_blob = "\n".join(read(daily_dir / name) for name in caste_files if (daily_dir / name).exists())
    caste_rules = read(DATA / "perp-caste-rules.js")
    caste_tags = read(DATA / "perp-caste-tags-database.js")
    caste_engine = read(ROOT / "perp-caste-engine.js")
    if "SEXUAL_MINOR_ACT_PATTERNS" not in caste_rules or "PERP_CASTE_COST_NOTE" not in caste_rules:
        errors.append("perp-caste writing rules incomplete")
    if "PRISON_CASTE_SLICES" not in catalog or "SOCIETY_CASTE_SLICES" not in catalog:
        errors.append("daily catalog missing caste slice modules")
    if re.search(r"兒童色情|CSAM|child\s*porn|猥褻.{0,8}(兒童|幼)|如何.{0,8}性侵", caste_blob, re.I):
        errors.append("caste modules contain sexual-minor act lexicon")
    if re.search(r"被誤解的愛|愛情不分年齡|可憐的加害者|悲劇英雄", caste_blob):
        errors.append("caste modules romanticize offenders")
    if "age: [18, 90]" not in caste_blob:
        errors.append("caste slices must be age-gated 18+")
    if "perpCaste" not in caste_blob:
        errors.append("caste slices missing perpCaste flag")
    for needle in ("caste_contaminate", "caste_revulsion", "caste_witness", "caste_reputation", "caste_enforcer"):
        if needle not in caste_tags:
            errors.append(f"caste tags missing {needle}")
    for needle in ("applyPerpCaste", "weeklyCastePressure", "stampCasteTags"):
        if needle not in caste_engine:
            errors.append(f"perp-caste-engine missing {needle}")
    if "applyPerpCaste" not in game or "weeklyCastePressure" not in game:
        errors.append("GameEngine missing caste application")
    if "perpCasteEngine" not in genesis:
        errors.append("genesis missing perp caste engine flag")
    if "perpCasteEcology" not in boundary:
        errors.append("boundary missing perpCasteEcology lens")
    if "perpCasteEcology" not in chaos:
        errors.append("chaos-engine must lock caste ecology against bless/invert")
    if "scanSexualMinorActs" not in boundary:
        errors.append("boundary missing sexual-minor act scanner")

    adult_dir = DATA / "adult-incidents"
    adult_names = ("labor.js", "office.js", "commerce.js", "politics.js", "underworld.js", "generic.js", "catalog.js", "schema.js")
    for name in adult_names:
        if not (adult_dir / name).exists():
            errors.append(f"missing adult incident module {name}")
    adult_blob = "\n".join(read(adult_dir / name) for name in adult_names if (adult_dir / name).exists())
    adult_rules = read(DATA / "adult-writing-rules.js")
    adult_tags = read(DATA / "adult-tags-database.js")
    occupations = read(DATA / "occupations-database.js")
    adult_engine = read(ROOT / "adult-engine.js")
    if "ADULT_STANCE_NOTE" not in adult_rules or "ADULT_COST_NOTE" not in adult_rules:
        errors.append("adult writing rules incomplete")
    if "dark: true" not in adult_blob:
        errors.append("adult incidents missing dark stances")
    if adult_blob.count("stance:") < 24:
        errors.append("adult incidents too thin on stances")
    if re.search(r"兒童色情|兒童性侵|CSAM|child\s*porn|性侵.{0,10}(孩|童)|猥褻", adult_blob, re.I):
        errors.append("adult incidents contain sexual-minor lexicon")
    if re.search(r"犯罪讓人自由|黑道是家|主角光環|作惡無代價|暴力是浪漫", adult_blob):
        errors.append("adult incidents romanticize crime")
    for needle in ("adult_burnout", "adult_gang_rank", "adult_betrayer", "adult_liquidated_mark", "adult_debt"):
        if needle not in adult_tags:
            errors.append(f"adult tags missing {needle}")
    for needle in ("factory_hand", "office_clerk", "shopkeep", "gang_runner", "party_staff"):
        if needle not in occupations:
            errors.append(f"occupations missing {needle}")
    for needle in ("pickAdultIncident", "applyAdultChoice", "weeklyCareerFallout", "assignOccupation"):
        if needle not in adult_engine:
            errors.append(f"adult-engine missing {needle}")
    if "pickAdultIncident" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator missing adult incident pick")
    if "applyAdultChoice" not in game or "weeklyCareerFallout" not in game:
        errors.append("GameEngine missing adult application")
    if "_endLongevity" not in game:
        errors.append("GameEngine missing longevity close")
    if "adultEngine" not in genesis or "emptyCareerState" not in genesis:
        errors.append("genesis missing adult engine wiring")
    if "adultIncident" not in chaos:
        errors.append("chaos-engine must lock adult incidents against bless/invert")
    if "OFFICE_WHITE_SLICES" not in catalog or "COMMERCE_FLOOR_SLICES" not in catalog:
        errors.append("daily catalog missing adult occupation slice modules")
    if "office_white" not in read(DATA / "daily" / "states.js"):
        errors.append("daily states missing office_white")

    mort_files = (
        "mortality-rules.js",
        "mortality-age-tables.js",
        "mortality-geo.js",
        "mortality-history.js",
        "mortality-tag-weights.js",
        "mortality-causes.js",
    )
    for name in mort_files:
        if not (DATA / name).exists():
            errors.append(f"missing mortality data module {name}")
    mort_engine = read(ROOT / "mortality-engine.js")
    mort_age = read(DATA / "mortality-age-tables.js")
    mort_geo = read(DATA / "mortality-geo.js")
    mort_hist = read(DATA / "mortality-history.js")
    mort_rules = read(DATA / "mortality-rules.js")
    if "rollWeeklySurvival" not in mort_engine or "evaluateWeeklyMortality" not in mort_engine:
        errors.append("mortality-engine missing roll/evaluate")
    if "annualToWeekly" not in mort_engine:
        errors.append("mortality-engine missing annualToWeekly")
    if "MORTALITY_COST_NOTE" not in mort_rules:
        errors.append("mortality rules incomplete")
    if "child_early" not in mort_age or "y1920s" not in mort_age or "y2020s" not in mort_age:
        errors.append("mortality age tables missing year/age bands")
    if "AGE_SURVIVAL_COEFFICIENTS" not in mort_age or "coefficient: 0.5" not in mort_age:
        errors.append("mortality age tables missing under-10 coefficient 0.5")
    if "ageSurvivalCoefficient" not in mort_engine:
        errors.append("mortality-engine missing ageSurvivalCoefficient apply")
    for needle in ("warzone", "slum", "arctic", "affluent_safe"):
        if needle not in mort_geo:
            errors.append(f"mortality geo missing {needle}")
    if "years: [1920, 1920]" not in mort_hist and "years: [1920, 1921]" not in mort_hist:
        errors.append("mortality history must cover 1920")
    if "covid" not in mort_hist.lower() and "COVID" not in mort_hist:
        errors.append("mortality history missing COVID overlay")
    if "rollWeeklySurvival" not in game:
        errors.append("GameEngine missing weekly survival roll")
    if "naturalDeathChance" in game:
        errors.append("GameEngine still uses naturalDeathChance instead of mortality engine")
    if "mortalityEngine" not in genesis:
        errors.append("genesis missing mortalityEngine flag")
    if "evaluateWeeklyMortality" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator missing mortality invoice")

    world_dir = DATA / "world-events"
    world_names = (
        "schema.js",
        "catalog.js",
        "mundane.js",
        "geo-affluent.js",
        "geo-slum.js",
        "geo-war.js",
        "geo-arctic.js",
        "geo-disaster.js",
        "survival-plague.js",
        "household.js",
        "dark-street.js",
        "historical.js",
    )
    for name in world_names:
        if not (world_dir / name).exists():
            errors.append(f"missing world-event module {name}")
    world_blob = "\n".join(read(world_dir / name) for name in world_names if (world_dir / name).exists())
    world_rules = read(DATA / "world-event-rules.js")
    world_tags = read(DATA / "world-event-tags.js")
    world_engine = read(ROOT / "world-event-engine.js")
    world_schema = read(world_dir / "schema.js")
    if "WORLD_STANCE_NOTE" not in world_rules or "WORLD_COST_NOTE" not in world_rules:
        errors.append("world-event rules incomplete")
    if "worldEvent" not in world_schema or "geoBands" not in world_schema or "historyIds" not in world_schema:
        errors.append("world-event schema missing contextual filters")
    if world_blob.count("stance:") < 40:
        errors.append("world events too thin on stances")
    if "covid_2020" not in world_blob or "great_leap_peak" not in world_blob:
        errors.append("world historical packs missing named historyIds")
    if "geoBands: [\"warzone\"]" not in world_blob and "geoBands: ['warzone']" not in world_blob:
        errors.append("world events missing warzone geo filter")
    if re.search(r"兒童色情|兒童性侵|CSAM|child\s*porn|性侵.{0,10}(孩|童)|猥褻", world_blob, re.I):
        errors.append("world events contain sexual-minor lexicon")
    if re.search(r"戰爭讓人成長|貧窮是浪漫|飢荒成就|主角光環|犯罪讓人自由", world_blob):
        errors.append("world events romanticize harm")
    for needle in ("world_stray_fire", "world_famine_witness", "world_plague_queue", "world_slum_tax", "world_informant"):
        if needle not in world_tags:
            errors.append(f"world tags missing {needle}")
    for needle in ("pickWorldEvent", "applyWorldEventChoice", "weeklyWorldEventFallout", "eventMatches", "attachWorldContext"):
        if needle not in world_engine:
            errors.append(f"world-event-engine missing {needle}")
    if "MORTALITY_HISTORY" not in world_engine:
        errors.append("world-event-engine must gate historyIds against mortality history")
    if "pickWorldEvent" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator missing world event pick")
    if "lock: \"crisis\"" not in read(ROOT / "eventGenerator.js") and "lock: 'crisis'" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must pick crisis world events before school/adult")
    if "applyWorldEventChoice" not in game or "weeklyWorldEventFallout" not in game:
        errors.append("GameEngine missing world-event application")
    if "worldEventEngine" not in genesis or "emptyWorldEventState" not in genesis:
        errors.append("genesis missing world event engine wiring")
    if "worldEvent" not in chaos:
        errors.append("chaos-engine must lock world events against bless/invert")
    if "worldLens" not in boundary and "worldEvent && action.worldNonsexual" not in boundary:
        errors.append("boundary missing worldEvent lens")
    if 'world: "world_"' not in read(DATA / "tag-schema.js") and "world: 'world_'" not in read(DATA / "tag-schema.js"):
        errors.append("tag-schema missing world_ prefix")
    if "world_stray_fire" not in read(DATA / "mortality-tag-weights.js"):
        errors.append("mortality tag weights missing world event tags")

    fig_dir = DATA / "figures"
    fig_names = (
        "schema.js",
        "catalog.js",
        "politicians-asia.js",
        "politicians-west.js",
        "military.js",
        "science.js",
        "arts-social.js",
        "crime.js",
    )
    for name in fig_names:
        if not (fig_dir / name).exists():
            errors.append(f"missing figure module {name}")
    enc_dir = DATA / "figure-encounters"
    enc_names = ("schema.js", "catalog.js", "templates.js", "named.js")
    for name in enc_names:
        if not (enc_dir / name).exists():
            errors.append(f"missing figure-encounter module {name}")
    fig_blob = "\n".join(read(fig_dir / name) for name in fig_names if (fig_dir / name).exists())
    enc_blob = "\n".join(read(enc_dir / name) for name in enc_names if (enc_dir / name).exists())
    fig_rules = read(DATA / "figure-rules.js")
    fig_tags = read(DATA / "figure-tags.js")
    cascades = read(DATA / "butterfly-cascades.js")
    hist_engine = read(ROOT / "history-engine.js")
    if "FIGURE_STANCE_NOTE" not in fig_rules or "FIGURE_COST_NOTE" not in fig_rules:
        errors.append("figure rules incomplete")
    if fig_blob.count("fig({") < 24:
        errors.append("historical figures catalog too thin")
    if "visibleFrom" not in read(fig_dir / "schema.js") or "deathYear" not in read(fig_dir / "schema.js"):
        errors.append("figure schema missing visibility/death windows")
    if "hitler" not in fig_blob or "mao_zedong" not in fig_blob or "al_capone" not in fig_blob:
        errors.append("figures catalog missing keyed century bodies")
    if enc_blob.count("stance:") < 24:
        errors.append("figure encounters too thin on stances")
    if "butterfly:" not in enc_blob:
        errors.append("figure encounters missing butterfly intervention stances")
    if re.search(r"兒童色情|兒童性侵|CSAM|child\s*porn|性侵.{0,10}(孩|童)|猥褻", fig_blob + enc_blob, re.I):
        errors.append("figure modules contain sexual-minor lexicon")
    if re.search(r"改變歷史就是英雄|暗殺使人偉大|戰爭讓人成長", enc_blob):
        errors.append("figure encounters romanticize intervention")
    for needle in ("figure_witness", "figure_hunted", "figure_butterfly", "figure_ally", "figure_enemy"):
        if needle not in fig_tags:
            errors.append(f"figure tags missing {needle}")
    if "BUTTERFLY_CASCADES" not in cascades or "suppress:" not in cascades:
        errors.append("butterfly cascades incomplete")
    for needle in ("pickFigureEncounter", "applyFigureChoice", "weeklyHistoryFallout", "filterShockRow", "applyButterfly", "emptyHistoryState"):
        if needle not in hist_engine:
            errors.append(f"history-engine missing {needle}")
    if "pickFigureEncounter" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator missing figure encounter pick")
    if "applyFigureChoice" not in game or "weeklyHistoryFallout" not in game:
        errors.append("GameEngine missing figure/butterfly application")
    if "figureEngine" not in genesis or "emptyHistoryState" not in genesis or "butterflyEngine" not in genesis:
        errors.append("genesis missing figure/butterfly wiring")
    if "figureEncounter" not in chaos:
        errors.append("chaos-engine must lock figure encounters against bless/invert")
    if "figureLens" not in boundary:
        errors.append("boundary missing figureEncounter lens")
    if 'figure: "figure_"' not in read(DATA / "tag-schema.js"):
        errors.append("tag-schema missing figure_ prefix")
    if "filterShockRow" not in read(ROOT / "mortality-engine.js"):
        errors.append("mortality-engine must honour butterfly shock overrides")
    if "filterShockRow" not in read(ROOT / "world-event-engine.js"):
        errors.append("world-event-engine must honour butterfly shock overrides")
    if "figure_hunted" not in read(DATA / "mortality-tag-weights.js"):
        errors.append("mortality tag weights missing figure backlash tags")

    ui_config = read(DATA / "ui-config.js")
    social = read(ROOT / "social-feedback.js")
    ledger_schema = read(DATA / "ledger-schema.js")
    ui_js = read(ROOT / "ui.js")
    index_html = read(ROOT.parent / "index.html")
    style_css = read(ROOT.parent / "style.css")
    script_js = read(ROOT.parent / "script.js")
    if "SHOW_REPUTATION_UI = false" not in ui_config:
        errors.append("ui-config must default SHOW_REPUTATION_UI to false (方案 A)")
    if "socialCredit" not in ledger_schema or '"reputation"' not in ledger_schema:
        errors.append("ledger-schema missing hidden reputation/socialCredit meters")
    for needle in ("socialStanding", "describeSocialFeedback", "socialAttemptMod", "exposeSocialMeters"):
        if needle not in social:
            errors.append(f"social-feedback missing {needle}")
    if "路人先把視線挪開" not in social and "排隊時有人往旁邊讓出半步" not in social:
        errors.append("social-feedback missing vernacular NPC attitude lines")
    if re.search(r"還沒有名字的東西|數到三再眨眼", social):
        errors.append("social-feedback uses riddle copy")
    if "SHOW_REPUTATION_UI" not in ui_js or "hide-reputation-ui" not in ui_js:
        errors.append("ui.js must bind SHOW_REPUTATION_UI and hide reputation HUD")
    if 'id="stat-reputation"' not in index_html:
        errors.append("index.html must keep #stat-reputation for the display toggle")
    if "hide-reputation-ui" not in style_css:
        errors.append("style.css missing hide-reputation-ui rule")
    if "SHOW_REPUTATION_UI" not in script_js:
        errors.append("script.js must re-export SHOW_REPUTATION_UI")
    if "age_lane" not in read(ROOT / "boundary.js"):
        errors.append("boundary must fail-close on age-lane mismatches")
    if "contentAllowedForAge" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must age-gate actions before sampling")
    if "incidentAllowed" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must drop age-illegal locked triads")
    if "age < 7" not in read(ROOT / "school-engine.js") and "age < 7 || age > 17" not in read(ROOT / "school-engine.js"):
        errors.append("school-engine must limit campus incidents to ages 7–17")
    if "dailyAudienceAllowed" not in read(ROOT / "daily-engine.js"):
        errors.append("daily-engine must use strict life-band audience gates")
    if "EARLY_CHILD_MAX = 6" not in read(DATA / "age-gate-rules.js"):
        errors.append("age-gate-rules missing early-child / student / adult bands")
    if "worldKind === \"dark\" && adultActor" not in read(ROOT / "age-gate.js"):
        errors.append("age-gate must treat street-dark perpetrator options as adult society")
    if "adult_romance" not in read(ROOT / "age-gate.js"):
        errors.append("age-gate must classify work/drink/romance as 18+")
    if "eraAgeEnv: true" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must stamp era×age×environment childhood climate")
    if "childhoodClimate" not in read(ROOT / "early-child-filter.js"):
        errors.append("early-child-filter missing childhoodClimate")
    if "EARLY_CHILD_FRIVOLOUS_PATTERNS" not in read(DATA / "early-child-climate.js"):
        errors.append("early-child-climate missing frivolous park/school/social patterns")
    if "ec_hunger_bowl" not in read(DATA / "early-child-survival-actions.js"):
        errors.append("early-child survival pool missing hunger/fever/left-home options")
    if "HOME_SURVIVAL_SLICES" not in read(DATA / "daily" / "catalog.js"):
        errors.append("daily catalog must include early-child home survival slices")
    if "earlyChildAllowed" not in script_js:
        errors.append("script.js must export early-child survival filter")
    if "eraAgeEnvFilter" not in game:
        errors.append("GameEngine sandbox missing eraAgeEnvFilter")
    if "ageGatedChoices" not in game:
        errors.append("GameEngine sandbox missing ageGatedChoices")
    if "semantic_context" not in read(ROOT / "boundary.js"):
        errors.append("boundary must fail-close on semantic context mismatches")
    if "semanticOptionAllowed" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must semantically filter sampled options")
    if "CHILD_MATURE_PATTERNS" not in read(DATA / "semantic-context-rules.js"):
        errors.append("semantic-context-rules missing child-mature / motion / leisure patterns")
    if "situationFrame" not in read(ROOT / "semantic-filter.js"):
        errors.append("semantic-filter missing situationFrame")
    if "semanticOptionAllowed" not in script_js:
        errors.append("script.js must export semantic context filter")
    if "semanticContextFilter" not in game:
        errors.append("GameEngine sandbox missing semanticContextFilter")
    if "fullTagLinkage" not in game:
        errors.append("GameEngine sandbox missing fullTagLinkage")
    if "asymmetricSurvival" not in game:
        errors.append("GameEngine sandbox missing asymmetricSurvival")
    if "tagInfluenceCap" not in game:
        errors.append("GameEngine sandbox missing tagInfluenceCap")
    if "untaggedBaseline" not in game:
        errors.append("GameEngine sandbox missing untaggedBaseline")
    if "MAX_TAGS_PER_CHOICE" not in read(DATA / "tag-influence-rules.js"):
        errors.append("tag-influence-rules missing MAX_TAGS_PER_CHOICE")
    if "ensureUntaggedBaseline" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must reserve a tag-free baseline option")
    if "selectInterveningTags" not in read(ROOT / "tag-influence.js"):
        errors.append("tag-influence missing selectInterveningTags cap")
    if "MAX_TAGS_PER_CHOICE" not in script_js:
        errors.append("script.js must export tag-influence cap helpers")
    if "ensureTagCoverage" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must scan live tags with ensureTagCoverage")
    if "graftAsymmetricOptions" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must graft asymmetric survival options onto locked incidents")
    if "PREFIX_LINK_POOL" not in read(DATA / "tag-link-actions.js"):
        errors.append("tag-link-actions missing PREFIX_LINK_POOL")
    if "ASYMMETRIC_SURVIVAL_POOL" not in read(DATA / "asymmetric-survival-actions.js"):
        errors.append("asymmetric-survival-actions missing ASYMMETRIC_SURVIVAL_POOL")
    if "asym_spec_second_tongue" not in read(DATA / "asymmetric-survival-actions.js"):
        errors.append("asymmetric pool missing specialized bloodline/adversity exits")
    if "we_bias_listing" not in read(DATA / "world-events" / "asymmetric-bias.js"):
        errors.append("world-events asymmetric-bias pack missing listing/ration/exposure crises")
    if "WORLD_ASYMMETRIC_BIAS_EVENTS" not in read(DATA / "world-events" / "catalog.js"):
        errors.append("world-event catalog must include asymmetric bias pack")
    if "fullTagLinkage: true" not in genesis:
        errors.append("genesis missing fullTagLinkage flag")
    if "asymmetricSurvival: true" not in genesis:
        errors.append("genesis missing asymmetricSurvival flag")
    if "tagInfluenceCap: true" not in genesis:
        errors.append("genesis missing tagInfluenceCap flag")
    if "untaggedBaseline: true" not in genesis:
        errors.append("genesis missing untaggedBaseline flag")
    if "dynamicOpeningChronicle: true" not in genesis:
        errors.append("genesis missing dynamicOpeningChronicle flag")
    if "fourPillarProse: true" not in genesis:
        errors.append("genesis missing fourPillarProse flag")
    if "progressiveLifeStages: true" not in genesis:
        errors.append("genesis missing progressiveLifeStages flag")
    if "themeManager: true" not in genesis:
        errors.append("genesis missing themeManager flag")
    if "dynamicComputationEngine: true" not in genesis:
        errors.append("genesis missing dynamicComputationEngine flag")
    if "contextAwareRandom: true" not in genesis:
        errors.append("genesis missing contextAwareRandom flag")
    if "exclusiveOptions: true" not in genesis:
        errors.append("genesis missing exclusiveOptions flag")
    if "noOptionRecycling: true" not in genesis:
        errors.append("genesis missing noOptionRecycling flag")
    if "exclusionBuffer" not in genesis:
        errors.append("genesis must initialize exclusionBuffer")
    if "ensureTagCoverage" not in script_js:
        errors.append("script.js must export full-tag linkage helpers")
    tag_schema = read(DATA / "tag-schema.js")
    tag_link = read(DATA / "tag-link-actions.js")
    for prefix in re.findall(r'^\s+[a-zA-Z]+:\s*"([a-z_]+_)"\s*,', tag_schema, re.M):
        if f'"{prefix}"' not in tag_link:
            errors.append(f"tag-link-actions missing prefix beat for {prefix}")
    if "contentAllowedForAge" not in script_js:
        errors.append("script.js must export age-gate APIs")
    if "canBeginNewLife" not in script_js:
        errors.append("script.js must export the permanent life lock")
    if "EVENT_COOLDOWN_CAP" not in script_js:
        errors.append("script.js must export event cooldown helpers")
    if "assembleWeeklyChronicle" not in script_js:
        errors.append("script.js must export chronicle variance helpers")
    if "composeLifeResolution" not in script_js:
        errors.append("script.js must export the death resolution composer")
    if "TEXT_HISTORY_TURNS" not in script_js:
        errors.append("script.js must export the recent-text history buffer")
    if "varyGenericNarrative" not in script_js:
        errors.append("script.js must export the narrative variator")
    if "scrubRiddleText" not in script_js:
        errors.append("script.js must export riddle-scrub helpers")
    if "composeOpeningDossier" not in script_js:
        errors.append("script.js must export the opening chronicle engine")
    if "EXCLUSION_TURNS" not in script_js:
        errors.append("script.js must export the option exclusion buffer")
    if "attachLifeContext" not in script_js:
        errors.append("script.js must export the weekly life-context scan")
    if "attachLifeProgress" not in script_js:
        errors.append("script.js must export LifeStageManager helpers")
    if "applyTheme" not in script_js:
        errors.append("script.js must export ThemeManager helpers")
    if "composeExclusiveFill" not in script_js:
        errors.append("script.js must export exclusive option minting")
    if "BETA_CONFIG" not in script_js:
        errors.append("script.js must export the closed-beta config module")
    if "describeSocialFeedback" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must weave social feedback into weekly copy")
    if "attachUpheaval" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must attach year-aligned social upheaval")
    if "SOCIAL_UPHEAVALS" not in read(DATA / "social-upheaval.js"):
        errors.append("social-upheaval catalog missing SOCIAL_UPHEAVALS")
    if "we_draft_board" not in read(DATA / "world-events" / "social-upheaval.js"):
        errors.append("world-events social-upheaval pack missing conscription triad")
    if "we_depression_gate" not in read(DATA / "world-events" / "social-upheaval.js"):
        errors.append("world-events social-upheaval pack missing unemployment triad")
    if "we_cash_run_1929" not in read(DATA / "world-events" / "social-upheaval.js"):
        errors.append("world-events social-upheaval pack missing devaluation triad")
    if "we_flight_1949" not in read(DATA / "world-events" / "social-upheaval.js"):
        errors.append("world-events social-upheaval pack missing flight triad")
    if "WORLD_SOCIAL_UPHEAVAL_EVENTS" not in read(DATA / "world-events" / "catalog.js"):
        errors.append("world-event catalog must include social upheaval pack")
    if "world_draft_notice" not in read(DATA / "world-event-tags.js"):
        errors.append("world-event-tags missing draft/layoff/devaluation/flight tags")
    if "weeklyUpheavalTick" not in game:
        errors.append("GameEngine missing weeklyUpheavalTick")
    if "upheavalScore" not in read(ROOT / "risk-calculator.js"):
        errors.append("crisisPressure must fold historical upheaval into crisis score")
    if "SHOW_REPUTATION_UI = false" not in read(DATA / "ui-config.js"):
        errors.append("Scheme A: SHOW_REPUTATION_UI must stay false")
    npc_voice = read(ROOT / "npc-voice.js")
    if "minorityMarked" not in npc_voice and "upheavalOf" not in npc_voice:
        errors.append("npc-voice must change attitude by hidden standing and upheaval")
    if "你這種口音也敢排這兒" not in read(DATA / "npc-voices.js"):
        errors.append("npc-voices missing upheaval disdain/shelter lines")
    if "先到我家坐一下" not in read(DATA / "npc-voices.js"):
        errors.append("npc-voices missing shelter line for trusted standing")
    if "socialAttemptMod" not in read(ROOT / "risk-calculator.js"):
        errors.append("risk-calculator must use social standing for attempt odds")
    if 'social: "social_"' not in read(DATA / "tag-schema.js"):
        errors.append("tag-schema missing social_ prefix")
    if "Microsoft JhengHei" not in style_css or "微軟正黑體" not in style_css:
        errors.append("style.css must set Microsoft JhengHei as the UI font")
    if "CLASSIFIED DOSSIER" in index_html or "THE CENTURY FILE" in index_html:
        errors.append("index.html still has English masthead chrome")
    if "publicTagLabel" not in ui_js:
        errors.append("ui.js must map tag chips through publicTagLabel")
    if "zhCause" not in read(ROOT / "mortality-engine.js"):
        errors.append("mortality-engine must print Chinese cause names")
    if not (DATA / "ui-zh.js").exists():
        errors.append("missing js/data/ui-zh.js public Chinese labels")

    voices_path = DATA / "npc-voices.js"
    voice_engine = read(ROOT / "npc-voice.js")
    if not voices_path.exists():
        errors.append("missing js/data/npc-voices.js")
    else:
        voices = read(voices_path)
        if "NPC_VOICES" not in voices or "NPC_ATTITUDES" not in voices:
            errors.append("npc-voices missing NPC_VOICES / NPC_ATTITUDES")
        for speaker in ("gangster", "authority", "clerk", "civilian", "merchant", "foreman", "bully", "household", "orator", "officer", "scholar"):
            if f"{speaker}:" not in voices:
                errors.append(f"npc-voices missing speaker {speaker}")
        glosses = re.findall(r'v\(\s*"(?:\\.|[^"\\])*"\s*,\s*"((?:\\.|[^"\\])*)"', voices)
        if len(glosses) < 80:
            errors.append(f"npc voice gloss corpus too thin: {len(glosses)}")
        riddle_needles = (
            "還沒有名字的東西",
            "把影子留在原地",
            "數到三再眨眼",
            "體內有一枚尚未被公開的標籤",
            "借這扇門出門",
            "把運氣從左邊口袋換到右邊",
            "選擇比較像門的那道光",
            "水平線像一句沒寫完",
            "命運的風鈴",
            "暗影在呼吸中交織",
        )
        for gloss in glosses:
            for banned in riddle_needles:
                if banned in gloss:
                    errors.append(f"npc gloss uses riddle line: {banned}")
        quotes = re.findall(r'v\(\s*"((?:\\.|[^"\\])*)"', voices)
        for quote in quotes:
            for banned in riddle_needles:
                if banned in quote:
                    errors.append(f"npc quote uses engine-riddle line: {banned}")
    for needle in ("attachNpcSpeech", "resolveNpcSpeaker", "resolveSpeakerKind", "attitudeTowardPlayer", "speakNpc"):
        if needle not in voice_engine:
            errors.append(f"npc-voice missing {needle}")
    for path, label in (
        (ROOT / "world-event-engine.js", "world-event-engine"),
        (ROOT / "adult-engine.js", "adult-engine"),
        (ROOT / "school-engine.js", "school-engine"),
        (ROOT / "history-engine.js", "history-engine"),
        (ROOT / "daily-engine.js", "daily-engine"),
    ):
        if "attachNpcSpeech" not in read(path):
            errors.append(f"{label} missing attachNpcSpeech")
    gen = read(ROOT / "eventGenerator.js")
    if "renderWorldEvent(worldIncident, ctx, rng)" not in gen:
        errors.append("eventGenerator must pass ctx/rng into renderWorldEvent")
    if "renderFigureEncounter(figureIncident, ctx, rng)" not in gen:
        errors.append("eventGenerator must pass ctx/rng into renderFigureEncounter")
    if "renderAdultIncident(adultIncident, ctx, rng)" not in gen:
        errors.append("eventGenerator must pass ctx/rng into renderAdultIncident")
    if "renderSchoolIncident(schoolIncident, ctx, rng)" not in gen:
        errors.append("eventGenerator must pass ctx/rng into renderSchoolIncident")
    if "renderDailyNarrative(dailyTexture, useLock ? null : ctx, rng)" not in gen and "renderDailyNarrative(dailyTexture, factLocked ? null : ctx, rng)" not in gen:
        errors.append("eventGenerator must pass daily speech ctx only when the week is not fact-locked")
    if "culturalNameMatching: true" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing culturalNameMatching")
    if "indigenousNaming: true" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing indigenousNaming")
    if "historicalGeography: true" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing historicalGeography")
    if "indigenousNaming: true" not in genesis:
        errors.append("genesis missing indigenousNaming flag")
    if "historicalGeography: true" not in genesis:
        errors.append("genesis missing historicalGeography flag")
    if "historicalDemographics: true" not in genesis:
        errors.append("genesis missing historicalDemographics flag")
    if "lifeLockUntilSettlement: true" not in genesis:
        errors.append("genesis missing permanent lifeLockUntilSettlement")
    if "pickSettlementByDemographics" not in genesis:
        errors.append("genesis must sample settlements by historical demographics")
    if "birthplaceLabel" not in genesis:
        errors.append("genesis must stamp birthplaceLabel")
    if "formatBirthplace" not in genesis:
        errors.append("genesis must format 國家，城市 birthplace")
    if "historicalDemographics: true" not in read(ROOT / "GameEngine.js"):
        errors.append("GameEngine sandbox missing historicalDemographics")
    if "birthplaceLabel" not in read(ROOT / "ui.js"):
        errors.append("ui must show documented birthplace")
    demo_engine = read(ROOT / "demographics-engine.js")
    for needle in ("formatBirthplace", "pickSettlementByDemographics", "ethnicityDemographicWeight", "canonicalizeCountry"):
        if needle not in demo_engine:
            errors.append(f"demographics-engine missing {needle}")
    hist_demo = read(DATA / "historical-demographics.js")
    for needle in ("REGION_POP_MILLIONS", "COUNTRY_POP_MILLIONS", "KIND_POP_MULT", "WORLD_URBAN_SHARE"):
        if needle not in hist_demo:
            errors.append(f"historical-demographics missing {needle}")
    if "中華民國" not in schema:
        errors.append("China default polity bands must include 中華民國")
    if "poltava_village" not in read(DATA / "settlements" / "inner-asia.js"):
        errors.append("missing documented Ukrainian village settlement")
    if "dingxian" not in read(DATA / "settlements" / "east-asia.js"):
        errors.append("missing documented North China village settlement")
    if "south_sentinel" not in read(ROOT / "settlements.js"):
        errors.append("forbidden settlement list must include south_sentinel alias")
    if "getSettlementCountry(settlement, birthYear)" not in genesis:
        errors.append("genesis must stamp year-local country at birth")
    if "localizeSettlement(" not in genesis:
        errors.append("genesis must localize settlement by birth year")
    if "export function scrubPublicText" not in read(DATA / "public-text.js"):
        errors.append("public-text missing scrubPublicText")
    if "sanitizePublicLine(option.text)" not in read(ROOT / "ui.js"):
        errors.append("ui must sanitize choice text before painting")
    for leak in ("抽到校園", "主動加害皆可選", "禁止美化。禁止性傷害", "開局標籤數"):
        if leak in genesis:
            errors.append(f"describeGenesis still leaks designer copy: {leak}")
    if "PROSE_VOICE_NOTE" in gen:
        errors.append("eventGenerator must not concatenate PROSE_VOICE_NOTE into player copy")
    if "本週三選一是對同一件" in gen:
        errors.append("eventGenerator still leaks locked-triad designer notes")
    if "【生存檢定" in read(ROOT / "mortality-engine.js"):
        errors.append("mortality-engine must not print survival-check invoices")
    for path, banned in (
        (ROOT / "school-engine.js", "【校園事件／客觀事實】"),
        (ROOT / "adult-engine.js", "【社會事件／客觀事實】"),
        (ROOT / "world-event-engine.js", "【全域事件／"),
        (ROOT / "history-engine.js", "【歷史人物／"),
        (ROOT / "school-engine.js", "校園標籤寫入"),
        (ROOT / "adult-engine.js", "社會標籤寫入"),
        (ROOT / "world-event-engine.js", "時空標籤寫入"),
        (ROOT / "history-engine.js", "歷史人物標籤寫入"),
        (ROOT / "trauma-engine.js", "創傷標籤寫入"),
    ):
        if banned in read(path):
            errors.append(f"{path.name} still concatenates meta copy: {banned}")
    daily_engine = read(ROOT / "daily-engine.js")
    if "followUps: [slice.logic]" in daily_engine or "followUps: [extra.logic]" in daily_engine:
        errors.append("daily-engine must not dump writer logic into player followUps")
    player_leak_needles = (
        "這一週的客觀事實",
        "生存檢定",
        "心境不代寫",
        "對 canon",
        "標籤寫入",
        "主角光環",
        "系統不替你",
        "遊戲不幫你選詞",
        "通緝係數",
        "抽到校園",
        "主動加害皆可選",
        "開局標籤數",
        "未成年人的性描寫",
        "系統不提供越獄",
        "沒有主角光環",
        "三選一 · 立場由你決定",
    )
    leak_targets = [
        ROOT.parent / "index.html",
        ROOT / "ui.js",
        ROOT / "eventGenerator.js",
        ROOT / "GameEngine.js",
        ROOT / "genesis.js",
        ROOT / "hint-engine.js",
        ROOT / "daily-engine.js",
        DATA / "sandbox-actions.js",
        DATA / "mortality-causes.js",
        DATA / "world-event-tags.js",
    ]
    for folder in (
        DATA / "world-events",
        DATA / "school-incidents",
        DATA / "adult-incidents",
        DATA / "figure-encounters",
        DATA / "daily",
    ):
        leak_targets.extend(sorted(folder.glob("*.js")))
    leak_targets.append(DATA / "tag-choice-actions.js")
    leak_targets.append(DATA / "bloodline-choice-actions.js")
    leak_targets.append(DATA / "tag-link-actions.js")
    leak_targets.append(DATA / "asymmetric-survival-actions.js")
    leak_targets.append(ROOT / "tag-link-engine.js")
    leak_targets.append(ROOT / "tag-influence.js")
    leak_targets.append(DATA / "tag-influence-rules.js")
    leak_targets.append(ROOT / "choice-pool.js")
    leak_targets.append(ROOT / "chronicle-voice.js")
    leak_targets.append(DATA / "chronicle-lexicon.js")
    leak_targets.append(DATA / "opening-lexicon.js")
    leak_targets.append(ROOT / "opening-chronicle.js")
    leak_targets.append(ROOT / "session-repeat.js")
    leak_targets.append(ROOT / "event-memory.js")
    leak_targets.append(ROOT / "life-resolution.js")
    leak_targets.append(ROOT / "text-history.js")
    leak_targets.append(ROOT / "narrative-variator.js")
    leak_targets.append(DATA / "variator-lexicon.js")
    for path in leak_targets:
        if not path.exists():
            continue
        blob = read(path)
        if path.parent.name == "daily":
            blob = re.sub(r"^\s*logic:.*$", "", blob, flags=re.M)
        for needle in player_leak_needles:
            if needle in blob:
                errors.append(f"player-facing copy still leaks {needle!r} in {path.name}")
    if "getSettlementCountry" not in read(ROOT / "naming-engine.js"):
        errors.append("naming-engine must use year-local country")
    if "getSettlementCountry" not in read(ROOT / "world-event-engine.js"):
        errors.append("world-event-engine must use year-local country")
    if "getSettlementCountry" not in read(ROOT / "mortality-engine.js"):
        errors.append("mortality-engine must use year-local country")
    if "pickWeeklyTriad" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must use pickWeeklyTriad for unique tag-driven choices")
    if "ignoreTags" in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must not bypass tag matching with ignoreTags")
    tag_choices = read(DATA / "tag-choice-actions.js")
    if "TAG_DRIVEN_ACTION_POOL" not in tag_choices:
        errors.append("tag-choice-actions missing TAG_DRIVEN_ACTION_POOL")
    if "tagPrefixesAny" not in tag_choices or "tagsNone:" not in tag_choices:
        errors.append("first-batch tag choices must include prefix unlocks and tagsNone locks")
    if "from \"./choice-pool.js\"" not in read(ROOT / "daily-engine.js"):
        errors.append("daily-engine must use ctxHasTag alias matching")
    if "BLOODLINE_CHOICE_POOL" not in read(DATA / "bloodline-choice-actions.js"):
        errors.append("bloodline-choice-actions missing BLOODLINE_CHOICE_POOL")
    if "organicContexts" not in read(DATA / "bloodline-choice-actions.js"):
        errors.append("bloodline choices must gate on organicContexts")
    if "attachOrganicContext" not in read(ROOT / "eventGenerator.js"):
        errors.append("eventGenerator must attach organic gene/ethnicity context")
    if "autosomal_dominant" not in read(ROOT / "genesis.js"):
        errors.append("genesis must support autosomal dominant inheritance")
    if "buildConstitution" not in read(ROOT / "genesis.js"):
        errors.append("genesis must snapshot constitution from bloodline")
    if "shouldFire" not in read(ROOT / "choice-pool.js"):
        errors.append("choice-pool must organically inject bloodline options")
    for note_file, needle in (
        (DATA / "adult-writing-rules.js", "ADULT_PROSE_NOTE"),
        (DATA / "world-event-rules.js", "WORLD_PROSE_NOTE"),
        (DATA / "school-dark-rules.js", "SCHOOL_PROSE_NOTE"),
        (DATA / "figure-rules.js", "FIGURE_PROSE_NOTE"),
        (DATA / "trauma-writing-rules.js", "TRAUMA_PROSE_NOTE"),
    ):
        blob = read(note_file)
        if needle not in blob or "主體敘述直白清晰" not in blob:
            errors.append(f"{note_file.name} must restate the two-layer voice rule")

    if "namesFromKey(names) || namesFromKey(\"english\")" in read(DATA / "ethnicity-factory.js"):
        errors.append("ethnicity factory must not silently fall back to english names")

    pack_keys = set(re.findall(r"^\s+([a-z][a-z0-9_]*):\s*n\(", read(DATA / "name-packs.js"), re.M))
    pack_keys.update(re.findall(r"^\s+([a-z][a-z0-9_]*):\s*n\(", read(DATA / "minority-name-packs.js"), re.M))
    eth_names_re = re.compile(
        r'eth\(\s*"([a-z0-9_]+)"\s*,\s*"(?:\\.|[^"\\])*"\s*,\s*"(?:\\.|[^"\\])*"\s*,\s*"[^"]*"'
        r'\s*,\s*\[[^\]]*\]\s*,\s*\[[^\]]*\]\s*,\s*"(?:\\.|[^"\\])*"\s*,\s*"([a-z0-9_]+)"'
    )
    missing_packs = []
    for path in (DATA / "ethnicities").glob("*.js"):
        for eth_id, names_key in eth_names_re.findall(read(path)):
            if names_key not in pack_keys:
                missing_packs.append(f"{eth_id}:{names_key}")
    for eth_id, names_key in eth_names_re.findall(read(DATA / "ethnicities-database.js")):
        if names_key not in pack_keys:
            missing_packs.append(f"{eth_id}:{names_key}")
    if missing_packs:
        errors.append("ethnicity namesKey missing pack: " + ", ".join(sorted(set(missing_packs))[:40]))

    print({
        "ethnicities": len(eth_ids),
        "traits": len(traits),
        "settlements": len(settle_ids),
        "coords": len(coords),
        "ok": not errors,
        "errors": errors,
    })
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
