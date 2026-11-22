// toyota-card-localized.js - a Home Assistant dashboard card for a Toyota, using the
// Toyota Connected Services integration (pytoyoda/ha_toyota or widewing/ha-toyota-na, installed from HACS).
// Shows: last update, parked distance from home, photo, doors/boot(trunk)/bonnet(hood)/windows/warnings,
// range + odometer, a fuel gauge, mpg / electric / hybrid scores, last/next service, and a
// top-down car with each door and window state (or tire pressures + windows on North American vehicles without door sensors).
// Choose metric or imperial display units.
// Usage:  type: custom:toyota-card-localized
//         prefix: <your car's entity prefix or model suffix>   (optional - the first Toyota found is used)
//         units: metric | imperial   (optional; defaults to imperial for backwards compatibility)
//         image: <URL or local path to a car photo>   (optional; falls back to integration entity_picture)

const VERSION = "1.3.0";
const KM_MI = 0.621371, L100_MPG = 282.481;
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = v => (v === undefined || v === null || v === "" || isNaN(+v)) ? null : +v;
const formatNumber = (value, locale, dp = 0) => value === null ? "–" : value.toLocaleString(locale, { maximumFractionDigits: dp, minimumFractionDigits: dp });
// Each entry contains English, Russian and German.
const MESSAGES = {
  "driving": ["driving", "в движении", "unterwegs"],
  "parked": ["parked", "на парковке", "geparkt"],
  "home": ["home", "дома", "zu Hause"],
  "doors": ["doors", "двери", "Türen"],
  "locked": ["locked", "заперты", "verriegelt"],
  "unlocked": ["unlocked", "отперты", "entriegelt"],
  "trunk": ["trunk", "багажник", "Kofferraum"],
  "boot": ["boot", "багажник", "Kofferraum"],
  "hood": ["hood", "капот", "Motorhaube"],
  "bonnet": ["bonnet", "капот", "Motorhaube"],
  "windows": ["windows", "окна", "Fenster"],
  "moonroof": ["moonroof", "люк", "Schiebedach"],
  "warnings": ["warnings", "предупреждения", "Warnmeldungen"],
  "none": ["none", "нет", "keine"],
  "warning active": ["active", "есть", "aktiv"],
  "closed": ["closed", "закрыто", "geschlossen"],
  "open": ["open", "открыто", "offen"],
  "on": ["on", "вкл.", "ein"],
  "off": ["off", "выкл.", "aus"],
  "hybrid battery": ["hybrid battery", "тяговая батарея", "Antriebsbatterie"],
  "electric range": ["electric range", "запас хода на электротяге", "elektrische Reichweite"],
  "with A/C": ["with A/C", "с кондиционером", "mit Klimaanlage"],
  "Charging": ["Charging", "Зарядка", "Laden"],
  "charging": ["charging", "заряжается", "wird geladen"],
  "not charging": ["not charging", "не заряжается", "lädt nicht"],
  "complete": ["complete", "завершена", "abgeschlossen"],
  "plugged in": ["plugged in", "кабель подключён", "Kabel angeschlossen"],
  "unplugged": ["unplugged", "кабель отключён", "Kabel getrennt"],
  "scheduled": ["scheduled", "запланирована", "geplant"],
  "remaining": ["{value} remaining", "осталось: {value}", "noch {value}"],
  "battery percent": ["Battery: {value}", "Тяговая батарея: {value}", "Antriebsbatterie: {value}"],
  "current speed": ["current speed", "текущая скорость", "aktuelle Geschwindigkeit"],
  "remote start": ["remote start", "дистанционный запуск", "Fernstart"],
  "tires updated": ["tires updated", "давление обновлено", "Reifendruck aktualisiert"],
  "trip A": ["trip A", "поездка A", "Fahrt A"],
  "trip B": ["trip B", "поездка B", "Fahrt B"],
  "average speed this week": ["average speed this week", "средняя скорость за неделю", "Ø Geschwindigkeit diese Woche"],
  "recent trips": ["recent trips", "последние поездки", "letzte Fahrten"],
  "climate": ["climate", "климат", "Klimaanlage"],
  "cabin temperature": ["cabin temperature", "температура салона", "Innenraumtemperatur"],
  "seat heating": ["seat heating", "подогрев сидений", "Sitzheizung"],
  "steering wheel heater": ["steering wheel heater", "подогрев руля", "Lenkradheizung"],
  "hazard lights": ["hazard lights", "аварийная сигнализация", "Warnblinker"],
  "trip history": ["trip history", "история поездок", "Fahrtenverlauf"],
  "available": ["available", "доступна", "verfügbar"],
  "No trips yet": ["No trips yet", "Поездок пока нет", "Noch keine Fahrten"],
  "driver": ["driver", "водитель", "Fahrerseite"],
  "passenger": ["passenger", "пассажир", "Beifahrerseite"],
  "rear left": ["rear left", "сзади слева", "hinten links"],
  "rear right": ["rear right", "сзади справа", "hinten rechts"],
  "window": ["window", "окно", "Fenster"],
  "average consumption": ["average consumption ({value})", "средний расход ({value})", "Ø Verbrauch ({value})"],
  "electric driving": ["electric driving", "доля езды на электротяге", "elektrischer Fahranteil"],
  "hybrid score": ["hybrid score", "оценка гибридного режима", "Hybridbewertung"],
  "last trip score": ["last trip score", "оценка последней поездки", "Bewertung der letzten Fahrt"],
  "next service": ["next service", "следующее ТО", "nächster Service"],
  "last service": ["last service", "последнее ТО", "letzter Service"],
  "service in": ["in {value}", "через {value}", "in {value}"],
  "service ago": ["{value} ago", "{value} назад", "vor {value}"],
  "Ask the car for an update": ["Ask the car for an update", "Запросить данные у автомобиля", "Fahrzeugdaten aktualisieren"],
  "Open in Google Maps": ["Open in Google Maps", "Открыть в Google Maps", "In Google Maps öffnen"],
  "estimated range": ["estimated range", "запас хода", "geschätzte Reichweite"],
  "odometer": ["odometer", "пробег", "Kilometerstand"],
  "information": ["information", "информация", "Informationen"],
  "No Toyota car found": ["No Toyota car found", "Автомобиль Toyota не найден", "Kein Toyota-Fahrzeug gefunden"],
  "km": ["km", "км", "km"],
  "mi": ["mi", "мили", "mi"],
  "km/h": ["km/h", "км/ч", "km/h"],
  "mph": ["mph", "миль/ч", "mph"],
  "L/100 km": ["L/100 km", "л/100 км", "l/100 km"],
  "UK mpg": ["UK mpg", "брит. mpg", "UK mpg"],
};
const LANGUAGES = ["en", "ru", "de"];
const resolveLocale = hass => {
  for (const language of [hass.locale?.language, hass.language]) {
    if (!language) continue;
    try {
      return Intl.getCanonicalLocales(language.replaceAll("_", "-"))[0] || "en";
    } catch {
      // Try the next Home Assistant language setting.
    }
  }
  return "en";
};
const translator = locale => {
  const index = Math.max(0, LANGUAGES.indexOf(locale.split("-")[0]));
  return (key, value) => MESSAGES[key][index].replace("{value}", () => value ?? "");
};
const CHARGING_STATES = {
  on: "charging", off: "not charging", charging: "charging",
  not_charging: "not charging", charge_complete: "complete", completed: "complete",
  complete: "complete", plugged_in: "plugged in", unplugged: "unplugged",
  scheduled: "scheduled", not_connected: "unplugged",
};

const since = (iso, locale) => {
  const n = num(iso), t = n !== null && n > 1e9 ? n * (n < 1e11 ? 1000 : 1) : Date.parse(iso);
  if (isNaN(t)) return "–";
  const minutes = Math.max(0, Math.round((Date.now() - t) / 60000));
  const relativeTime = new Intl.RelativeTimeFormat(locale, { style: "short" });
  if (minutes < 60) return relativeTime.format(-minutes, "minute");
  if (minutes < 2880) return relativeTime.format(-Math.round(minutes / 60), "hour");
  return relativeTime.format(-Math.round(minutes / 1440), "day");
};
const dist = (a, b, c, d) => {        // metres between two lat/lon points
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(x));
};

const CSS = `
:host { --fg:#ffffff; --muted:#b8b8b8; --red:#e0533d; --amber:#f4a72c; --green:#5aa54b; display:block; height:100%; }
ha-card { background:var(--car-card-bg,#000); border:1px solid #ffffff1a; border-radius:16px; box-shadow:none; padding:12px 16px 16px; color:var(--fg);
  font-family:Roboto,system-ui,-apple-system,sans-serif; container-type:inline-size;
  box-sizing:border-box; display:block; overflow-wrap:anywhere; }
.top { display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--muted); }
.top .upd { display:flex; align-items:center; gap:8px; cursor:pointer; } .top .upd i { width:6px; height:6px; border-radius:50%; background:#666; }
.top .upd.busy i { background:var(--amber); animation:blink 1s infinite; } @keyframes blink { 50% { opacity:.2; } }
.top .park { text-transform:uppercase; letter-spacing:.06em; cursor:pointer; } .top .park.drive { color:var(--green); }
.hero { position:relative; display:flex; justify-content:center; align-items:center; margin:2px 0 6px; flex:1 1 0; min-height:140px; }
.hero::before { content:""; position:absolute; left:50%; top:58%; width:78%; height:70%; transform:translate(-50%,-50%);
  background:radial-gradient(ellipse at center, #ffffff2e 0%, #ffffff0d 45%, transparent 70%); }
.hero img { position:relative; max-width:100%; max-height:210px; width:auto; height:auto; object-fit:contain; filter:drop-shadow(0 10px 14px #000a) brightness(1.1); }
.hero ha-icon { --mdc-icon-size:100px; color:#ffffff40; margin:24px 0; }
.mid { display:grid; grid-template-columns:auto auto 1fr; gap:18px; align-items:center; }
.list { font-size:14px; line-height:1.55; } .list b { font-weight:500; } .list .bad { color:var(--red); } .list .warn { color:var(--amber); }
.kv span { display:block; font-size:14px; color:#e8e8e8; } .kv b { display:block; font-size:24px; font-weight:400; margin-bottom:8px; }
.gauge { justify-self:end; width:min(170px,100%); }
.gauge svg { width:100%; height:auto; display:block; }
.ev { display:grid; grid-template-columns:54px minmax(90px,1fr) auto; gap:12px; align-items:center; border:1px solid #ffffff22; border-radius:12px; padding:12px 16px; margin-top:14px; background:#ffffff08; }
.battery-icon { width:48px; height:26px; border:2px solid #d8e1e8; border-radius:5px; padding:3px; position:relative; box-sizing:border-box; }
.battery-icon::after { content:""; position:absolute; width:4px; height:10px; right:-6px; top:6px; border-radius:0 2px 2px 0; background:#d8e1e8; }
.battery-fill { height:100%; border-radius:2px; background:var(--green); transition:width .3s ease; }
.battery-fill.low { background:var(--red); } .battery-fill.medium { background:var(--amber); }
.ev-main span, .ev-range span { display:block; color:#e8e8e8; font-size:13px; }
.ev-main b { font-size:23px; font-weight:500; } .ev-range { text-align:right; } .ev-range b { font-size:18px; font-weight:400; }
.ev-status { grid-column:2 / -1; color:var(--muted); font-size:13px; margin-top:-8px; }
.hr { position:relative; text-align:center; margin:18px 0 14px; } .hr::before { content:""; position:absolute; left:0; right:0; top:50%; border-top:1px solid #ffffff55; }
.hr span { position:relative; background:#0b1a2e; border-radius:6px; padding:2px 16px; font-size:16px; color:#e8e8e8; }
.info { display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:10px; align-items:center; }
.cells { display:grid; grid-template-columns:1fr 1fr; gap:14px 12px; }
.cells span { display:block; font-size:14px; color:#e8e8e8; } .cells b { display:block; font-size:22px; font-weight:400; }
.box { grid-column:1 / -1; border:1px solid #ffffff99; border-radius:12px; padding:4px 10px 12px; margin:8px 6px 0; text-align:center; min-width:0; }
.box legend { margin:0 auto; padding:0 8px; font-size:14px; color:#e8e8e8; }
.box b { display:block; font-size:20px; font-weight:400; line-height:1.4; }
.topdown { display:grid; grid-template-columns:auto 1fr auto; grid-template-rows:1fr 1fr; align-items:center; gap:4px; }
.topdown svg { grid-row:1 / 3; grid-column:2; width:100%; max-width:110px; height:auto; justify-self:center; }
.corner { text-align:center; } .corner b { display:block; font-size:20px; font-weight:400; } .corner span { display:block; font-size:12px; color:var(--muted); text-transform:uppercase; }
.corner small { display:block; font-size:11px; color:var(--muted); margin-top:2px; line-height:1.2; } .corner.bad b, .corner small.bad { color:var(--red); } .corner small.bad { font-weight:500; }
/* Use the card width so this also works inside sidebar and section views. */
@container (min-width:760px) {
  .body { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:20px; align-items:start; }
  .summary, .details { min-width:0; }
  .hero { min-height:100px; }
  .hero img { max-height:140px; }
  .mid { gap:8px; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr) minmax(0,.8fr); }
  .hr { margin:8px 0 12px; }
  .info { align-items:start; }
  .topdown svg { max-width:82px; }
  .corner b { font-size:15px; }
  .cells b { font-size:18px; }
}
@container (max-width:520px) {
  .mid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .gauge { grid-column:1 / -1; justify-self:center; }
  .info { grid-template-columns:1fr; }
  .topdown svg { max-width:90px; }
  .top { gap:8px; }
  .ev { grid-template-columns:54px minmax(0,1fr); }
  .ev-range, .ev-status { grid-column:2; text-align:left; margin-top:0; }
}
.top { margin-bottom:8px; }
.info.no-cells { grid-template-columns:minmax(0,1fr); }
.cells { grid-template-columns:repeat(2,minmax(0,1fr)); }
.topdown { grid-template-columns:minmax(0,1fr) minmax(36px,1.25fr) minmax(0,1fr); }

`;

class ToyotaLocalizedCard extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._sig = null;
    if (this._hass) this.hass = this._hass;
  }
  getCardSize() { return 9; }
  set hass(h) {
    this._hass = h;
    if (!this._config) return;
    let p = this._config.prefix, na = false;
    if (!p) {
      const k = Object.keys(h.states).find(e => {
        const match = /^sensor\.(.+)_(?:fuel_range|battery_range|total_range)$/.exec(e);
        return match && h.states[`sensor.${match[1]}_odometer`];
      });
      if (k) p = k.replace(/^sensor\.|_(?:fuel_range|battery_range|total_range)$/g, "");
      else {
        const nk = Object.keys(h.states).find(e => /^sensor\.odometer_.+$/.test(e) && (h.states[e.replace("sensor.odometer_", "sensor.fuel_level_")] || h.states[e.replace("sensor.odometer_", "sensor.distance_to_empty_")] || h.states[e.replace("sensor.odometer_", "sensor.ev_battery_level_")]));
        if (nk) { p = nk.slice(16); na = true; }
      }
    } else if (!h.states[`sensor.${p}_odometer`] && !h.states[`sensor.${p}_fuel_range`] && (h.states[`sensor.odometer_${p}`] || h.states[`sensor.fuel_level_${p}`] || h.states[`sensor.distance_to_empty_${p}`])) {
      na = true;
    }
    this._p = p; this._na = na;
    // only redraw when something shown changes (plus once a minute for the "x hours" clock)
    const sig = p ? Object.keys(h.states).filter(e => e.includes(p)).map(e => e + h.states[e].last_updated).join() + Math.floor(Date.now() / 60000) : "none";
    const home = h.states["zone.home"];
    const renderSignature = JSON.stringify([p, na, sig, home?.last_updated, resolveLocale(h)]);
    if (renderSignature === this._sig) return;
    this._sig = renderSignature;
    this._render();
  }
  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const r = this.shadowRoot, h = this._hass, p = this._p, na = this._na;
    const units = this._config.units === "metric" ? "metric" : "imperial";
    const locale = resolveLocale(h), t = translator(locale);
    const percent = value => value.toLocaleString(locale, { style: "percent", maximumFractionDigits: 0 });
    const distance = (val, dp = 0, srcUnit = "km") => {
      if (val === null) return "–";
      const u = String(srcUnit || "km").toLowerCase();
      const km = u === "mi" || u === "miles" || u === "mph" ? val / KM_MI : val;
      return formatNumber(units === "metric" ? km : km * KM_MI, locale, dp);
    };
    const entDist = (ent, dp = 0) => distance(num(ent?.state), dp, ent?.attributes?.unit_of_measurement);
    const distanceUnit = t(units === "metric" ? "km" : "mi");
    if (!p) { r.innerHTML = `<style>${CSS}</style><ha-card>${t("No Toyota car found")} (pytoyoda/ha_toyota / widewing/ha-toyota-na).</ha-card>`; return; }
    const S = s => h.states[na ? `sensor.${s}_${p}` : `sensor.${p}_${s}`], B = s => h.states[na ? `binary_sensor.${s}_${p}` : `binary_sensor.${p}_${s}`]?.state, BE = s => h.states[na ? `binary_sensor.${s}_${p}` : `binary_sensor.${p}_${s}`];

    const fuel = num(S("fuel_level")?.state), rangeEnt = S(na ? "distance_to_empty" : "fuel_range"), range = num(rangeEnt?.state), odoEnt = S("odometer"), odo = num(odoEnt?.state);
    const battery = num(S(na ? "ev_battery_level" : "battery_level")?.state), batteryRangeEnt = S(na ? "ev_range" : "battery_range"), batteryRangeAC = na ? S("ev_range_ac") : S("battery_range_ac") || S("battery_range_with_ac");
    const charging = na ? B("charging_status") : S("charging_status")?.state, chargeTime = (S("remaining_charge_time") || (!na && S("remaining_charging_time")))?.state;
    // binary sensors: door/window/hood/trunk on = open, lock on = unlocked
    const doors = na
      ? { front_driver: "driver", front_passenger: "passenger", rear_driver: "rear left", rear_passenger: "rear right" }
      : { driverseat: "driver", passengerseat: "passenger", leftrearseat: "rear left", rightrearseat: "rear right" };
    const lockKeys = [...Object.keys(doors), "trunk"];
    const lockSuffix = na ? "_door_lock" : "_lock";
    const lockEnt = h.states[na ? `lock.${p}` : `lock.${p}_door_lock`] || h.states[`lock.door_lock_${p}`];
    const hasLocks = !na || lockKeys.some(k => BE(`${k}${lockSuffix}`)) || !!lockEnt;
    const unlocked = lockKeys.some(k => B(`${k}${lockSuffix}`) === "on") || lockEnt?.state === "unlocked";
    const hasTrunk = !na || !!BE("trunk"), hasHood = !na || !!BE("hood");
    const sideWinKeys = Object.keys(doors);
    const winEnt = k => BE(`${k}_window`);
    const hasKnownState = ent => !!ent && !["unknown", "unavailable"].includes(ent.state);
    const hasWins = sideWinKeys.some(k => hasKnownState(winEnt(k)));
    const winsOpen = sideWinKeys.some(k => winEnt(k)?.state === "on");
    const hasMoonroof = na && !!BE("moonroof"), moonroofOpen = B("moonroof") === "on";
    const driving = na ? (num(S("speed")?.state) || 0) > 0 : B("driving") === "on";
    const tr = na ? (h.states[`device_tracker.last_parked_location_${p}`] || h.states[`device_tracker.current_location_${p}`]) : h.states[`device_tracker.${p}_parking_location`];
    const z = h.states["zone.home"]?.attributes, la = tr?.attributes?.latitude, lo = tr?.attributes?.longitude;
    const away = z && la ? dist(z.latitude, z.longitude, la, lo) : null;
    const awayKm = away === null ? null : away / 1000;
    const where = driving ? t("driving") : away === null ? t("parked") : `${t("parked")} · ${away < 200 ? t("home") : `${distance(awayKm, 1)} ${distanceUnit}`}`;
    const year = S("current_year_stats") || S("current_year_statistics");
    const yr = year?.attributes || {}, yrKm = num(year?.state);
    const averageConsumption = num(yr.Average_fuel_consumed);
    const consumption = averageConsumption === null ? null : units === "metric" ? averageConsumption : Math.round(L100_MPG / averageConsumption);
    const consumptionUnit = t(units === "metric" ? "L/100 km" : "UK mpg");
    const evPct = yrKm && num(yr.EV_distance) !== null ? Math.round(100 * yr.EV_distance / yrKm) : null;
    const trip = (S("recent_trips")?.attributes?.trips || [])[0];
    const tripCount = num(S("recent_trips")?.state), avgSpeed = num(S("average_speed_week")?.state);
    const climate = h.states[`climate.${p}_climate`], climateAttrs = climate?.attributes || {};
    const climateOn = climate && !["off", "unavailable", "unknown"].includes(climate.state);
    const hazardsOn = h.states[`switch.${p}_hazard_lights`]?.state === "on";
    const svc = S("last_service"), svcOdo = num(svc?.attributes?.odometer), nextSvcEnt = S("next_service"), nextSvc = num(nextSvcEnt?.state);
    // ha_toyota reports the service odometer in the integration's own unit (km or mi), the same unit as the odometer
    // sensor, unless the odometer's display unit was changed in HA (then the service odometer stays in km).
    const odoUnit = String(odoEnt?.attributes?.unit_of_measurement || "km").toLowerCase();
    const odoMi = odoUnit === "mi" || odoUnit === "miles";
    let svcAt = svcOdo;
    if (svcAt !== null && odo !== null && odoMi && svcAt > odo && svcAt * KM_MI <= odo) svcAt *= KM_MI;
    const svcGap = svcAt !== null && odo !== null && odo >= svcAt ? odo - svcAt : null;
    const hasWarn = !na || !!S("warning_lights") || !!BE("vehicle_health");
    const warn = (num(S("warning_lights")?.state) || 0) > 0 || B("vehicle_health") === "on";
    const pic = this._config.image || tr?.attributes?.entity_picture;

    const st = (label, open, word = ["closed", "open"], cls = "bad", known = true) => !known ? "" : `${t(label)}: <b class="${open ? cls : ""}">${t(open ? word[1] : word[0])}</b><br>`;

    // fuel gauge: red / amber / green bands, white needle, big %
    const f = Math.max(0, Math.min(100, fuel ?? 0)), arc = (a0, a1, c) => {
      const P = a => [100 + 78 * Math.cos(Math.PI * (1 - a)), 100 - 78 * Math.sin(Math.PI * (1 - a))];
      const [x0, y0] = P(a0), [x1, y1] = P(a1);
      return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A78 78 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" fill="none" stroke="${c}" stroke-width="30"/>`; };
    const naAngle = Math.PI * (1 - f / 100), nx = 100 + 92 * Math.cos(naAngle), ny = 100 - 92 * Math.sin(naAngle), nx0 = 100 + 58 * Math.cos(naAngle), ny0 = 100 - 58 * Math.sin(naAngle);
    const gauge = `<svg viewBox="0 0 200 112">${arc(0, .3, "var(--red)")}${arc(.3, .62, "var(--amber)")}${arc(.62, 1, "var(--green)")}
      <line x1="${nx0.toFixed(1)}" y1="${ny0.toFixed(1)}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <text x="100" y="108" text-anchor="middle" fill="#fff" font-size="44" font-weight="500">${fuel === null ? "–" : percent(fuel / 100)}</text></svg>`;
    const batt = Math.max(0, Math.min(100, battery ?? 0));
    const battClass = batt <= 20 ? "low" : batt <= 50 ? "medium" : "";
    const remaining = num(chargeTime);
    const chargeDuration = remaining === null ? esc(chargeTime) :
      new Intl.NumberFormat(locale, { style: "unit", unit: "minute" }).format(remaining);
    const chargingKey = charging?.trim().toLowerCase().replace(/[ -]+/g, "_");
    const chargingLabel = Object.hasOwn(CHARGING_STATES, chargingKey)
      ? t(CHARGING_STATES[chargingKey])
      : charging && !["unknown", "unavailable"].includes(chargingKey) ? esc(charging) : "–";
    const batteryCard = battery === null ? "" : `<div class="ev"><div class="battery-icon" role="img" aria-label="${t("battery percent", percent(battery / 100))}"><div class="battery-fill ${battClass}" style="width:${batt}%"></div></div>
      <div class="ev-main"><span>${t("hybrid battery")}</span><b>${percent(battery / 100)}</b></div>
      <div class="ev-range"><span>${t("electric range")}</span><b>${entDist(batteryRangeEnt)} ${distanceUnit}</b><span>${t("with A/C")}: ${entDist(batteryRangeAC)} ${distanceUnit}</span></div>
      <div class="ev-status">${t("Charging")}: ${chargingLabel}${chargeTime && !["unknown", "unavailable"].includes(chargeTime) ? ` · ${t("remaining", chargeDuration)}` : ""}</div></div>`;
    const extraInfo = this._config.show_extra_info === true ? (na ? `
          ${num(S("speed")?.state) !== null ? `<div><span>${t("current speed")}</span><b>${entDist(S("speed"))} ${t(units === "metric" ? "km/h" : "mph")}</b></div>` : ""}
          ${BE("remote_start") ? `<div><span>${t("remote start")}</span><b>${B("remote_start") === "on" ? t("on") : t("off")}</b></div>` : ""}
          ${S("last_tire_pressure_update_timestamp") ? `<div><span>${t("tires updated")}</span><b>${since(S("last_tire_pressure_update_timestamp").state, locale)}</b></div>` : ""}
          ${S("trip_details_a") ? `<div><span>${t("trip A")}</span><b>${entDist(S("trip_details_a"), 1)} ${distanceUnit}</b></div>` : ""}
          ${S("trip_details_b") ? `<div><span>${t("trip B")}</span><b>${entDist(S("trip_details_b"), 1)} ${distanceUnit}</b></div>` : ""}` : `
          <div><span>${t("average speed this week")}</span><b>${avgSpeed === null ? "–" : `${distance(avgSpeed)} ${t(units === "metric" ? "km/h" : "mph")}`}</b></div>
          <div><span>${t("recent trips")}</span><b>${tripCount === null ? "–" : tripCount}</b></div>
          <div><span>${t("climate")}</span><b>${climateOn ? t("on") : climate ? t("off") : "–"}${num(climateAttrs.temperature) === null ? "" : ` · ${num(climateAttrs.temperature)}°`}</b></div>
          <div><span>${t("cabin temperature")}</span><b>${num(S("cabin_temperature")?.state) === null ? "–" : `${num(S("cabin_temperature").state)}°`}</b></div>
          <div><span>${t("seat heating")}</span><b>${["seat_heater_driver", "seat_heater_passenger", "seat_heater_rear_driver", "seat_heater_rear_passenger"].some(k => climateAttrs[k] && climateAttrs[k] !== "off") ? t("on") : t("off")}</b></div>
          <div><span>${t("steering wheel heater")}</span><b>${climateAttrs.steering_heater ? t("on") : t("off")}</b></div>
          <div><span>${t("hazard lights")}</span><b>${hazardsOn ? t("on") : t("off")}</b></div>
          <div><span>${t("trip history")}</span><b>${trip ? esc(trip.label || trip.name || t("available")) : t("No trips yet")}</b></div>`) : "";

    // top-down car (front at the top); doors, windows, or tire pressures at the corners.
    // UK cars are right-hand drive (driver top right); NA cars are left-hand drive (driver top left).
    const corner = (k, lbl) => {
      const dEnt = BE(`${k}_door`), tEnt = na ? S(`${k}_tire`) : null, psi = num(tEnt?.state);
      const wEnt = winEnt(k), hasWin = hasKnownState(wEnt), wOpen = wEnt?.state === "on";
      const winLine = hasWin ? `<small class="${wOpen ? "bad" : ""}">${t("window")}: ${t(wOpen ? "open" : "closed")}</small>` : "";
      if (dEnt) { const o = dEnt.state === "on"; return `<div class="corner ${o ? "bad" : ""}"><b>${hasKnownState(dEnt) ? t(o ? "open" : "closed") : "–"}</b><span>${t(lbl)}</span>${winLine}</div>`; }
      if (psi !== null) return `<div class="corner ${psi < 28 ? "bad" : ""}"><b>${Math.round(psi)} ${esc(tEnt.attributes?.unit_of_measurement || "psi")}</b><span>${t(lbl)}</span>${winLine}</div>`;
      if (hasWin) return `<div class="corner ${wOpen ? "bad" : ""}"><b>${t(wOpen ? "open" : "closed")}</b><span>${t(lbl)}</span><small>${t("window")}</small></div>`;
      return `<div class="corner"><b>–</b><span>${t(lbl)}</span></div>`;
    };
    const doorCol = k => B(`${k}_door`) === "on" || winEnt(k)?.state === "on" ? "#e0533d" : "#2b2b2b";
    const [flKey, flLbl, frKey, frLbl, rlKey, rlLbl, rrKey, rrLbl] = na
      ? ["front_driver", "driver", "front_passenger", "passenger", "rear_driver", "rear left", "rear_passenger", "rear right"]
      : ["passengerseat", "passenger", "driverseat", "driver", "leftrearseat", "rear left", "rightrearseat", "rear right"];
    const car = `<svg viewBox="0 0 100 200">
      <defs><linearGradient id="yb" x1="0" x2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset=".5" stop-color="#3a3a3a"/><stop offset="1" stop-color="#1a1a1a"/></linearGradient></defs>
      <rect x="10" y="6" width="80" height="188" rx="30" fill="url(#yb)" stroke="#555" stroke-width="1"/>
      <path d="M22 18 Q50 8 78 18 L76 46 Q50 40 24 46 Z" fill="${B("hood") === "on" ? "#e0533d" : "#2a2a2a"}"/>
      <path d="M22 54 Q50 46 78 54 L72 82 Q50 77 28 82 Z" fill="#0d0d0d" stroke="#666" stroke-width=".6"/>
      <rect x="27" y="86" width="46" height="58" rx="8" fill="#151515"/>
      <text x="50" y="119" text-anchor="middle" fill="#fff" font-size="9">${!hasLocks ? "" : t(unlocked ? "unlocked" : "locked")}</text>
      <path d="M28 150 Q50 154 72 150 L74 168 Q50 172 26 168 Z" fill="#0d0d0d" stroke="#666" stroke-width=".6"/>
      <path d="M24 174 Q50 178 76 174 L74 188 Q50 194 26 188 Z" fill="${B("trunk") === "on" ? "#e0533d" : "#2a2a2a"}"/>
      <rect x="6" y="58" width="5" height="40" rx="2" fill="${doorCol(flKey)}"/><rect x="89" y="58" width="5" height="40" rx="2" fill="${doorCol(frKey)}"/>
      <rect x="6" y="102" width="5" height="40" rx="2" fill="${doorCol(rlKey)}"/><rect x="89" y="102" width="5" height="40" rx="2" fill="${doorCol(rrKey)}"/>
      <rect x="2" y="56" width="8" height="5" rx="2" fill="#333"/><rect x="90" y="56" width="8" height="5" rx="2" fill="#333"/></svg>`;

    const lastRep = S(na ? "last_update_timestamp" : "status_last_reported_by_car")?.state;
    const statsHtml = na ? "" : `
          <div><span>${t("average consumption", consumptionUnit)}</span><b>${consumption === null ? "–" : formatNumber(consumption, locale, units === "metric" ? 1 : 0)}</b></div><div><span>${t("electric driving")}</span><b>${evPct === null ? "–" : percent(evPct / 100)}</b></div>
          <div><span>${t("hybrid score")}</span><b>${yr.Hybrid_score ? Math.round(yr.Hybrid_score) : "–"}</b></div><div><span>${t("last trip score")}</span><b>${esc(trip?.scores?.global ?? "–")}</b></div>`;
    const svcBox = na
      ? (nextSvc !== null ? `<fieldset class="box"><legend>${t("next service")}</legend><b>${t("service in", `${entDist(nextSvcEnt)} ${distanceUnit}`)}</b></fieldset>` : "")
      : `<fieldset class="box"><legend>${t("last service")}</legend><b>${svc?.state && !["unknown", "unavailable"].includes(svc.state) ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(svc.state) ? svc.state + "T00:00:00" : svc.state).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "–"}</b>
            <b>${svcGap !== null ? t("service ago", `${distance(svcGap, 0, odoUnit)} ${distanceUnit}`) : ""}</b></fieldset>`;
    const cellsHtml = statsHtml || extraInfo || svcBox ? `<div class="cells">${statsHtml}${extraInfo}${svcBox}</div>` : "";

    r.innerHTML = `<style>${CSS}</style><ha-card>
      <div class="top"><span class="upd ${this._busy ? "busy" : ""}" title="${t("Ask the car for an update")}"><i></i>${since(lastRep, locale)}</span>
        <span class="park ${driving ? "drive" : ""}" title="${t("Open in Google Maps")}">${esc(where)}</span></div>
      <div class="body"><div class="summary">
      <div class="hero">${pic ? `<img src="${esc(pic)}" alt="">` : `<ha-icon icon="mdi:car-hatchback"></ha-icon>`}</div>
      <div class="mid">
        <div class="list">${st("doors", unlocked, ["locked", "unlocked"], "warn", hasLocks)}${st(na ? "trunk" : "boot", B("trunk") === "on", ["closed", "open"], "bad", hasTrunk)}${st(na ? "hood" : "bonnet", B("hood") === "on", ["closed", "open"], "bad", hasHood)}
          ${st("windows", winsOpen, ["closed", "open"], "bad", hasWins)}${st("moonroof", moonroofOpen, ["closed", "open"], "bad", hasMoonroof)}${st("warnings", warn, ["none", "warning active"], "bad", hasWarn)}</div>
        <div class="kv">${!na || range !== null ? `<span>${t("estimated range")}</span><b>${entDist(rangeEnt)} ${distanceUnit}</b>` : ""}<span>${t("odometer")}</span><b>${entDist(odoEnt)} ${distanceUnit}</b></div>
        <div class="gauge">${gauge}</div>
      </div>
      ${batteryCard}
      </div><div class="details">
      <div class="hr"><span>${t("information")}</span></div>
      <div class="info ${cellsHtml ? "" : "no-cells"}">
        ${cellsHtml}
        <div class="topdown">${corner(flKey, flLbl)}${car}${corner(frKey, frLbl)}${corner(rlKey, rlLbl)}${corner(rrKey, rrLbl)}</div>
      </div>
      </div></div>
    </ha-card>`;

    r.querySelector(".upd").addEventListener("click", () => {
      if (na) {
        const devId = h.entities?.[`sensor.odometer_${p}`]?.device_id || h.entities?.[`sensor.fuel_level_${p}`]?.device_id;
        if (devId) h.callService("toyota_na", "refresh", { vehicle: devId });
      } else {
        h.callService("button", "press", { entity_id: `button.${p}_refresh_vehicle_status` });
      }
      this._busy = true; this._sig = null; this._render(); setTimeout(() => { this._busy = false; this._sig = null; this._render(); }, 60000);
    });
    if (la) r.querySelector(".park").addEventListener("click", () => window.open(`https://www.google.com/maps/search/?api=1&query=${la},${lo}`, "_blank"));
  }
}
const CARD_TYPE = "toyota-card-localized";
if (!customElements.get(CARD_TYPE)) customElements.define(CARD_TYPE, ToyotaLocalizedCard);

window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "Toyota Card Localized",
    description: "Toyota vehicle status with English, Russian and German translations",
    preview: false,
  });
}
console.info(`Toyota Card Localized v${VERSION}`);
