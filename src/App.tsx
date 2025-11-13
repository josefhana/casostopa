// src/App.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { enUS, cs } from 'date-fns/locale';

/* ===== Supabase klient (volitelný) ===== */
const SUPA_URL = process.env.REACT_APP_SUPABASE_URL || '';
const SUPA_ANON = process.env.REACT_APP_SUPABASE_ANON || '';
const supabase = (SUPA_URL && SUPA_ANON) ? createClient(SUPA_URL, SUPA_ANON) : (null as any);

/* ===== typy ===== */
type Session = {
  id: string;
  start: string;
  end: string;
  minutes: number;
  pausedMinutes?: number;
  project: string;
  note?: string;
  manual?: boolean;
};
type Habit = {
  id: string;
  name: string;
  checks: Record<string, boolean>;
};
type Lang = 'cz'|'en';

/* ===== i18n ===== */
const t = (lang:Lang) => ({
  project: lang==='cz' ? 'projekt' : 'project',
  weeklyOverview: lang==='cz' ? 'týdenní přehled' : 'weekly overview',
  streak: lang==='cz' ? 'streak' : 'streak',
  daysInRow: lang==='cz' ? 'dní v řadě se studiem' : 'days in a row studied',
  today: lang==='cz' ? 'dnes' : 'today',
  week: lang==='cz' ? 'týden' : 'week',
  total: lang==='cz' ? 'celkem' : 'total',
  recent: lang==='cz' ? 'poslední záznamy' : 'recent sessions',
  all: lang==='cz' ? 'vše' : 'all',
  addManually: lang==='cz' ? 'přidat manuálně' : 'add manually',
  minutesHint: lang==='cz' ? 'minuty (např. 45)' : 'minutes (e.g. 45)',
  save: lang==='cz' ? 'uložit' : 'save',
  cancel: lang==='cz' ? 'zrušit' : 'cancel',
  edit: lang==='cz' ? 'upravit' : 'edit',
  delete: lang==='cz' ? 'smazat' : 'delete',
  noTitle: lang==='cz' ? 'bez názvu' : 'no title',
  noData: lang==='cz' ? 'zatím nic' : 'nothing yet',
  habits: lang==='cz' ? 'zvyky (týden)' : 'habits (week)',
  newHabit: lang==='cz' ? 'nový zvyk…' : 'new habit…',
  add: lang==='cz' ? 'přidat' : 'add',
  stats: lang==='cz' ? 'statistiky' : 'stats',
  calendarMonth: lang==='cz' ? 'kalendář (měsíc)' : 'calendar (month)',
  monthLabel: (d:Date) => format(d, 'LLLL yyyy', { locale: lang==='cz' ? cs : enUS }),
  weekRange: (a:Date,b:Date) => `${format(a,'dd.MM.')} – ${format(b,'dd.MM.yyyy')}`,
  dowShortHabits: lang==='cz' ? ['po','út','st','čt','pá','so','ne'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],

  start: lang==='cz' ? 'start' : 'start',
  pause: lang==='cz' ? 'pauza' : 'pause',
  resume: lang==='cz' ? 'pokračovat' : 'resume',
  setLap: lang==='cz' ? 'set' : 'set',
  stopSave: lang==='cz' ? 'stop & uložit' : 'stop & save',
  switchToPomodoro: lang==='cz' ? 'přepnout na pomodoro' : 'switch to pomodoro',
  switchToStopwatch: lang==='cz' ? 'přepnout na stopky' : 'switch to stopwatch',

  focus: lang==='cz' ? 'fokus' : 'focus',
  shortBreak: lang==='cz' ? 'pauza' : 'break',
  longBreak: lang==='cz' ? 'dlouhá pauza' : 'long break',
  completed: lang==='cz' ? 'dokončeno' : 'completed',
  skip: lang==='cz' ? 'přeskočit' : 'skip',
  reset: lang==='cz' ? 'reset' : 'reset',

  level: lang==='cz' ? 'liga / level' : 'league / level',
  toNext: lang==='cz' ? 'do další úrovně' : 'to next level',
  maxReached: lang==='cz' ? 'maximum dosaženo' : 'max level reached',

  backup: lang==='cz' ? 'záloha dat' : 'backup',
  exportJson: lang==='cz' ? 'export' : 'export',
  importJson: lang==='cz' ? 'import' : 'import',

  notLogged: lang==='cz' ? 'nepřihlášen' : 'not logged in',

  tutorial: lang==='cz' ? 'návod' : 'tutorial',
  tutorialTitle: lang==='cz' ? 'Jak používat aplikaci' : 'How to use the app',

    welcomeTo: lang==='cz' ? 'Vítej v Časostopě' : 'Welcome to Casostopa',
  emailLabel: lang==='cz' ? 'E-mail' : 'Email',
  passLabel: lang==='cz' ? 'Heslo' : 'Password',
  loginBtn: lang==='cz' ? 'přihlásit' : 'log in',
  signupBtn: lang==='cz' ? 'registrovat se' : 'sign up',
  needAccountQ: lang==='cz' ? 'Nemáš účet?' : 'No account?',

  signupTitle: lang==='cz' ? 'Vytvořit účet' : 'Create account',
  passAgainLabel: lang==='cz' ? 'Heslo znovu' : 'Password again',
  signupErrorExists: lang==='cz'
    ? 'Tento e-mail už má účet, zkus se přihlásit.'
    : 'This email already has an account, please log in.',
  signupErrorMismatch: lang==='cz'
    ? 'Hesla se neshodují.'
    : 'Passwords do not match.',
  signupInfo: lang==='cz'
    ? 'Po vytvoření účtu se přihlaš svým e-mailem a heslem.'
    : 'After creating an account, log in with your email and password.',

  logoutTitle: lang==='cz' ? 'Účet bude odhlášen' : 'You will be logged out',
  continue: lang==='cz' ? 'pokračovat' : 'continue',
  back: lang==='cz' ? 'zrušit' : 'cancel',

  pinkNoise: lang==='cz' ? 'růžový šum' : 'pink noise',

  lapsTitle: lang==='cz' ? 'mezičasy' : 'laps',
  lapsEmpty: lang==='cz' ? 'zatím žádný set' : 'no laps yet',
  lapLabel: lang==='cz' ? 'set' : 'lap',
});

/* návod */
const tutorialItems = (lang:Lang): {title:string; body:string}[] => (lang==='cz'
  ? [
      { title:'Stopky', body:'Spusť měření času tlačítkem Start. Můžeš měření pozastavit a znovu spustit. Tlačítko „set“ uloží mezičas. „stop & uložit“ uloží blok včetně případné pauzy do historie.' },
      { title:'Mezičasy', body:'Po zapnutí stopek se pod nimi zobrazí seznam mezičasů. Každý „set“ uloží rozdíl od předchozího mezičasu.' },
      { title:'Pomodoro', body:'Fokus, krátká pauza a dlouhá pauza. Kliknutím na čísla otevřeš wheel-picker a nastavíš minuty. Ulož tlačítkem Uložit.' },
      { title:'Zvukové notifikace', body:'Po skončení fokusu i pauzy zazní krátké dvoutónové „hotovo“.' },
      { title:'Projekty', body:'Nahoře vlevo vybereš aktivní projekt. Přidávej, přejmenovávej, mazej. Aktivní projekt se použije pro nové záznamy.' },
      { title:'Týdenní přehled', body:'Sloupce ukazují čas v jednotlivých dnech aktuálního týdne. Šipkami přepínej týdny.' },
      { title:'Poslední záznamy', body:'Historie + ruční přidání času přes oranžovou lištu vpravo dole. Jemné „magnety“ na 30 min.' },
      { title:'Zvyky', body:'Odškrtávej dny, sleduj streaky a řetězy (chains) za posledních 30 dní.' },
      { title:'Statistiky', body:'Dnes/týden/celkem. V PRO: průměr, medián, nejlepší historický streak a trend.' },
      { title:'Kalendář', body:'Měsíční heatmapa hodin studia.' },
      { title:'Záloha', body:'Export/Import v nastavení. Export stáhne .json, Import přepíše uložená data.' },
      { title:'Vzhled a jazyk', body:'Přepni brown/mono sliderem, CZ/ENG, PRO mód.' },
    ]
  : [
      { title:'Stopwatch', body:'Start, pause, resume. “set” stores a lap. “stop & save” stores the block including pause.' },
      { title:'Pomodoro', body:'Click values to open wheel-picker and set minutes. Save to apply.' },
      { title:'Projects', body:'Pick the active project; add/rename/delete inline.' },
      { title:'Weekly overview', body:'Bars per weekday; navigate weeks.' },
      { title:'Recent sessions', body:'History + orange manual add slider with soft 30-min snaps.' },
      { title:'Habits', body:'Tick per day, mini streaks, 30-day chains.' },
      { title:'Stats', body:'Today / week / total. In PRO: avg, median, best streak, trend.' },
      { title:'Calendar', body:'Monthly heatmap.' },
      { title:'Backup', body:'Export/Import (.json). Import overwrites local data.' },
      { title:'Appearance & language', body:'Brown/mono slider, CZ/ENG, PRO mode.' },
    ]
);

/* ===== pomocné ===== */
const fmtHm = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};
const fmtMs = (sec: number) =>
  `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`;
const isoDayKey = (d: Date) => format(d, 'yyyy-MM-dd');
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));

/* ===== Hlavní App ===== */
export default function App() {
  const [theme, setTheme] = useState<'brown' | 'mono'>(() => (localStorage.getItem('theme') === 'mono' ? 'mono' : 'brown'));
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') === 'en' ? 'en' : 'cz'));

  // PRO režim: defaultně vypnuto
  const [proMode, setProMode] = useState<boolean>(() => localStorage.getItem('proMode')==='1');
  useEffect(() => { document.body.setAttribute('data-theme', theme); localStorage.setItem('theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);
  useEffect(() => { localStorage.setItem('proMode', proMode ? '1' : '0'); }, [proMode]);

  /* ===== Inline CSS (aktualizace stylů dle požadavků) ===== */
  useEffect(() => {
    const css = `
:root{ --accent:#f59e0b; --bar:#f7c06d; --green:#22c55e }
body[data-theme="brown"]{ --bg:#090402; --panel:rgba(255,255,255,.025); --panel-2:rgba(20,12,8,.45); --panel-strong:rgba(24,16,12,.66); --border:rgba(255,255,255,.07); --text:#f4eee7; --text-muted:#b9aca2 }
body[data-theme="mono"]{ --bg:#0e0e0e; --panel:rgba(255,255,255,.03); --panel-2:rgba(20,20,20,.5); --panel-strong:rgba(20,20,20,.72); --border:#2e2e2e; --text:#ffffff; --text-muted:#bbbbbb; --accent:#f59e0b; --bar:#ffffff; --green:#22c55e }
*{box-sizing:border-box} html,body,#root{height:100%}
body{ margin:0; background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol",sans-serif; -webkit-font-smoothing:antialiased }
.container{max-width:1240px;margin:0 auto;padding:16px 24px 24px;position:relative}
.topBar{ position:fixed;top:12px;right:12px;z-index:9999; display:flex;gap:8px;align-items:center }
.iconSquare{ width:36px;height:36px;border-radius:10px; border:1px solid var(--border); background:var(--panel-2); color:var(--text);display:grid;place-items:center; cursor:pointer;font-size:14px;line-height:1 }
.iconSquare:hover{filter:brightness(1.1)}
.userBadge{ display:flex;gap:8px;align-items:center; border:1px solid var(--border); background:var(--panel-2); padding:6px 10px;border-radius:10px; font-size:12px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap }
.warnBadge{ display:flex;gap:6px;align-items:center; border:1px solid #ffcc00; background:#000000aa; color:#ffcc00; padding:6px 10px;border-radius:10px; font-size:12px;font-weight:600 }
.warnIcon{font-weight:900;font-size:13px}
.settingsPanel{ position:absolute;top:46px;right:0; background:var(--panel-2); border:1px solid var(--border); border-radius:12px;padding:12px; min-width:320px; backdrop-filter:blur(4px) }
.settingsRow{display:flex;justify-content:space-between;align-items:center;margin:8px 0}
.settingsLabel{font-size:13px;color:var(--text)}
.settingsRight{display:flex;gap:6px;align-items:center}
.sliderWrap{ position:relative;width:74px;height:28px;border-radius:999px; border:1px solid var(--border); background:var(--panel); padding:2px;cursor:pointer }
.sliderKnob{ position:absolute;top:2px;width:24px;height:24px;border-radius:999px; background:var(--accent);transition:left .15s }
.smallBtn{ padding:6px 10px;border-radius:8px; border:1px solid var(--border); background:#0000;color:var(--text); cursor:pointer;font-size:12px;line-height:1.1;font-weight:500 }
.smallBtn.primary{ background:var(--accent);border-color:var(--accent);color:#1a1a1a }
.settingsDivider{height:1px;background:var(--border);margin:10px 0}

/* top frame */
.topRow{ display:grid; grid-template-columns:auto auto auto auto; gap:12px; border:2px dashed var(--border); border-radius:14px; padding:12px; margin-top:66px; margin-bottom:14px; align-items:stretch; overflow:hidden }
.headerBox{ background:var(--panel); border:1px solid var(--border); border-radius:12px; padding:12px }
.boxProject{width:320px;max-width:100%}
.boxWeek{width:300px;max-width:100%}
.boxStreak{width:210px;max-width:100%}
.boxLevel{width:210px;max-width:100%}
.topMini{min-height:140px;display:flex;flex-direction:column;justify-content:space-between}
.sectionTitle{font-weight:700;margin-bottom:8px;font-size:14px;line-height:1.3}
.muted{color:var(--text-muted);font-size:13px;line-height:1.4}
.layout{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}
.leftCol{display:grid;gap:16px}
.rightCol{display:grid;gap:16px}
.card{ background:var(--panel); border:1px solid var(--border); border-radius:14px; padding:16px; color:var(--text) }
.smallCard{padding:12px}
.minicard{ background:rgba(255,255,255,.05); border:1px solid transparent; border-radius:12px; padding:8px }
.habitStreakCard{ background:rgba(255,255,255,.08); border:1px solid transparent; border-radius:10px; padding:10px; display:flex;align-items:center;justify-content:space-between }
.habitStreakVal{font-size:22px;font-weight:800}
.btn{ padding:8px 12px;border-radius:10px; border:1px solid var(--accent); background:var(--accent); color:#1a1a1a; cursor:pointer; font-weight:600; font-size:14px;line-height:1.2; white-space:nowrap }
.btn.secondary{ background:transparent; border:1px solid var(--border); color:var(--text) }
.btn.small{ padding:6px 10px; font-size:12px; }
.iconBtn{ border:1px solid var(--border); background:#0000; color:var(--text); padding:4px 8px; border-radius:8px; cursor:pointer; font-size:12px;line-height:1.2;font-weight:500 }
.iconBtn.danger{ border-color:#8b2a2a; color:#ffb3b3; background:#0000 }
.input{ border:2px solid var(--border); border-radius:10px; padding:8px 12px; background:rgba(0,0,0,.15); color:var(--text); width:100%; font-size:15px; line-height:1.3; appearance:none; -webkit-appearance:none }
.modalCard .input{ background:rgba(0,0,0,.35)!important; border-color:var(--border) }
.input:focus{ outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(245,158,11,.15) }
.noteInput{ width:100%;min-width:140px; border:1px solid var(--border); background:rgba(0,0,0,.15); color:var(--text); border-radius:8px; padding:6px 8px; font-size:13px;line-height:1.3 }
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chipBtn{ padding:6px 10px; border:1px solid var(--border); border-radius:999px; background:#0000; color:var(--text); cursor:pointer; font-size:12px;line-height:1.2 }
.chipBtn.active{ background:var(--accent); color:#1a1a1a; border-color:var(--accent) }

/* === Projects: hlavička jako toggle řádek s šipkou === */
.projHeaderRow{ display:flex; align-items:center; justify-content:stretch; gap:10px }
.projTitleBtn{
  border:1px solid var(--border);
  background:var(--panel-2);
  color:var(--text);
  font-weight:800;
  font-size:16px;
  line-height:1.2;
  padding:8px 10px;
  border-radius:10px;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  width:100%;
}
.projTitleBtn:hover{
  filter:brightness(1.05);
}
.projAddBtn{
  background:transparent; border:none; color:var(--text);
  font-weight:800; font-size:15px; cursor:pointer; padding:4px 8px; border-radius:8px;
  outline:1px dashed transparent;
}
.projAddBtn:hover{ text-decoration:underline }

/* stopwatch – fixní výška, mezičasy v obdélníku, skrolují po >3 položkách */
.stopwatchCard{padding:12px; display:flex; flex-direction:column; height:360px}
.stopwatchWrap{ position:relative; display:flex; flex-direction:column; gap:8px; flex:1 }
.stopwatchBox{ background:var(--panel); border:1px solid var(--border); border-radius:18px; padding:16px 14px 12px 14px; color:var(--text) }
.digits{ display:flex;justify-content:center;align-items:baseline; gap:10px;line-height:1 }
.digit{ font-weight:700; font-size:58px; letter-spacing:1px }
.colon{ font-weight:600; font-size:48px; opacity:.85; margin:0 2px }
.pauseHint{ text-align:center; margin-top:4px; font-size:12px; color:var(--text-muted) }
.pill{display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;border:1px solid var(--border);background:var(--panel-2);font-size:13px;cursor:pointer}
.pill:hover{filter:brightness(1.05)}
.controls{ display:flex; gap:8px; justify-content:center; margin-top:10px; flex-wrap:wrap }
.lapsUnder{ margin-top:8px; background:rgba(255,255,255,.03); border:1px solid var(--border); border-radius:12px; padding:8px; flex:1; overflow:auto; min-height:80px; max-height:140px }
.lapsUnder .lapRow{ display:flex;justify-content:space-between;align-items:center; padding:6px 4px; border-top:1px dashed var(--border) }

.recentScroll, .lapsUnder, .modalBodyScroll{ scrollbar-width:none; -ms-overflow-style:none }
.recentScroll::-webkit-scrollbar, .lapsUnder::-webkit-scrollbar, .modalBodyScroll::-webkit-scrollbar{ display:none }
.streakNumber{ font-size:34px; font-weight:800; margin-bottom:6px }

/* === Poslední záznamy: pevná výška, scroll === */
.recentCard{ display:flex; flex-direction:column; height:460px }
.recentListHeader{ display:flex;justify-content:space-between;align-items:center; margin-bottom:8px;flex-wrap:wrap;row-gap:8px }
.recentScroll{ flex:1; overflow-y:auto; padding-right:6px }
.recentList{display:grid;gap:6px}
.recentRow{ display:grid; grid-template-columns:1fr .6fr .7fr .7fr auto; gap:10px;align-items:center; padding:8px 0; border-bottom:1px solid var(--border); white-space:nowrap; overflow:hidden;text-overflow:ellipsis; font-size:13px;line-height:1.3 }
.recentFooter{ position:relative; padding-top:10px; display:flex; justify-content:flex-end }

/* week histogram */
.weekbar{display:flex;gap:6px;align-items:flex-end}
.smallWeek{height:52px}
.wcolSmall{ flex:1; background:rgba(0,0,0,.20); border:1px solid var(--border); border-radius:6px; display:flex; align-items:flex-end; justify-content:center; min-width:14px }
.wbar{ width:100%; background:var(--bar); border-radius:6px }
.weekNav{ display:flex;align-items:center;justify-content:space-between; gap:8px;margin-bottom:6px;font-size:13px }
.weekBtn{ border:1px solid var(--border); background:#0000; color:var(--text); padding:4px 8px; border-radius:8px; cursor:pointer; font-size:12px;line-height:1.2 }

/* habits */
.habitsGrid{ display:grid; grid-template-columns:2.6fr repeat(7,0.5fr); gap:2px; align-items:center }
.habitsHead{ font-size:12px; color:var(--text-muted); text-align:center }
.habitName{ display:flex; align-items:center; gap:6px; font-size:13px; line-height:1.3 }
.habitInput{ width:100%; border:1px solid var(--border); background:rgba(0,0,0,.15); color:var(--text); border-radius:8px; padding:6px 8px; font-size:13px; line-height:1.3 }
.habitInput::placeholder{ color:#999 }
.dayCell{display:flex;justify-content:center}
.checkbox{ position:relative; width:18px;height:18px; border-radius:5px; border:2px solid var(--border); background:rgba(0,0,0,.06); display:inline-block; cursor:pointer }
.checkbox.checked{ background:var(--green); border-color:var(--green) }
.checkbox.checked::after{ content:"✓"; position:absolute; inset:0; display:grid; place-items:center; font-size:12px; color:#0b1a0f; font-weight:900 }

/* chains */
.habitChains{ margin-top:10px; border-top:1px solid var(--border); padding-top:10px; display:grid; gap:8px }
.chainRow{ display:flex; align-items:center; gap:8px }
.chainName{ min-width:120px; font-size:12px; color:var(--text) }
.chainSquares{ display:flex; gap:3px; flex-wrap:wrap }
.chainSq{ width:10px; height:10px; border-radius:2px; background:rgba(255,255,255,.08); border:1px solid var(--border) }
.chainSq.on{ background:var(--green); border-color:var(--green) }

/* level card */
.levelTitle{font-weight:700;margin-bottom:6px}
.levelProgressOuter{ height:12px; border-radius:999px; background:rgba(0,0,0,.08); border:1px solid var(--border); overflow:hidden; max-width:180px }
.levelProgressFill{ height:100%; background:linear-gradient(90deg,#f59e0b,#22c55e,#60a5fa,#8b5cf6) }
.levelMeta{ display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:6px }

/* calendar */
.calendarHeader{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px }
.calendarGrid{ display:grid; grid-template-columns:repeat(7,1fr); gap:8px }
.calHead{ font-size:13px; color:var(--text-muted); text-align:center; margin-bottom:6px }
.calCell{ aspect-ratio:1/1; border-radius:12px; background:rgba(255,255,255,.05); border:1px solid var(--border); display:flex; flex-direction:column; align-items:flex-end; justify-content:flex-end; padding:6px; position:relative; overflow:hidden; color:var(--text); font-size:12px; line-height:1.2 }
.calCell .dayNum{ position:absolute; top:6px; left:6px; font-size:12px; color:var(--text-muted) }
.calCell .hours{ font-size:12px; font-weight:700 }
.cal0{ background:rgba(239,68,68,.28); border-color:rgba(239,68,68,.45) }
.cal1{ background:rgba(245,158,11,.28); border-color:rgba(245,158,11,.45) }
.cal2{ background:rgba(34,197,94,.32); border-color:rgba(34,197,94,.55) }
.cal3{ background:rgba(21,128,61,.36); border-color:rgba(21,128,61,.60) }

/* modály */
.modalBackdrop{ position:fixed; inset:0; background:rgba(0,0,0,.45); display:grid; place-items:center; z-index:10050 }
.modalCard{ position:relative; width:min(520px,92%); max-width:520px; border-radius:14px; padding:22px 18px 66px 18px; color:var(--text); backdrop-filter:blur(8px); border:1px solid var(--border) }
body[data-theme="brown"] .modalCard{ background:rgba(20,12,8,.6); border-color:rgba(255,255,255,.12) }
body[data-theme="mono"] .modalCard{ background:rgba(0,0,0,.6); border-color:#2a2a2a }
.modalTitle{ font-weight:800; font-size:18px; margin-bottom:12px; line-height:1.3 }
.modalSectionLabel{ font-size:13px; margin-bottom:4px; font-weight:600 }
.modalRow{display:flex;flex-direction:column;margin-bottom:10px}
.modalActions{ display:flex; justify-content:flex-end; gap:8px; margin-top:10px }
.closeX{ position:absolute; top:10px; right:10px; background:#0000; border:1px solid var(--border); width:28px; height:28px; border-radius:8px; color:var(--text); font-size:14px; line-height:24px; text-align:center; cursor:pointer }
.modalBodyScroll{ max-height:60vh; overflow:auto; padding-right:6px }

/* === MANUAL ADD DRAG BAR — širší: ~polovina footeru === */
.manualRow{ display:flex; align-items:center; gap:10px; width:100%; justify-content:flex-end; position:relative }
.manualWrap{ position:relative; display:flex; gap:10px; align-items:center; width:100%; justify-content:flex-end }
.dragBar{ position:relative; height:8px; border-radius:999px; background:linear-gradient(90deg, rgba(245,158,11,.28), rgba(245,158,11,.6)); border:1px solid rgba(245,158,11,.6); width:50%; min-width:320px; max-width:560px; user-select:none }
.dragHandle{ position:absolute; top:50%; transform:translate(-50%,-50%); min-width:44px; height:22px; padding:0 8px; border-radius:8px; background:#f59e0b; color:#1a1a1a; font-weight:800; font-size:11px; display:grid; place-items:center; box-shadow:0 2px 8px rgba(0,0,0,.25); cursor:ew-resize }
.dragTics{ position:absolute; inset:0; pointer-events:none }
.dragTics::before{ content:""; position:absolute; left:0; right:0; top:50%; height:2px; transform:translateY(-50%); background:repeating-linear-gradient(90deg, transparent 0px, transparent 28px, rgba(255,255,255,.15) 28px, rgba(255,255,255,.15) 29px); border-radius:999px }

/* === PRO trend card === */
.trendCardSmall .digits{ display:none }
.trendSvg{ width:100%; height:90px }
.trendToggle{ margin-top:6px; display:flex; gap:6px; justify-content:flex-end }

/* === Wheel Overlays — vyšší z-index než stopky === */
.wheelOverlay{ position:fixed; inset:0; z-index:10060 }
.wheelBackdrop{ position:absolute; inset:0; background:rgba(0,0,0,.30) }
.wheelCard{ position:absolute; border-radius:14px; border:1px solid var(--border); color:var(--text); backdrop-filter:blur(10px); box-shadow:0 14px 34px rgba(0,0,0,.45); transform-origin: top center; animation: wheel-pop .14s ease-out }
@keyframes wheel-pop{ from{ transform:scale(.96); opacity:0 } to{ transform:scale(1); opacity:1 } }
.wheelTitle{ text-align:center; font-weight:700; margin-bottom:6px }
.wheelList{ position:relative; overflow-y:auto; overscroll-behavior:contain; scroll-snap-type:y mandatory; padding:0 8px; scrollbar-width:none; -ms-overflow-style:none }
.wheelList::-webkit-scrollbar{ display:none }
.wheelItem{ scroll-snap-align:center }

/* Logout modal – rozestup tlačítek vlevo */
.logoutActions{ display:flex; gap:12px; justify-content:flex-start; margin-top:12px }

/* === Úkoly (PRO) – beze změny vzhledu + animované odškrtnutí === */
.tasksCard{ padding:14px }
.tasksList{ height:140px; overflow-y:auto; padding-right:6px; scrollbar-width:none; -ms-overflow-style:none }
.tasksList::-webkit-scrollbar{ display:none }
.taskItem{ display:flex; align-items:center; gap:10px; padding:6px 4px; border-bottom:1px solid var(--border) }
.taskLabel{ color:var(--text); font-size:13px }
.addRow{ display:flex; gap:8px; margin-top:10px }
.taskCheck{
  width:18px; height:18px; border-radius:5px;
  border:2px solid var(--border);
  background:rgba(0,0,0,.08);
  display:inline-block; cursor:pointer; position:relative;
  transition: transform .12s ease, background .12s ease, border-color .12s ease, opacity .2s ease;
}
.taskCheck.checked{ background:var(--green); border-color:var(--green); transform: scale(0.96) }
.taskCheck.checked::after{ content:"✓"; position:absolute; inset:0; display:grid; place-items:center; font-size:12px; color:#0b1a0f; font-weight:900 }
.taskFadeOut{ animation: task-fade .22s ease forwards }
@keyframes task-fade { to { opacity:0; transform: translateY(-2px) } }
    `.trim();

    let el = document.getElementById('app-inline-styles') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'app-inline-styles';
      el.innerHTML = css;
      document.head.appendChild(el);
    } else {
      el.innerHTML = css;
    }
  }, []);

  /* ===== Auth ===== */
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login'|'signup'>('login');

  const [loginEmail,setLoginEmail] = useState('');
  const [loginPass,setLoginPass] = useState('');

  const [signupEmail,setSignupEmail] = useState('');
  const [signupPass,setSignupPass] = useState('');
  const [signupPass2,setSignupPass2] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }: any) => setUserEmail(data?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, sess: any) => {
      setUserEmail(sess?.user?.email ?? null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  /* ===== Data ===== */
  const [sessions, setSessions] = useState<Session[]>(() => {
    try { const r = localStorage.getItem('sessions'); return r ? JSON.parse(r) : []; } catch { return []; }
  });
  useEffect(()=>localStorage.setItem('sessions', JSON.stringify(sessions)),[sessions]);

  const [projects, setProjects] = useState<string[]>(() => {
    try { const r = localStorage.getItem('projects'); const base = r ? JSON.parse(r) : ['Psychologie']; return base; } catch { return ['Psychologie']; }
  });
  const [activeProject, setActiveProject] = useState<string>(() => {
    try { const p = JSON.parse(localStorage.getItem('prefs') || '{}'); return p.activeProject || 'Psychologie'; } catch { return 'Psychologie'; }
  });
  useEffect(()=>{
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('prefs', JSON.stringify({activeProject}));
  },[projects,activeProject]);

  const [deleteProjectCandidate, setDeleteProjectCandidate] = useState<string | null>(null);

  const handleDeleteProject = (projectName: string, deleteSessions: boolean) => {
    if (!projectName) return;
    setProjects(prev => {
      const next = prev.filter(p => p !== projectName);
      if (activeProject === projectName) {
        const fallback = next[0] || 'Psychologie';
        setActiveProject(fallback);
      }
      return next;
    });
    if (deleteSessions) {
      setSessions(prev => prev.filter(s => s.project !== projectName));
    }
    setDeleteProjectCandidate(null);
  };

  /* týdenní posun */
  const [weekOffset,setWeekOffset]=useState(0);
  const refDate=addDays(new Date(),weekOffset*7);
  const weekStartRef=startOfWeek(refDate,{weekStartsOn:1});
  const weekEndRef=endOfWeek(refDate,{weekStartsOn:1});

  /* filtry + odvozené statistiky */
  const [statsFilter,setStatsFilter]=useState('__ALL__');
  const [recentFilter,setRecentFilter]=useState('__ALL__');
  const filtered=useMemo(
    ()=>statsFilter==='__ALL__'?sessions:sessions.filter(s=>s.project===statsFilter),
    [sessions,statsFilter]
  );
  const filteredRecent=useMemo(
    ()=>recentFilter==='__ALL__'?sessions:sessions.filter(s=>s.project===recentFilter),
    [sessions,recentFilter]
  );

  const totalMinutesAll=useMemo(()=>sessions.reduce((acc, b)=>acc+b.minutes,0),[sessions]);
  const todayKey=isoDayKey(new Date());
  const minutesToday=useMemo(
    ()=>filtered.filter(s=>isoDayKey(parseISO(s.start))===todayKey).reduce((acc,b)=>acc+b.minutes,0),
    [filtered,todayKey]
  );
  const weekBars=useMemo(()=>computeWeekBars(filtered,weekStartRef),[filtered,weekStartRef]);
  const weekTotalMinutes=useMemo(()=>weekBars.reduce((acc,b)=>acc+b.minutes,0),[weekBars]);
  const filteredTotalMinutes=useMemo(()=>filtered.reduce((acc,b)=>acc+b.minutes,0),[filtered]);
  const streak=useMemo(()=>computeStreakDays(sessions),[sessions]);

  /* PRO statistiky */
  const proStats = useMemo(()=>{
    const arr = filtered.map(s=>s.minutes);
    const avg = arr.length? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    const median = (()=> {
      if(arr.length===0) return 0;
      const a=[...arr].sort((x,y)=>x-y); const mid=Math.floor(a.length/2);
      return a.length%2? a[mid] : Math.round((a[mid-1]+a[mid])/2);
    })();
    const bestStreak = computeStreakDaysAllTime(filtered);
    return { avg, median, bestStreak };
  },[filtered]);

  /* mezičasy */
  const [laps, setLaps] = useState<{totalSec:number;splitSec:number}[]>([]);

  /* ukládání */
  const onSaveFromStopwatch = (mins: number, pausedMins: number) => {
    const endAt = new Date();
    const startAt = new Date(endAt.getTime() - mins * 60000);
    const rec: Session = {
      id: crypto.randomUUID(),
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      minutes: Math.max(1, Math.round(mins)),
      project: activeProject,
      pausedMinutes: Math.max(0, Math.round(pausedMins)),
      note: ''
    };
    setSessions(prev => [rec, ...prev]);
  };
  const onSaveFromPomodoro = (mins: number, label: string) => {
    const endAt = new Date();
    const startAt = new Date(endAt.getTime() - mins * 60000);
    const rec: Session = {
      id: crypto.randomUUID(),
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      minutes: mins,
      project: activeProject,
      note: label || 'Pomodoro'
    };
    setSessions(prev => [rec, ...prev]);
  };
  const addManual = (mins: number) => {
    const endAt = new Date();
    const startAt = new Date(endAt.getTime() - mins * 60000);
    const rec: Session = {
      id: crypto.randomUUID(),
      start: startAt.toISOString(),
      end: endAt.toISOString(),
      minutes: Math.max(1, Math.round(mins)),
      project: activeProject,
      manual: true
    };
    setSessions(prev => [rec, ...prev]);
  };
  const updateSession=(id:string,patch:Partial<Session>)=>setSessions(prev=>prev.map(s=>s.id===id?{...s,...patch}:s));
  const deleteSession=(id:string)=>setSessions(prev=>prev.filter(s=>s.id!==id));

  /* ===== Zvyky ===== */
  const [habits,setHabits]=useState<Habit[]>(()=>{
    try{ const r=localStorage.getItem('habits_all'); return r?JSON.parse(r):[]; }catch{ return []; }
  });
  useEffect(()=>localStorage.setItem('habits_all', JSON.stringify(habits)),[habits]);

  const weekDays: string[] = useMemo(()=>{
    const days:string[]=[];
    const s=startOfWeek(weekStartRef,{weekStartsOn:1});
    for(let i=0;i<7;i++) days.push(isoDayKey(addDays(s,i)));
    return days;
  },[weekStartRef]);

  const addHabit=(name:string)=>{ const v=name.trim(); if(!v) return; setHabits(prev=>[...prev,{id:crypto.randomUUID(),name:v,checks:{}}]); };
  const toggleHabit=(id:string,dayIdx:number)=>{
    const key = weekDays[dayIdx];
    setHabits(prev=>prev.map(h=>{
      if(h.id!==id) return h;
      const checks={...h.checks, [key]: !h.checks[key]};
      return {...h, checks};
    }));
  };
  const deleteHabitFn=(id:string)=> setHabits(prev=>prev.filter(h=>h.id!==id));
  const renameHabit=(id:string,name:string)=> setHabits(prev=>prev.map(h=>h.id===id?{...h,name}:h));
  const habitStreak = (h:Habit) => {
    let c=0; let cur=startOfDay(new Date());
    while(true){ const k=isoDayKey(cur); if(h.checks[k]){ c++; cur = addDays(cur, -1); } else break; }
    return c;
  };

  /* ===== Stopky vs Pomodoro ===== */
  const [timerMode, setTimerMode] = useState<'stopwatch' | 'pomodoro'>(() =>
    (localStorage.getItem('timerMode') === 'pomodoro' ? 'pomodoro' : 'stopwatch'));
  useEffect(()=>localStorage.setItem('timerMode', timerMode),[timerMode]);

  /* ===== UI: modaly a nastavení ===== */
  const [showLoginModal,setShowLoginModal]=useState(false);
  const [showTutorial,setShowTutorial]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showLogoutConfirm,setShowLogoutConfirm]=useState(false);

  const settingsRef = useRef<HTMLDivElement|null>(null);
  useEffect(()=>{
    const onDocClick=(e:MouseEvent)=>{
      if(!showSettings) return;
      if(settingsRef.current && !settingsRef.current.contains(e.target as Node)){
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return ()=>document.removeEventListener('mousedown', onDocClick);
  },[showSettings]);

  const tt = t(lang);

  /* ===== Auth inputs ===== */

  const handleLogin = async ()=>{
    if(!supabase){ alert('Supabase není nakonfigurován'); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPass });
    if(error){ alert('Login selhal: '+error.message); return; }
    setUserEmail(data.user?.email ?? null);
    setShowLoginModal(false);
  };
  const handleSignup = async ()=>{
    if(!supabase){
      alert('Supabase není nakonfigurován');
      return;
    }
    if(!signupEmail || !signupPass){
      alert(lang==='cz' ? 'Vyplň e-mail a heslo.' : 'Fill in email and password.');
      return;
    }
    if(signupPass !== signupPass2){
      alert(tt.signupErrorMismatch);
      return;
    }

    const { data, error } = await supabase.auth.signUp({ email: signupEmail, password: signupPass });
    if(error){
      const msg = (error.message || '').toLowerCase();
      if(msg.includes('already') || msg.includes('registered')){
        alert(tt.signupErrorExists);
      }else{
        alert((lang==='cz'?'Registrace selhala: ':'Sign-up failed: ') + error.message);
      }
      return;
    }

    setSignupEmail('');
    setSignupPass('');
    setSignupPass2('');
    setAuthMode('login');
    setShowLoginModal(false);

    alert(lang==='cz'
      ? 'Účet byl vytvořen. Teď se můžeš přihlásit.'
      : 'Account created. You can now log in.');
  };

    const doLogout = async ()=>{
    if(supabase){ await supabase.auth.signOut(); }
    setUserEmail(null);
    setLoginEmail('');
    setLoginPass('');
    setSignupEmail('');
    setSignupPass('');
    setSignupPass2('');
    setAuthMode('login');
    setShowLogoutConfirm(false);
  };
  /* === Backup helpers === */
  const backupKeys = ['sessions','projects','prefs','habits_all','tasks_v1'] as const;
  const collectBackup=()=>{
    const dump:any={ _meta:{ app:'minimalistic-study-tracker', exportedAt:new Date().toISOString(), version:4 }, data:{} };
    for(const k of backupKeys){
      const v=localStorage.getItem(k);
      if(v!==null) (dump.data as any)[k]=JSON.parse(v);
    }
    return dump;
  };
  const exportBackup=()=>{
    const obj=collectBackup();
    const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const ts=new Date().toISOString().replace(/[:.]/g,'-');
    a.href=url; a.download='study-tracker-backup-'+ts+'.json';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const importInputRef = useRef<HTMLInputElement|null>(null);
  const importBackup=async(file:File)=>{
    try{
      const text=await file.text();
      const parsed=JSON.parse(text);
      if(!parsed||!parsed.data||typeof parsed.data!=='object'){ alert('soubor nemá očekávaný formát'); return; }
      if(!window.confirm('Import přepíše uložená data v tomto prohlížeči. Pokračovat?')) return;

      const rm:string[]=[];
      for(let i=0;i<localStorage.length;i++){
        const k=localStorage.key(i)||'';
        if(backupKeys.includes(k as any)) rm.push(k);
      }
      rm.forEach(k=>localStorage.removeItem(k));
      for(const [k,v] of Object.entries(parsed.data as any)){
        localStorage.setItem(k,JSON.stringify(v));
      }
      alert('import hotov, stránka se obnoví');
      window.location.reload();
    }catch{
      alert('import selhal – neplatný soubor');
    }
  };

  /* ===== Pomodoro picker & pink noise ===== */
  type PickerState = null | {
    type:'focus'|'short'|'long';
    value:number; min:number; max:number;
    anchor:{ x:number; y:number; w:number; h:number };
  };
  const [pickerOpen, setPickerOpen] = useState<PickerState>(null);

  const [pinkOn,setPinkOn] = useState(false);
  const audioCtxRef = useRef<AudioContext|null>(null);
  const pinkGainRef = useRef<GainNode|null>(null);
  const pinkNodeRef = useRef<ScriptProcessorNode|null>(null);

  const startPink = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    const proc: ScriptProcessorNode = (ctx as any).createScriptProcessor(4096, 1, 1);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    (proc as any).onaudioprocess = (e: any) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i=0;i<out.length;i++) {
        const white = Math.random()*2-1;
        b0 = 0.99886*b0 + white*0.0555179;
        b1 = 0.99332*b1 + white*0.0750759;
        b2 = 0.96900*b2 + white*0.1538520;
        b3 = 0.86650*b3 + white*0.3104856;
        b4 = 0.55000*b4 + white*0.5329522;
        b5 = -0.7616*b5 - white*0.0168980;
        out[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11;
        b6 = white*0.115926;
      }
    };
    proc.connect(gain);
    gain.connect(ctx.destination);
    const target = 0.075;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 0.6);
    audioCtxRef.current = ctx;
    pinkGainRef.current = gain;
    pinkNodeRef.current = proc;
    setPinkOn(true);
  };

  const stopPink = async () => {
    try {
      const ctx = audioCtxRef.current;
      const gain = pinkGainRef.current;
      if (ctx && gain) {
        try {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        } catch {}
      }
      await new Promise(res=>setTimeout(res, 450));
      if (ctx && ctx.state !== 'closed') { try { await ctx.close(); } catch {} }
    } finally {
      audioCtxRef.current = null;
      pinkGainRef.current = null;
      pinkNodeRef.current = null;
      setPinkOn(false);
    }
  };

  const togglePinkNoise = () => { if(!pinkOn) startPink(); else stopPink(); };

  const playTwoTone = (f1:number,f2:number) => {
    try{
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dur=0.12, gap=0.06, now=ctx.currentTime;
      const mk=(f:number,t:number)=>{
        const o=ctx.createOscillator();
        const g=ctx.createGain();
        o.type='sine'; o.frequency.value=f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
        o.connect(g).connect(ctx.destination);
        o.start(t); o.stop(t+dur+0.05);
      };
      mk(f1,now); mk(f2,now+dur+gap);
      setTimeout(()=>ctx.close(), 1000);
    }catch{}
  };

  /* ===== Project wheel trigger state ===== */
  const [projWheel, setProjWheel] = useState<null | { anchor:{x:number;y:number;w:number;h:number}; index:number }>(null);
  const projBtnRef = useRef<HTMLButtonElement|null>(null);
  const openProjectWheel = ()=>{
    const idx = Math.max(0, projects.findIndex(p=>p===activeProject));
    const r = projBtnRef.current?.getBoundingClientRect();
    if(!r) return;
    setProjWheel({
      anchor:{ x:r.left, y:r.top + window.scrollY, w:r.width, h:r.height },
      index: idx<0?0:idx
    });
  };

  /* ====== RENDER ====== */
  return (
    <div className="container">
      {/* top bar */}
      <div className="topBar">
        {userEmail ? (
          <>
            <div className="userBadge" title={userEmail}>{userEmail}</div>
            <div className="iconSquare" onClick={()=>setShowLogoutConfirm(true)} title="log out">⏻</div>
          </>
        ) : (
          <>
            <div className="warnBadge" title={tt.notLogged}><span className="warnIcon">⚠</span>{tt.notLogged}</div>
                        <div
              className="iconSquare"
              onClick={()=>{
                setAuthMode('login');
                setShowLoginModal(true);
              }}
              title="log in"
            >
              👤
            </div>
          </>
        )}
        <div className="iconSquare" onClick={()=>setShowTutorial(true)} title={tt.tutorial}>?</div>

        <div style={{ position:'relative' }} ref={settingsRef}>
          <div className="iconSquare" onClick={()=>setShowSettings(s=>!s)} title="settings">⚙</div>
          {showSettings && (
            <div className="settingsPanel" onMouseDown={e=>e.stopPropagation()}>
              {/* theme slider */}
              <div className="settingsRow">
                <div className="settingsLabel">theme</div>
                <div className="settingsRight">
                  <div
                    className="sliderWrap"
                    onClick={()=>setTheme(th=> th==='brown'?'mono':'brown')}
                    title={theme}
                    aria-label="theme"
                  >
                    <div className="sliderKnob" style={{ left: theme==='mono'? 48 : 2 }} />
                  </div>
                </div>
              </div>
              {/* language */}
              <div className="settingsRow">
                <div className="settingsLabel">language</div>
                <div className="settingsRight">
                  <button className={'smallBtn '+(lang==='cz'?'primary':'')} onClick={()=>setLang('cz')}>CZ</button>
                  <button className={'smallBtn '+(lang==='en'?'primary':'')} onClick={()=>setLang('en')}>ENG</button>
                </div>
              </div>
              {/* PRO */}
              <div className="settingsRow">
                <div className="settingsLabel">PRO</div>
                <div className="settingsRight">
                  <div className="sliderWrap" onClick={()=>setProMode(v=>!v)}>
                    <div className="sliderKnob" style={{ left: proMode? 48 : 2 }} />
                  </div>
                </div>
              </div>
              {/* Pink noise slider */}
              <div className="settingsRow">
                <div className="settingsLabel">{tt.pinkNoise}</div>
                <div className="settingsRight">
                  <div className="sliderWrap" onClick={togglePinkNoise}>
                    <div className="sliderKnob" style={{ left: pinkOn? 48 : 2 }} />
                  </div>
                </div>
              </div>

              <div className="settingsDivider" />

              {/* Záloha */}
              <div className="settingsRow" style={{alignItems:'center'}}>
                <div className="settingsLabel" style={{marginTop:0}}>{tt.backup}</div>
                <div className="settingsRight" style={{gap:6}}>
                  <button className="smallBtn primary" onClick={exportBackup}>{tt.exportJson}</button>
                  <button className="smallBtn" onClick={()=>importInputRef.current?.click()}>{tt.importJson}</button>
                  <input
                    ref={importInputRef} type="file" accept="application/json" style={{display:'none'}}
                    onChange={e=>{
                      const f=e.target.files?.[0];
                      if(f) importBackup(f);
                      e.currentTarget.value='';
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* top dashed frame */}
      <div className="topRow">
        <div className="headerBox boxProject topMini">
          <div className="sectionTitle">{tt.project}</div>

          {/* Projects: jeden toggle řádek (název + šipka) otevírá wheelpicker */}
          <div className="projHeaderRow">
            <button
              ref={projBtnRef}
              className="projTitleBtn"
              onClick={openProjectWheel}
              title={activeProject}
            >
              <span
                style={{
                  flex: 1,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activeProject}
              </span>
              <span style={{ fontSize: 14, opacity: 0.8 }}>▾</span>
            </button>
          </div>
        </div>

        <div className="headerBox boxWeek topMini">
          <div className="weekNav">
            <button className="weekBtn" onClick={()=>setWeekOffset(o=>o-1)}>◄</button>
            <div>{tt.weekRange(weekStartRef,weekEndRef)}</div>
            <button className="weekBtn" onClick={()=>setWeekOffset(o=>o+1)}>►</button>
          </div>
          <WeekHistogram bars={weekBars} />
        </div>

        <div className="headerBox boxStreak topMini">
          <div className="sectionTitle">{tt.streak}</div>
          <div>
            <div className="streakNumber">{streak}</div>
            <div className="muted" style={{color:'inherit'}}>{tt.daysInRow}</div>
          </div>
        </div>

        <div className="headerBox boxLevel topMini">
          <LevelCard totalMinutes={totalMinutesAll} tt={tt} />
        </div>
      </div>

      <div className="layout">
        <div className="leftCol">
          {/* Stopky / Pomodoro */}
          <div className="card stopwatchCard">
            <div className="stopwatchWrap">
              <div className="stopwatchBox">
                {timerMode === 'stopwatch'
                  ? <Stopwatch onSave={onSaveFromStopwatch} tt={tt} laps={laps} setLaps={setLaps} />
                  : <PomodoroTimer
                      onSaveFocus={onSaveFromPomodoro}
                      tt={tt}
                      openPicker={(type, value, min, max, anchor)=>setPickerOpen({type,value,min,max,anchor})}
                      onPlaySound={(kind)=> {
                        if(kind==='focusEnd') playTwoTone(880, 660);
                        else playTwoTone(660, 990);
                      }}
                    />
                }
              </div>
              {/* Laps blok se u pomodora skrývá */}
              {timerMode==='stopwatch' && <LapsBlock laps={laps} tt={tt} />}
            </div>
            {/* Přepínač stopky/pomodoro: vpravo dole */}
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
              <button
                className="iconBtn"
                onClick={()=>{ setLaps([]); setTimerMode(m=> m==='stopwatch' ? 'pomodoro' : 'stopwatch'); }}
              >
                {timerMode==='stopwatch' ? tt.switchToPomodoro : tt.switchToStopwatch}
              </button>
            </div>
          </div>

          {/* V PRO režimu patří Zvyky pod stopky */}
          {proMode && (
            <div className="card dark">
              <div className="sectionTitle">{tt.habits}</div>
              <HabitsCard
                lang={lang}
                habits={habits}
                onAdd={addHabit}
                onToggle={toggleHabit}
                onDelete={deleteHabitFn}
                onRename={renameHabit}
                weekDays={weekDays}
                streakFn={habitStreak}
              />
            </div>
          )}

          {/* Poslední záznamy */}
          <div className="card recentCard">
            <div className="recentListHeader">
              <div className="sectionTitle" style={{margin:0}}>{tt.recent}</div>
              <div className="chips">
                <button
                  className={'chipBtn '+(recentFilter==='__ALL__'?'active':'')}
                  onClick={()=>setRecentFilter('__ALL__')}
                  style={{ color:'#000', background:'var(--accent)', borderColor:'var(--accent)' }}
                >
                  {tt.all}
                </button>
                {projects.map(p=>(
                  <button key={p} className={'chipBtn '+(recentFilter===p?'active':'')} onClick={()=>setRecentFilter(p)}>{p}</button>
                ))}
              </div>
            </div>
            <div className="recentScroll">
              <RecentList lang={lang} sessions={filteredRecent} onUpdate={updateSession} onDelete={deleteSession} />
            </div>
            <div className="recentFooter">
              <ManualAdd lang={lang} onAdd={addManual} />
            </div>
          </div>
        </div>

        <div className="rightCol">
          {/* Statistiky */}
          <div className="card statsCard">
            <div className="sectionTitle">{tt.stats}</div>
            <div className="chips" style={{marginBottom:6}}>
              <button className={'chipBtn '+(statsFilter==='__ALL__'?'active':'')} onClick={()=>setStatsFilter('__ALL__')}>{tt.all}</button>
              {projects.map(p=>(
                <button key={p} className={'chipBtn '+(statsFilter===p?'active':'')} onClick={()=>setStatsFilter(p)}>{p}</button>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns: 'repeat(3,1fr)',gap:6}}>
              <MiniStat label={tt.today} value={fmtHm(minutesToday)} />
              <MiniStat label={tt.week} value={fmtHm(weekTotalMinutes)} />
              <MiniStat label={tt.total} value={fmtHm(filteredTotalMinutes)} />
            </div>
            {proMode && (
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:6}}>
                  <MiniStat label={lang==='cz'?'průměr sezení':'avg session'} value={fmtHm(proStats.avg)} />
                  <MiniStat label="median" value={fmtHm(proStats.median)} />
                  <MiniStat label={lang==='cz'?'nejdelší streak':'best streak'} value={`${proStats.bestStreak}d`} />
                </div>
                <div className="card smallCard trendCardSmall" style={{marginTop:10}}>
                  <ProTrendCard sessions={filtered} lang={lang} />
                </div>
              </>
            )}
          </div>

          {/* Úkoly – samostatný blok v PRO režimu */}
          {proMode && (
            <div className="card tasksCard">
              <TasksCard lang={lang} />
            </div>
          )}

          {/* Zvyky v normálním režimu vpravo */}
          {!proMode && (
            <div className="card dark">
              <div className="sectionTitle">{tt.habits}</div>
              <HabitsCard
                lang={lang}
                habits={habits}
                onAdd={addHabit}
                onToggle={toggleHabit}
                onDelete={deleteHabitFn}
                onRename={renameHabit}
                weekDays={weekDays}
                streakFn={habitStreak}
              />
            </div>
          )}

          {/* Kalendář */}
          <div className="card">
            <CalendarCard sessions={sessions} lang={lang} />
          </div>
        </div>
      </div>

            {/* Login / Signup modal */}
      {showLoginModal && (
        <div
          className="modalBackdrop"
          onClick={()=>{
            setShowLoginModal(false);
            setAuthMode('login');
          }}
        >
          <div
            className="modalCard"
            onClick={e=>e.stopPropagation()}
          >
            <button
              className="closeX"
              onClick={()=>{
                setShowLoginModal(false);
                setAuthMode('login');
              }}
            >
              ✕
            </button>

            {authMode === 'login' ? (
              <>
                <div className="modalTitle">{tt.welcomeTo}</div>

                <div className="modalRow">
                  <label className="modalSectionLabel">{tt.emailLabel}</label>
                  <input
                    className="input"
                    value={loginEmail}
                    onChange={(e)=>setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="modalRow">
                  <label className="modalSectionLabel">{tt.passLabel}</label>
                  <input
                    className="input"
                    type="password"
                    value={loginPass}
                    onChange={(e)=>setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>

                <div className="modalActions" style={{justifyContent:'flex-end'}}>
                  <button className="btn" onClick={handleLogin}>{tt.loginBtn}</button>
                </div>

                <div style={{position:'absolute', left:16, right:16, bottom:10}}>
                  <div style={{display:'flex', alignItems:'center', gap:10, justifyContent:'flex-start', flexWrap:'wrap'}}>
                    <div className="muted" style={{fontSize:12}}>{tt.needAccountQ}</div>
                    <button
                      className="smallBtn primary"
                      onClick={()=>{
                        setAuthMode('signup');
                        setSignupEmail('');
                        setSignupPass('');
                        setSignupPass2('');
                      }}
                    >
                      {tt.signupBtn}
                    </button>
                  </div>
                  <div className="muted" style={{fontSize:11, marginTop:6}}>
                    {lang==='cz'
                      ? 'Pro návod klikni na „?“ vpravo nahoře.'
                      : 'For the tutorial click “?” top-right.'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="modalTitle">{tt.signupTitle}</div>

                <div className="modalRow">
                  <label className="modalSectionLabel">{tt.emailLabel}</label>
                  <input
                    className="input"
                    value={signupEmail}
                    onChange={(e)=>setSignupEmail(e.target.value)}
                    placeholder="new@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="modalRow">
                  <label className="modalSectionLabel">{tt.passLabel}</label>
                  <input
                    className="input"
                    type="password"
                    value={signupPass}
                    onChange={(e)=>setSignupPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <div className="modalRow">
                  <label className="modalSectionLabel">{tt.passAgainLabel}</label>
                  <input
                    className="input"
                    type="password"
                    value={signupPass2}
                    onChange={(e)=>setSignupPass2(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <div className="modalActions" style={{justifyContent:'space-between'}}>
                  <button
                    className="btn secondary"
                    onClick={()=>setAuthMode('login')}
                  >
                    {lang==='cz' ? 'zpět na přihlášení' : 'back to login'}
                  </button>
                  <button className="btn" onClick={handleSignup}>{tt.signupBtn}</button>
                </div>

                <div className="muted" style={{fontSize:11, marginTop:10}}>
                  {tt.signupInfo}
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* Tutorial modal */}
      {showTutorial && (
        <div className="modalBackdrop" onClick={()=>setShowTutorial(false)}>
          <div className="modalCard" onClick={e=>e.stopPropagation()}>
            <button className="closeX" onClick={()=>setShowTutorial(false)}>✕</button>
            <div className="modalTitle">{tt.tutorialTitle}</div>
            <div className="modalBodyScroll" style={{fontSize:13,lineHeight:1.5}}>
              {tutorialItems(lang).map((it, idx)=>(
                <p key={idx} style={{margin:'0 0 10px 0'}}><strong>{it.title}</strong> – {it.body}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout confirm */}
      {showLogoutConfirm && (
        <div className="modalBackdrop" onClick={()=>setShowLogoutConfirm(false)}>
          <div className="modalCard" onClick={e=>e.stopPropagation()}>
            <button className="closeX" onClick={()=>setShowLogoutConfirm(false)}>✕</button>
            <div className="modalTitle">{tt.logoutTitle}</div>
            <div className="logoutActions">
              <button className="btn secondary" onClick={()=>setShowLogoutConfirm(false)}>{tt.back}</button>
              <button className="btn" onClick={doLogout}>{tt.continue}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete project modal */}
      {deleteProjectCandidate && (
        <div className="modalBackdrop" onClick={()=>setDeleteProjectCandidate(null)}>
          <div className="modalCard" onClick={e=>e.stopPropagation()}>
            <button className="closeX" onClick={()=>setDeleteProjectCandidate(null)}>✕</button>
            <div className="modalTitle">
              {lang==='cz' ? 'Smazat projekt?' : 'Delete project?'}
            </div>
            <div style={{fontSize:13,lineHeight:1.5}}>
              {lang==='cz'
                ? <>Chceš smazat projekt „<strong>{deleteProjectCandidate}</strong>“? Můžeš také zvolit, zda smazat i jeho záznamy.</>
                : <>Do you want to delete the project “<strong>{deleteProjectCandidate}</strong>”? You can also choose whether to delete its sessions.</>}
            </div>
            <div className="modalActions" style={{justifyContent:'space-between',marginTop:16,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                <button
                  className="btn secondary"
                  onClick={()=>handleDeleteProject(deleteProjectCandidate, false)}
                >
                  {lang==='cz' ? 'smazat jen projekt' : 'delete project only'}
                </button>
                <button
                  className="btn"
                  onClick={()=>handleDeleteProject(deleteProjectCandidate, true)}
                >
                  {lang==='cz' ? 'smazat projekt a záznamy' : 'delete project + sessions'}
                </button>
              </div>
              <button className="iconBtn" onClick={()=>setDeleteProjectCandidate(null)}>
                {tt.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pomodoro Wheel picker overlay */}
      {pickerOpen && (
        <WheelPickerOverlay
          title={
            pickerOpen.type==='focus'
              ? (lang==='cz'?'Fokus (min)':'Focus (min)')
              : pickerOpen.type==='short'
                ? (lang==='cz'?'Krátká pauza (min)':'Short break (min)')
                : (lang==='cz'?'Dlouhá pauza (min)':'Long break (min)')
          }
          value={pickerOpen.value}
          min={pickerOpen.min}
          max={pickerOpen.max}
          anchor={pickerOpen.anchor}
          onSave={(val)=>{
            window.dispatchEvent(new CustomEvent('pomodoro-picker-save', { detail: { type: pickerOpen.type, value: val } }));
            setPickerOpen(null);
          }}
          onCancel={()=>{
            window.dispatchEvent(new CustomEvent('pomodoro-picker-cancel', { detail: { type: pickerOpen.type } }));
            setPickerOpen(null);
          }}
          themeHint={theme}
          cancelLabel={tt.cancel}
          saveLabel={tt.save}
        />
      )}

      {/* Project Wheel picker overlay (vždy nad stopkami) */}
      {projWheel && (
        <ProjectWheelPickerOverlay
          items={projects}
          initialIndex={projWheel.index}
          anchor={projWheel.anchor}
          lang={lang}
          onCancel={()=>setProjWheel(null)}
          onSelect={(idx:number)=>{
            const safe = Math.max(0, Math.min(projects.length-1, idx));
            const chosen = projects[safe];
            if(chosen) setActiveProject(chosen);
            setProjWheel(null);
          }}
          onDeleteCurrent={(idx:number)=>{
            const toDel = projects[idx];
            if(!toDel) return;
            setDeleteProjectCandidate(toDel);
            setProjWheel(null);
          }}
          onAddProject={(name:string)=>{
            const v = name.trim();
            if(!v) return;
            if(!projects.includes(v)){
              setProjects(prev=>[...prev, v]);
            }
            setActiveProject(v);
            setProjWheel(null);
          }}
        />
      )}
    </div>
  );
}

/* ===== Komponenty ===== */
function Stopwatch({
  onSave, tt, laps, setLaps
}:{
  onSave:(minutes:number, pausedMinutes:number)=>void;
  tt:ReturnType<typeof t>;
  laps:{totalSec:number;splitSec:number}[];
  setLaps:React.Dispatch<React.SetStateAction<{totalSec:number;splitSec:number}[]>>;
}) {
  const [state,setState]=useState<'idle'|'running'|'paused'>('idle');
  const [elapsedSec,setElapsedSec]=useState(0);
  const [pausedSec,setPausedSec]=useState(0);

  const tickRef=useRef<number|null>(null);
  const startRef=useRef<number|null>(null);

  const pauseTickRef=useRef<number|null>(null);
  const pauseStartRef=useRef<number|null>(null);

  const lastLapAtRef=useRef(0);

  const start=()=>{
    setState('running');
    startRef.current=Date.now()-elapsedSec*1000;
    tickRef.current=window.setInterval(()=>{
      if(!startRef.current) return;
      setElapsedSec(Math.floor((Date.now()-startRef.current)/1000));
    },250) as unknown as number;
    if(lastLapAtRef.current===0) lastLapAtRef.current=0;
  };

  const pause=()=>{
    if(tickRef.current) window.clearInterval(tickRef.current);
    setState('paused');
    pauseStartRef.current=Date.now();
    pauseTickRef.current=window.setInterval(()=>{
      if(!pauseStartRef.current) return;
      setPausedSec(prev=>prev);
    },250) as unknown as number;
  };

  const resume=()=>{
    if(pauseTickRef.current) window.clearInterval(pauseTickRef.current);
    if(pauseStartRef.current){
      const add=Math.floor((Date.now()-pauseStartRef.current)/1000);
      setPausedSec(s=>s+Math.max(0,add));
      pauseStartRef.current=null;
    }
    start();
  };

  const lap=()=>{
    const total=elapsedSec;
    const split=lastLapAtRef.current===0?total:total-lastLapAtRef.current;
    lastLapAtRef.current=total;
    setLaps(p=>[{totalSec:total,splitSec:Math.max(0,split)},...p]);
  };

  const stopSave=()=>{
    if(tickRef.current) window.clearInterval(tickRef.current);
    if(pauseTickRef.current) window.clearInterval(pauseTickRef.current);
    if(state==='paused'&&pauseStartRef.current){
      const add=Math.floor((Date.now()-pauseStartRef.current)/1000);
      setPausedSec(s=>s+Math.max(0,add));
      pauseStartRef.current=null;
    }
    const mins=Math.max(1,Math.round(elapsedSec/60));
    const pausedMins=Math.max(0,Math.round(pausedSec/60));
    onSave(mins,pausedMins);
    setElapsedSec(0);
    setPausedSec(0);
    setState('idle');
    startRef.current=null;
    lastLapAtRef.current=0;
    setLaps([]);
  };

  useEffect(()=>{
    return ()=>{
      if(tickRef.current) window.clearInterval(tickRef.current);
      if(pauseTickRef.current) window.clearInterval(pauseTickRef.current);
    };
  },[]);

  const hh = Math.floor(elapsedSec/3600).toString().padStart(2,'0');
  const mm = Math.floor((elapsedSec%3600)/60).toString().padStart(2,'0');
  const ss = (elapsedSec%60).toString().padStart(2,'0');
  const pm=Math.floor(pausedSec/60).toString().padStart(2,'0');
  const ps=(pausedSec%60).toString().padStart(2,'0');

  return (
    <>
      <div className="digits">
        <span className="digit">{hh}</span><span className="colon">:</span>
        <span className="digit">{mm}</span><span className="colon">:</span>
        <span className="digit">{ss}</span>
      </div>
      {state==='paused' && <div className="pauseHint">pause {pm}:{ps}</div>}
      <div className="controls">
        {state==='idle' && <button className="btn" onClick={start}>{tt.start}</button>}
        {state==='running' && (
          <>
            <button className="btn" onClick={pause}>{tt.pause}</button>
            <button className="btn secondary" onClick={lap}>{tt.setLap}</button>
            <button className="btn secondary" onClick={stopSave}>{tt.stopSave}</button>
          </>
        )}
        {state==='paused' && (
          <>
            <button className="btn" onClick={resume}>{tt.resume}</button>
            <button className="btn secondary" onClick={lap}>{tt.setLap}</button>
            <button className="btn secondary" onClick={stopSave}>{tt.stopSave}</button>
          </>
        )}
      </div>
    </>
  );
}

function LapsBlock({
  laps,
  tt,
}:{ laps:{totalSec:number;splitSec:number}[]; tt:ReturnType<typeof t> }){
  return (
    <div className="lapsUnder">
      <div className="sectionTitle" style={{marginTop:0}}>{tt.lapsTitle}</div>
      {laps.length===0
        ? <div className="muted">{tt.lapsEmpty}</div>
        : laps.map((l,i)=>(
            <div key={i} className="lapRow" style={{padding:'6px 0', borderBottom:'1px dashed var(--border)'}}>
              <span>{tt.lapLabel} {laps.length-i}</span>
              <span>{fmtMs(l.splitSec)} | tot {fmtMs(l.totalSec)}</span>
            </div>
          ))
      }
    </div>
  );
}

function PomodoroTimer({
  onSaveFocus, tt, openPicker, onPlaySound
}:{ onSaveFocus:(mins:number,label:string)=>void; tt:ReturnType<typeof t>;
   openPicker:(type:'focus'|'short'|'long', value:number, min:number, max:number, anchor:{x:number;y:number;w:number;h:number})=>void;
   onPlaySound:(kind:'focusEnd'|'breakEnd')=>void }) {
  const [focusMin, setFocusMin] = useState(25);
  const [shortBreakMin, setShortBreakMin] = useState(5);
  const [longBreakMin, setLongBreakMin] = useState(15);
  const [completed, setCompleted] = useState(0);
  const [phase, setPhase] = useState<'focus'|'short'|'long'>('focus');
  const [state,setState]=useState<'idle'|'running'|'paused'>('idle');
  const [remainingSec, setRemainingSec] = useState(focusMin*60);
  const tickRef=useRef<number|null>(null);

  useEffect(()=>{
    const onSave=(e:any)=>{
      const { type, value } = e.detail || {};
      if(type==='focus'){ setFocusMin(value); if(phase==='focus' && state==='idle') setRemainingSec(value*60); }
      if(type==='short'){ setShortBreakMin(value); if(phase==='short' && state==='idle') setRemainingSec(value*60); }
      if(type==='long'){ setLongBreakMin(value); if(phase==='long' && state==='idle') setRemainingSec(value*60); }
    };
    const onCancel=(_e:any)=>{};
    window.addEventListener('pomodoro-picker-save', onSave as any);
    window.addEventListener('pomodoro-picker-cancel', onCancel as any);
    return ()=>{
      window.removeEventListener('pomodoro-picker-save', onSave as any);
      window.removeEventListener('pomodoro-picker-cancel', onCancel as any);
    };
  },[phase,state]);

  useEffect(()=>{
    if(state==='idle'){
      setPhase('focus');
      setRemainingSec(focusMin*60);
    }
  },[focusMin,state]);

  const start=()=>{
    setState('running');
    tickRef.current=window.setInterval(()=>{
      setRemainingSec(prev=>{
        const next=prev-1;
        if(next<=0){
          window.clearInterval(tickRef.current!);
          tickRef.current=null;
          if(phase==='focus'){
            onSaveFocus(focusMin, `Pomodoro ${focusMin}m`);
            onPlaySound('focusEnd');
            const nextCompleted = completed+1;
            setCompleted(nextCompleted);
            if(nextCompleted%4===0){
              setPhase('long'); setRemainingSec(longBreakMin*60); setState('idle');
            }else{
              setPhase('short'); setRemainingSec(shortBreakMin*60); setState('idle');
            }
          }else{
            onPlaySound('breakEnd');
            setPhase('focus'); setRemainingSec(focusMin*60); setState('idle');
          }
          return 0;
        }
        return next;
      });
    },1000) as unknown as number;
  };

  const pause=()=>{
    if(tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current=null;
    setState('paused');
  };

  const resume=()=>{ if(state==='paused') start(); };

  const reset=()=>{
    if(tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current=null; setState('idle'); setPhase('focus'); setRemainingSec(focusMin*60); setCompleted(0);
  };

  const skip=()=>{
    if(tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current=null; setState('idle');
    if(phase==='focus'){ setPhase('short'); setRemainingSec(shortBreakMin*60); }
    else { setPhase('focus'); setRemainingSec(focusMin*60); }
  };

  useEffect(()=>()=>{ if(tickRef.current) window.clearInterval(tickRef.current); },[]);

  const mm = Math.floor(remainingSec/60).toString().padStart(2,'0');
  const ss = (remainingSec%60).toString().padStart(2,'0');
  const title = phase==='focus' ? tt.focus : (phase==='short'?tt.shortBreak:tt.longBreak);

  const openAt = (type:'focus'|'short'|'long', value:number, min:number, max:number) => (e:React.MouseEvent<HTMLSpanElement>)=>{
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    openPicker(type, value, min, max, { x:r.left, y:r.top + window.scrollY, w:r.width, h:r.height });
  };

  return (
    <>
      <div className="digits">
        <span className="digit">{mm}</span><span className="colon">:</span>
        <span className="digit">{ss}</span>
      </div>
      <div className="pauseHint">{title} · {tt.completed}: {completed}×</div>
      <div className="controls">
        {state==='idle' && <button className="btn" onClick={start}>{tt.start}</button>}
        {state==='running' && (
          <>
            <button className="btn" onClick={pause}>{tt.pause}</button>
            <button className="btn secondary" onClick={skip}>{tt.skip}</button>
            <button className="btn secondary" onClick={reset}>{tt.reset}</button>
          </>
        )}
        {state==='paused' && (
          <>
            <button className="btn" onClick={resume}>{tt.resume}</button>
            <button className="btn secondary" onClick={skip}>{tt.skip}</button>
            <button className="btn secondary" onClick={reset}>{tt.reset}</button>
          </>
        )}
      </div>

      {/* pilulky – ankory pro wheel pickery */}
      <div className="pomoNumbers" style={{ display:'flex', gap:8, justifyContent:'center', marginTop:10, flexWrap:'wrap' }}>
        <span className="pill" onClick={openAt('focus', focusMin, 1, 180)}>{tt.focus}: {focusMin}m</span>
        <span className="pill" onClick={openAt('short', shortBreakMin, 1, 60)}>{tt.shortBreak}: {shortBreakMin}m</span>
        <span className="pill" onClick={openAt('long', longBreakMin, 1, 120)}>{tt.longBreak}: {longBreakMin}m</span>
      </div>
    </>
  );
}
/* Ruční přidání – drag-to-adjust (širší lišta ~50% šířky footeru), magnety po 30 min */
function ManualAdd({ lang, onAdd }:{ lang:Lang; onAdd:(minutes:number)=>void }) {
  const tt = t(lang);
  const [adding,setAdding]=useState(false);
  const [val,setVal]=useState(60);
  const wrapRef=useRef<HTMLDivElement|null>(null);
  const barRef=useRef<HTMLDivElement|null>(null);
  const [dragging,setDragging]=useState(false);

  useEffect(()=>{
    const onDoc=(e:MouseEvent)=>{
      if(!adding) return;
      if(wrapRef.current && !wrapRef.current.contains(e.target as Node)){
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return ()=>document.removeEventListener('mousedown', onDoc);
  },[adding]);

  const totalMin=300;
  const toPct=(m:number)=> clamp(m/totalMin,0,1)*100;

  const softSnap=(m:number)=>{
    const nearest = Math.round(m/30)*30;
    return (Math.abs(nearest - m) <= 6) ? nearest : Math.max(1, Math.min(totalMin, m));
  };

  const setByClientX=(clientX:number)=>{
    if(!barRef.current) return;
    const r=barRef.current.getBoundingClientRect();
    const px=clamp(clientX - r.left, 0, r.width);
    const ratio= px / r.width;
    const mins = Math.round(ratio * totalMin);
    setVal(softSnap(mins));
  };

  useEffect(()=>{
    const up=()=>setDragging(false);
    const move=(e:MouseEvent)=>{ if(dragging) setByClientX(e.clientX); };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return ()=>{
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', move);
    };
  },[dragging]);

  if(!adding) return <button className="iconBtn" onClick={()=>setAdding(true)}>{tt.addManually}</button>;

  return (
    <div className="manualRow" ref={wrapRef}>
      <div className="manualWrap">
        <div
          className="dragBar"
          ref={barRef}
          onMouseDown={(e)=>{ setDragging(true); setByClientX(e.clientX); }}
          aria-label={lang==='cz'?'Ruční nastavení minut':'Manual minutes'}
          title={(lang==='cz'?'jemné přichytávání na 30 min · ':'gentle snapping to 30 min · ')+`${val}m`}
        >
          <div className="dragTics"/>
          <div
            className="dragHandle"
            style={{ left: `${toPct(val)}%` }}
            onMouseDown={(e)=>{ e.preventDefault(); setDragging(true); }}
          >
            {val}m
          </div>
        </div>
        <button className="iconBtn" onClick={()=>{ onAdd(Math.max(1,val)); setAdding(false); }}>{tt.save}</button>
        <button className="iconBtn" onClick={()=>{ setAdding(false); }}>{tt.cancel}</button>
      </div>
    </div>
  );
}

function RecentList({
  lang, sessions, onUpdate, onDelete,
}:{
  lang:Lang; sessions:Session[];
  onUpdate:(id:string,patch:Partial<Session>)=>void;
  onDelete:(id:string)=>void;
}){
  const tt = t(lang);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [draft,setDraft]=useState('');
  if(sessions.length===0) return <div className="muted">{tt.noData}</div>;

  const startEdit=(s:Session)=>{ setEditingId(s.id); setDraft(s.note??''); };
  const saveEdit=(id:string)=>{ onUpdate(id,{note:draft.trim()}); setEditingId(null); };

  return (
    <div className="recentList">
      {sessions.map((s) => {
        const d = parseISO(s.start);
        const paused = s.pausedMinutes && s.pausedMinutes > 0 ? ` (pause ${fmtHm(s.pausedMinutes)})` : '';
        const isEditing = editingId === s.id;
        return (
          <div key={s.id} className="recentRow">
            <span>
              {isEditing ? (
                <input
                  className="noteInput"
                  value={draft}
                  onChange={(e)=>setDraft(e.target.value)}
                  onKeyDown={(e)=>{ if(e.key==='Enter') saveEdit(s.id) }}
                  placeholder={lang==='cz'?'název/poznámka…':'title/note…'}
                />
              ) : (
                s.note && s.note.trim().length>0 ? s.note : <span className="muted">{tt.noTitle}</span>
              )}
            </span>
            <span>{format(d, lang==='cz'?'EEE dd.MM.':'EEE dd.MM.', { locale: lang==='cz'?cs:enUS })}</span>
            <span>{s.manual ? '—' : `${format(parseISO(s.start),'HH:mm')}–${format(parseISO(s.end),'HH:mm')}`}</span>
            <span>{fmtHm(s.minutes)}{paused}</span>
            <span className="iconGroup" style={{display:'flex',gap:6}}>
              {!isEditing
                ? <button className="iconBtn" onClick={()=>startEdit(s)}>{tt.edit}</button>
                : <>
                    <button className="iconBtn" onClick={()=>saveEdit(s.id)}>{tt.save}</button>
                    <button className="iconBtn danger" onClick={()=>onDelete(s.id)}>{tt.delete}</button>
                  </>
              }
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HabitsCard({
  lang, habits,onAdd,onToggle,onDelete,onRename,weekDays, streakFn,
}:{
  lang:Lang; habits:Habit[];
  onAdd:(n:string)=>void;
  onToggle:(id:string,day:number)=>void;
  onDelete:(id:string)=>void;
  onRename:(id:string,n:string)=>void;
  weekDays:string[];
  streakFn:(h:Habit)=>number;
}){
  const [newHabit,setNewHabit]=useState('');
  const [adding,setAdding]=useState(false);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [draftName,setDraftName]=useState('');
  const tt = t(lang);
  const daysLabels = t(lang).dowShortHabits;

  const startEdit=(h:Habit)=>{ setEditingId(h.id); setDraftName(h.name); };
  const save=(id:string)=>{ onRename(id,draftName.trim()); setEditingId(null); };

  // posledních 30 dní pro chain
  const lastNDates = useMemo(()=>{
    const out: string[] = [];
    let cur = startOfDay(new Date());
    for(let i=0;i<30;i++){ out.unshift(isoDayKey(cur)); cur = addDays(cur, -1); }
    return out;
  },[]);

  return (
    <div>
      <div className="habitsGrid" style={{marginBottom:6}}>
        <div></div>
        {daysLabels.map(d=><div key={d} className="habitsHead">{d}</div>)}
      </div>

      {habits.length===0 && <div className="muted" style={{marginBottom:8}}>{t(lang).noData}</div>}

      <div className="habitsGrid" style={{rowGap:6}}>
        {habits.map(h=>(
          <React.Fragment key={h.id}>
            <div className="habitName">
              {editingId===h.id ? (
                <>
                  <input className="habitInput" value={draftName}
                    onChange={e=>setDraftName(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter') save(h.id) }} />
                  <div className="habitActions" style={{display:'flex',gap:6}}>
                    <button className="iconBtn" onClick={()=>save(h.id)}>{t(lang).save}</button>
                    <button className="iconBtn danger" onClick={()=>onDelete(h.id)}>{t(lang).delete}</button>
                  </div>
                </>
              ) : (
                <>
                  <span>{h.name}</span>
                  <div className="habitActions" style={{display:'flex',gap:6}}>
                    <button className="iconBtn" onClick={()=>startEdit(h)}>{t(lang).edit}</button>
                  </div>
                </>
              )}
            </div>
            {weekDays.map((key,idx)=>{
              const checked = !!h.checks[key];
              return (
                <div key={key} className="dayCell">
                  <span className={'checkbox '+(checked?'checked':'')} onClick={()=>onToggle(h.id,idx)} />
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {!adding ? (
        <div style={{display:'flex',justifyContent:'flex-start',marginTop:12}}>
          <button className="btn" onClick={()=>setAdding(true)}>{tt.add}</button>
        </div>
      ) : (
        <div style={{display:'flex',gap:8,marginTop:12}}>
          <input className="input" placeholder={tt.newHabit}
            value={newHabit} onChange={e=>setNewHabit(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') { const v=newHabit.trim(); if(v){ onAdd(v); setNewHabit(''); setAdding(false);} } }} />
          <button className="btn" onClick={()=>{ const v=newHabit.trim(); if(v){ onAdd(v); setNewHabit(''); setAdding(false);} }}>{tt.save}</button>
        </div>
      )}

      {habits.length>0 && (
        <>
          <div className="habitStreaks" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8,marginTop:12}}>
            {habits.map(h=>(
              <div key={h.id} className="habitStreakCard">
                <span>{h.name}</span>
                <span className="habitStreakVal">{streakFn(h)}</span>
              </div>
            ))}
          </div>

          <div className="habitChains" style={{marginTop:10}}>
            {habits.map(h=>(
              <div key={h.id} className="chainRow">
                <div className="chainName">{h.name}</div>
                <div className="chainSquares" title={lang==='cz'?'posledních 30 dní':'last 30 days'}>
                  {lastNDates.map((k, i)=>{
                    const on = !!h.checks[k];
                    return <span key={i} className={'chainSq'+(on?' on':'')} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* Úkoly — přidána animace ✓ a krátké zpoždění před odstraněním */
function TasksCard({ lang }:{ lang:Lang }) {
  const storageKey = 'tasks_v1';
  const [tasks,setTasks] = useState<{id:string;text:string}[]>(()=>{
    try{ return JSON.parse(localStorage.getItem(storageKey)||'[]'); }catch{ return []; }
  });
  const [draft,setDraft]=useState('');
  const [animatingId,setAnimatingId] = useState<string|null>(null);
  useEffect(()=>{ localStorage.setItem(storageKey, JSON.stringify(tasks)) },[tasks]);

  const addTask=()=>{
    const v=draft.trim(); if(!v) return;
    setTasks(prev=>[...prev,{id:crypto.randomUUID(),text:v}]);
    setDraft('');
  };

  const toggleDone=(id:string)=>{
    setAnimatingId(id);
    // malé zpoždění pro zobrazení ✓ a fade-out
    setTimeout(()=>{
      setTasks(prev=>prev.filter(t=>t.id!==id));
      setAnimatingId(null);
    }, 220);
  };

  return (
    <div>
      <div className="sectionTitle" style={{marginBottom:8}}>{lang==='cz'?'Úkoly':'Tasks'}</div>
      <div className="tasksList">
        {tasks.map(t=>(
          <label key={t.id} className={'taskItem '+(animatingId===t.id?'taskFadeOut':'')}>
            <span
              className={'taskCheck '+(animatingId===t.id?'checked':'')}
              role="checkbox"
              aria-checked={animatingId===t.id?'true':'false'}
              tabIndex={0}
              onClick={()=>toggleDone(t.id)}
              onKeyDown={(e)=>{ if(e.key==='Enter'||e.key===' ') toggleDone(t.id) }}
            />
            <span className="taskLabel">{t.text}</span>
          </label>
        ))}
        {tasks.length===0 && <div className="muted" style={{fontSize:13}}>—</div>}
      </div>

      <div className="addRow">
        <input
          className="input"
          value={draft}
          onChange={e=>setDraft(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') addTask() }}
          placeholder={lang==='cz'?'nový úkol…':'new task…'}
        />
        <button className="btn" onClick={addTask}>{lang==='cz'?'přidat':'add'}</button>
      </div>
    </div>
  );
}

/* Kalendář */
function CalendarCard({sessions, lang}:{sessions:Session[]; lang:Lang}) {
  const [monthOffset,setMonthOffset]=useState(0);
  const base=new Date();
  const shown=new Date(base.getFullYear(), base.getMonth()+monthOffset, 1);

  const start=startOfWeek(startOfMonth(shown),{weekStartsOn:1});
  const end=endOfWeek(endOfMonth(shown),{weekStartsOn:1});
  const days:Date[]=[];
  for(let d=start; d<=end; d=addDays(d,1)) days.push(d);

  const minutesByKey=useMemo(()=>{
    const m=new Map<string,number>();
    for(const s of sessions){
      const k=isoDayKey(startOfDay(parseISO(s.start)));
      m.set(k,(m.get(k)||0)+s.minutes);
    }
    return m;
  },[sessions]);

  const hoursR=(mins:number)=>Math.round((mins/60)*2)/2;
  const color=(h:number)=> h<=0.5?'cal0':h<=1?'cal1':h<=3?'cal2':'cal3';

  return (
    <div>
      <div className="calendarHeader">
        <button className="weekBtn" onClick={()=>setMonthOffset(o=>o-1)}>◄</button>
        <div className="sectionTitle" style={{margin:0}}>{t(lang).calendarMonth}</div>
        <div className="muted">{t(lang).monthLabel(shown)}</div>
        <button className="weekBtn" onClick={()=>setMonthOffset(o=>o+1)}>►</button>
      </div>
      <div className="calendarGrid" style={{overflow:'hidden'}}>
        {(lang==='cz'?['Po','Út','St','Čt','Pá','So','Ne']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map(d=><div key={d} className="calHead">{d}</div>)}
        {days.map(d=>{
          const key=isoDayKey(d);
          const mins=minutesByKey.get(key)||0;
          const hrs=hoursR(mins);
          const inMonth=d.getMonth()===shown.getMonth();
          return (
            <div key={key} className={`calCell ${hrs>0?color(hrs):''}`} style={{opacity:inMonth?1:0.35}}>
              <div className="dayNum">{format(d,'d')}</div>
              <div className="hours">{hrs>0?`${hrs}h`:''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* PRO Trend Card */
function ProTrendCard({ sessions, lang }:{ sessions: Session[]; lang:Lang }) {
  const [mode,setMode]=useState<'week'|'month'>('week');

  const data = useMemo(()=>{
    const today = startOfDay(new Date());
    const days:number[]=[];
    const labels:string[]=[];
    const len = mode==='week'? 7 : 30;
    for(let i=len-1;i>=0;i--){
      const d=addDays(today,-i);
      labels.push(format(d,'dd.MM.'));
      const mins = sessions
        .filter(s=>isSameDay(startOfDay(parseISO(s.start)), d))
        .reduce((a,b)=>a+b.minutes,0);
      days.push(mins);
    }
    return { labels, days };
  },[sessions, mode]);

  const width=560, height=90, pad=12;
  const maxVal = Math.max(60, ...data.days);
  const points = data.days.map((v,i)=>{
    const x = pad + (i*(width-2*pad))/(data.days.length-1 || 1);
    const y = height - pad - (v/maxVal)*(height-2*pad);
    return {x,y,v, label:data.labels[i]};
  });

  const pathD = points.map((p,i)=> (i===0?`M ${p.x},${p.y}`:`L ${p.x},${p.y}`)).join(' ');

  return (
    <div>
      <div className="sectionTitle" style={{marginBottom:4}}>
        {lang==='cz' ? 'trend aktivity' : 'activity trend'} {mode==='week' ? (lang==='cz'?'(týden)':'(week)') : (lang==='cz'?'(měsíc)':'(month)')}
      </div>
      <svg className="trendSvg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
        <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="2"/>
        {points.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3.2} fill="#f59e0b">
              <title>{p.label} · {fmtHm(p.v)}</title>
            </circle>
          </g>
        ))}
      </svg>
      <div className="trendToggle">
        <button className="iconBtn" onClick={()=>setMode('week')}>{lang==='cz'?'týden':'week'}</button>
        <button className="iconBtn" onClick={()=>setMode('month')}>{lang==='cz'?'měsíc':'month'}</button>
      </div>
    </div>
  );
}

function WeekHistogram({ bars }:{ bars:{dayLabel:string;minutes:number;height:number}[] }){
  const labs=['po','út','st','čt','pá','so','ne'];
  return (
    <div>
      <div className="weekbar smallWeek">
        {bars.map((b,i)=>{
          const h = Math.max(2, Math.round((b.minutes/360)*52));
          const tooltip = `${labs[i]}: ${Math.floor(b.minutes/60)}h ${b.minutes%60}m`;
          return (
            <div key={i} className="wcolSmall" title={tooltip}>
              <div className="wbar" style={{height:h}}/>
            </div>
          );
        })}
      </div>
      <div className="mini" style={{display:'grid',gridTemplateColumns:'repeat(7,0.5fr)',textAlign:'center',marginTop:6,columnGap:2,fontSize:12,color:'var(--text-muted)'}}>
        {labs.map(d=><span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

function MiniStat({label,value}:{label:string;value:string}){
  return (
    <div className="minicard">
      <div className="mini" style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:'var(--text)'}}>{value}</div>
    </div>
  );
}

function LevelCard({ totalMinutes, tt }:{ totalMinutes:number; tt:ReturnType<typeof t> }) {
  const seg: {label:string; durMin:number}[] = [];
  const add=(tier:string,h:number)=>['III','II','I'].forEach(r=>seg.push({label:`${tier} ${r}`,durMin:h*60}));
  add('Bronze',2); add('Silver',3); add('Gold',4); add('Diamond',6);
  const total=seg.reduce((a,b)=>a+b.durMin,0);

  let idx=seg.length-1, start=total-seg[seg.length-1].durMin, span=seg[seg.length-1].durMin;
  if(totalMinutes<total){
    let cum=0;
    for(let i=0;i<seg.length;i++){
      const s=seg[i];
      if(totalMinutes<cum+s.durMin){ idx=i; start=cum; span=s.durMin; break; }
      cum+=s.durMin;
    }
  }
  const cur=seg[idx];
  const pct=Math.round((totalMinutes>=total?1:Math.min(1,Math.max(0,(totalMinutes-start)/span)))*100);
  const toNext=Math.max(0,Math.round(span-(totalMinutes-start)));

  return (
    <div>
      <div className="levelTitle">{tt.level}</div>
      <div className="levelTitle" style={{fontSize:18,fontWeight:800,marginBottom:6,color:'var(--text)'}}>
        {totalMinutes>=total?'Diamond I':cur.label}
      </div>
      <div className="levelProgressOuter"><div className="levelProgressFill" style={{width: `${pct}%`}} /></div>
      <div className="levelMeta"><span>{pct}%</span><span>{fmtHm(totalMinutes)}</span></div>
      {totalMinutes<total ? (
        <div className="muted" style={{marginTop:4}}>{tt.toNext}: {fmtHm(toNext)}</div>
      ) : (
        <div className="muted" style={{marginTop:4}}>{tt.maxReached}</div>
      )}
    </div>
  );
}

/* ProjectWheelPickerOverlay — klik na položku = vybrat, snap až na 1. i poslední + přidání projektu uvnitř */
type Anchor = { x:number; y:number; w:number; h:number };

function ProjectWheelPickerOverlay(props: {
  items: string[];
  initialIndex: number;
  anchor: Anchor;
  lang: Lang;
  onSelect: (idx: number) => void;
  onDeleteCurrent: (idx: number) => void;
  onAddProject: (name: string) => void;
  onCancel: () => void;
}) {
  const { items, initialIndex, anchor, lang, onSelect, onDeleteCurrent, onAddProject, onCancel } = props;

  const tt = t(lang);
  const projects = items || [];
  const itemH = 34;
  const visible = 3;
  const pad = (visible - 1) / 2;

  const [index, setIndex] = React.useState<number>(Math.max(0, Math.min(projects.length-1, initialIndex||0)));
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = React.useState<{ left: number; top: number }>({ left: anchor.x, top: anchor.y + anchor.h + 8 });
  const [newName, setNewName] = React.useState('');

  React.useEffect(() => {
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const desiredLeft = Math.min(Math.max(anchor.x + anchor.w / 2 - 140, margin), vw - 280 - margin);
    const desiredTop = Math.min(anchor.y + anchor.h + 8 - window.scrollY, vh - (itemH * visible + 90 + margin));
    setPos({ left: desiredLeft, top: desiredTop });
  }, [anchor.x, anchor.y, anchor.w, anchor.h]);

  // při otevření zarovnat vybraný doprostřed
  React.useEffect(() => {
    if (!listRef.current) return;
    const idx = index + pad;
    listRef.current.scrollTop = idx * itemH - (listRef.current.clientHeight / 2 - itemH / 2);
  }, []); // eslint-disable-line

  // snapping dovolí i úplně první / poslední (opravená matematika středu)
  React.useEffect(() => {
    let tHandle: any = null;
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      if (tHandle) clearTimeout(tHandle);
      tHandle = setTimeout(() => {
        const center = el.scrollTop + el.clientHeight / 2;
        const raw = (center - itemH / 2) / itemH;
        const nearest = Math.round(raw);
        const minIdx = pad;
        const maxIdx = pad + (projects.length - 1);
        const clamped = Math.max(minIdx, Math.min(maxIdx, nearest));
        const newIndex = clamped - pad;
        setIndex(newIndex);
        el.scrollTo({
          top: clamped * itemH - (el.clientHeight / 2 - itemH / 2),
          behavior: 'smooth',
        });
      }, 80);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); if (tHandle) clearTimeout(tHandle); };
  }, [projects.length, pad]);

  const renderItem = (name: string, i: number) => {
    const activeIdx = i === index;
    return (
      <div
        key={name}
        className="wheelItem"
        onClick={() => { setIndex(i); onSelect(i); onCancel(); }}
        style={{
          height: itemH,
          fontSize: 15,
          fontWeight: 800,
          opacity: activeIdx ? 1 : 0.6,
          transform: activeIdx ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform .08s ease, opacity .08s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          userSelect: 'none',
          textAlign: 'center',
          padding: '0 8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: 'pointer'
        }}
        title={name}
      >
        <span style={{ width: 10, color: 'var(--accent)', visibility: activeIdx ? 'visible' : 'hidden' }}>&gt;</span>
        <span>{name}</span>
      </div>
    );
  };

  const handleAdd = () => {
    const v = newName.trim();
    if (!v) return;
    onAddProject(v);
    setNewName('');
  };

  const selectLabel = lang === 'cz' ? 'vybrat' : 'select';

  return (
    <div className="wheelOverlay" style={{ zIndex: 10060 }}>
      <div className="wheelBackdrop" onClick={onCancel} />
      <div
        className="wheelCard"
        style={{
          left: pos.left,
          top: pos.top,
          width: 280,
          background: 'var(--panel-strong)',
          padding: '8px 0 10px 0',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: '0 14px 34px rgba(0,0,0,.45)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="wheelList" ref={listRef} style={{ height: itemH * visible, padding: '0 8px' }}>
          {Array.from({ length: pad }).map((_, i) => (<div key={'pt-'+i} style={{ height: itemH }} />))}
          {projects.map((p, i) => renderItem(p, i))}
          {Array.from({ length: pad }).map((_, i) => (<div key={'pb-'+i} style={{ height: itemH }} />))}
        </div>

        {/* přidání projektu přímo ve wheelpickeru */}
        <div
          style={{
            padding: '8px 10px 4px 10px',
            borderTop: '1px solid var(--border)',
            marginTop: 6
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className="input"
              style={{ fontSize: 13, padding: '6px 8px' }}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder={lang==='cz' ? 'nový projekt…' : 'new project…'}
            />
            <button className="iconBtn" onClick={handleAdd}>{tt.add}</button>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', gap:8, padding:'6px 10px 0 10px', flexWrap:'wrap' }}>
          <button className="iconBtn danger" onClick={() => onDeleteCurrent(index)}>{tt.delete}</button>
          <div style={{ display:'flex', gap:8 }}>
            <button className="iconBtn" onClick={onCancel}>{tt.cancel}</button>
            <button className="iconBtn" onClick={() => { onSelect(index); onCancel(); }}>
              {selectLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* Wheel Picker Overlay — Pomodoro (umožní vybrat i min/max, klik vybírá) */
function WheelPickerOverlay({
  title, value, min, max, anchor, onSave, onCancel, themeHint, cancelLabel, saveLabel
}:{ title:string; value:number; min:number; max:number;
   anchor:{x:number;y:number;w:number;h:number};
   onSave:(v:number)=>void; onCancel:()=>void; themeHint:'brown'|'mono'; cancelLabel:string; saveLabel:string }){

  const listRef = React.useRef<HTMLDivElement|null>(null);
  const [val,setVal]=React.useState(value);

  const itemH=28;
  const visible=3;
  const pad=(visible-1)/2;

  const [pos,setPos]=React.useState<{left:number;top:number}>({left:anchor.x, top:anchor.y+anchor.h+8});
  React.useEffect(()=>{
    const margin=8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const desiredLeft = Math.min(Math.max(anchor.x + anchor.w/2 - 90, margin), vw - 180 - margin);
    const desiredTop  = Math.min(anchor.y + anchor.h + 8 - window.scrollY, vh - (itemH*visible + 56 + margin));
    setPos({ left: desiredLeft, top: desiredTop });
  },[anchor.x,anchor.y,anchor.w,anchor.h]);

  // při otevření zarovnat
  React.useEffect(()=>{
    if(!listRef.current) return;
    const idx = (val-min)+pad;
    listRef.current.scrollTop = idx*itemH - (listRef.current.clientHeight/2 - itemH/2);
  },[]); // eslint-disable-line

  // robustní snapping (umožní vybrat i min / max, opravený střed)
  React.useEffect(()=>{
    let tHandle:any=null;
    const el=listRef.current;
    if(!el) return;
    const onScroll=()=>{
      if(tHandle) clearTimeout(tHandle);
      tHandle=setTimeout(()=>{
        const center = el.scrollTop + el.clientHeight/2;
        const raw = (center - itemH/2) / itemH;
        const nearest = Math.round(raw);
        const minIdx = pad;
        const maxIdx = pad + (max - min);
        const clamped = Math.max(minIdx, Math.min(maxIdx, nearest));
        const newVal = (clamped - pad) + min;
        setVal(newVal);
        el.scrollTo({
          top: clamped*itemH - (el.clientHeight/2 - itemH/2),
          behavior:'smooth'
        });
      }, 80);
    };
    el.addEventListener('scroll', onScroll, { passive:true });
    return ()=>{ el.removeEventListener('scroll', onScroll); if(tHandle) clearTimeout(tHandle); };
  },[min,max,pad]);

  const bg = themeHint==='brown' ? 'rgba(24,16,12,.72)' : 'rgba(20,20,20,.72)';

  const renderItem = (v:number)=>{
    const active = v===val;
    return (
      <div key={v}
        className="wheelItem"
        onClick={()=>setVal(v)}
        style={{
          height:itemH,
          fontSize:15,
          fontWeight:800,
          opacity: active?1:0.6,
          transform: active?'scale(1.14)':'scale(1)',
          userSelect:'none',
          transition:'transform .08s ease, opacity .08s ease',
          textAlign:'center',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          gap:6,
          cursor:'pointer'
        }}
      >
        <span style={{width:10, color:'var(--accent)', visibility: active?'visible':'hidden'}}>&gt;</span>
        <span>{v}</span>
      </div>
    );
  };

  return (
    <div className="wheelOverlay">
      <div className="wheelBackdrop" onClick={onCancel} />
      <div
        className="wheelCard"
        style={{
          left: pos.left, top: pos.top,
          width:180,
          background:bg,
          padding:'8px 0 10px 0',
          border:'1px solid var(--border)',
          borderRadius:14,
          boxShadow:'0 14px 34px rgba(0,0,0,.45)'
        }}
        onClick={e=>e.stopPropagation()}
      >
        <div className="wheelTitle" style={{fontWeight:700, marginBottom:4, textAlign:'center'}}>{title}</div>
        <div
          className="wheelList"
          ref={listRef}
          onWheel={e=>{ e.stopPropagation(); }}
          style={{ height: itemH*visible, padding: '0 8px' }}
        >
          {Array.from({length:pad}).map((_,i)=><div key={'p-top-'+i} style={{height:itemH}} />)}
          {Array.from({length:(max-min+1)}).map((_,i)=>renderItem(min+i))}
          {Array.from({length:pad}).map((_,i)=><div key={'p-bot-'+i} style={{height:itemH}} />)}
        </div>
        <div className="wheelActions" style={{display:'flex', gap:8, justifyContent:'flex-end', padding:'6px 10px 0 10px'}}>
          <button className="iconBtn" onClick={onCancel}>{cancelLabel}</button>
          <button className="iconBtn" onClick={()=>onSave(val)}>{saveLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ===== výpočty ===== */
function computeWeekBars(sessions: Session[], start: Date){
  const s=startOfWeek(start,{weekStartsOn:1});
  const e=endOfWeek(start,{weekStartsOn:1});
  const days:Date[]=[];
  for(let d=s; d<=e; d=addDays(d,1)) days.push(d);

  const minsPerDay=days.map(day=>{
    return sessions
      .filter(x=>isSameDay(startOfDay(parseISO(x.start)),day))
      .reduce((acc,b)=>acc+b.minutes,0);
  });

  const bars=minsPerDay.map((m,i)=>({
    dayLabel:format(addDays(s,i),'EEE'),
    minutes:m,
    height:clamp(m/360,0,1)
  }));
  return bars;
}

function computeStreakDays(all: Session[]){
  if(all.length===0) return 0;
  const map=new Map<string,number>();
  for(const s of all){
    const k=isoDayKey(startOfDay(parseISO(s.start)));
    map.set(k,(map.get(k)||0)+s.minutes);
  }
  let c=0;
  let cur=startOfDay(new Date());
  while(true){
    const k=isoDayKey(cur);
    const studied=(map.get(k)||0)>0;
    if(!studied) break;
    c++;
    cur=addDays(cur,-1);
  }
  return c;
}

function computeStreakDaysAllTime(all: Session[]){
  if(all.length===0) return 0;
  const presentDays: string[] = [];
  const seen: Record<string,1> = {};
  for(const s of all){
    const k=isoDayKey(startOfDay(parseISO(s.start)));
    if(!seen[k]){ seen[k]=1; presentDays.push(k); }
  }
  presentDays.sort();
  let best=0, cur=0, last:string|undefined;
  for(const k of presentDays){
    if(!last){ cur=1; best=Math.max(best,cur); last=k; continue; }
    const dPrev = parseISO(last);
    const dCur = parseISO(k);
    const diffDays = Math.round((startOfDay(dCur).getTime()-startOfDay(dPrev).getTime())/86400000);
    if(diffDays===1){ cur+=1; } else { cur=1; }
    best=Math.max(best,cur);
    last=k;
  }
  return best;
}

/* ===== typy export (pokud ho budeš chtít) ===== */
export type { Session, Habit, Lang };
