#!/usr/bin/env node
// build-data.mjs — Scraper + downloader for PM Shooter weapons catalog
// Fetches arsenal page, downloads thumbnails, writes weapons.json
// Usage: node scripts/build-data.mjs

import { writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const IMAGES_DIR = join(ROOT, 'images');
const OUT_JSON = join(ROOT, 'weapons.json');

const ARSENAL_URL = 'https://www.pmshooter.pl/index.php/pl/arsenal';
const BASE = 'https://www.pmshooter.pl/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
const PLN_TO_EUR = 0.23; // aproximado abril 2026

// --- PRECIOS POR CALIBRE (fallback cuando el arma no está nombrada explícitamente) ---
const PRICE_BY_CALIBER = {
  '.22 LR':          2,
  '.22 LR subsonic': 3,
  '.22 WMR':         6,
  '7.65 Browning':   5,
  '9mm Short':       5,
  '9mm Makarov':     5,
  '9mm Para':        3,
  '10mm Auto':       6,
  '.45 ACP':         5,
  '.38 Special':     6,
  '.357 Magnum':     6,
  '.44 Magnum':      8,
  '.454 Casull':    30,
  '.460 S&W':       30,
  '.45 Colt / .410':10,
  '.223 Rem':        5,
  '5.45x39mm':       6,
  '7.62x39mm':       5,
  '7.62x38R':       15,
  '7.62x25 Tokarev': 5,
  '7.62x51mm NATO':  8,
  '7.62x54mmR':      8,
  '7.92x57 Mauser':  8,
  '7.5x55 Swiss':   10,
  '.30 Carbine':     8,
  '.303 British':    8,
  '.30-06':         15,
  '45-70 Govt':     50,
  '5.7x28mm':       25,
  'Shotgun 12ga':    7,
};

// --- METADATA DE LAS 168 ARMAS ---
// Clave: slug (del filename del info png: arsenal_info/<slug>_opis.png)
// Valor: { name, category, caliber, explicit? (precio en PLN si está nombrada en la oferta) }
const WEAPONS_META = {
  // ============ MAŁOKALIBROWA (.22) ============
  ruger22:    { name: 'Ruger MK .22',           category: 'Pistola',      caliber: '.22 LR' },
  swvictory:  { name: 'S&W Victory',            category: 'Pistola',      caliber: '.22 LR' },
  margolin:   { name: 'Margolin',               category: 'Pistola',      caliber: '.22 LR' },
  force:      { name: 'Force .22',              category: 'Pistola',      caliber: '.22 LR' },
  bersa:      { name: 'Bersa .22',              category: 'Pistola',      caliber: '.22 LR' },
  buckmark:   { name: 'Browning Buckmark',      category: 'Pistola',      caliber: '.22 LR' },
  cp33:       { name: 'KelTec CP33 (supresor)', category: 'Pistola',      caliber: '.22 LR subsonic', explicit: 3 },
  swmp15:     { name: 'S&W M&P15-22',           category: 'Rifle',        caliber: '.22 LR' },
  tipmann:    { name: 'Tippmann M4-22',         category: 'Rifle',        caliber: '.22 LR' },
  berylM22:   { name: 'Beryl M22',              category: 'Rifle',        caliber: '.22 LR' },
  cz512:      { name: 'CZ 512',                 category: 'Rifle',        caliber: '.22 LR' },
  cz513:      { name: 'CZ 513',                 category: 'Rifle',        caliber: '.22 LR' },
  toz:        { name: 'TOZ-78',                 category: 'Rifle',        caliber: '.22 LR' },
  baikal161:  { name: 'Baikal 161',             category: 'Rifle',        caliber: '.22 LR' },
  rascal:     { name: 'Savage Rascal',          category: 'Rifle',        caliber: '.22 LR' },
  cmr30:      { name: 'KelTec CMR30',           category: 'Carabina',     caliber: '.22 WMR', explicit: 6 },
  wrangler:   { name: 'Ruger Wrangler',         category: 'Revólver',     caliber: '.22 LR' },

  // ============ BOJOWA (combate) ============
  // --- Pistolas ---
  xfive:          { name: 'SIG Sauer X-Five',        category: 'Pistola',  caliber: '9mm Para', explicit: 6 },
  browning_hp:    { name: 'Browning High Power',     category: 'Pistola',  caliber: '9mm Para' },
  colt911:        { name: 'Colt 1911',               category: 'Pistola',  caliber: '.45 ACP', explicit: 5 },
  scandium:       { name: 'S&W Scandium',            category: 'Revólver', caliber: '.45 ACP', explicit: 6 },
  tt:             { name: 'Tokarev TT-33',           category: 'Pistola',  caliber: '7.62x25 Tokarev' },
  luger:          { name: 'Luger P08',               category: 'Pistola',  caliber: '9mm Para', explicit: 10 },
  husqvarna:      { name: 'Husqvarna m/40',          category: 'Pistola',  caliber: '9mm Para' },
  p38:            { name: 'Walther P38',             category: 'Pistola',  caliber: '9mm Para', explicit: 4 },
  ppk:            { name: 'Walther PPK',             category: 'Pistola',  caliber: '7.65 Browning' },
  beretta84:      { name: 'Beretta 84 FS',           category: 'Pistola',  caliber: '9mm Short', explicit: 5 },
  beretta92:      { name: 'Beretta 92',              category: 'Pistola',  caliber: '9mm Para' },
  usp_std:        { name: 'HK USP',                  category: 'Pistola',  caliber: '9mm Para' },
  glock17_gen3:   { name: 'Glock 17 Gen 3',          category: 'Pistola',  caliber: '9mm Para' },
  glock17_gen4:   { name: 'Glock 17 Gen 4',          category: 'Pistola',  caliber: '9mm Para' },
  glock17c:       { name: 'Glock 17C',               category: 'Pistola',  caliber: '9mm Para', explicit: 4 },
  glock19:        { name: 'Glock 19',                category: 'Pistola',  caliber: '9mm Para' },
  glock20:        { name: 'Glock 20',                category: 'Pistola',  caliber: '10mm Auto', explicit: 6 },
  vis100:         { name: 'VIS 100',                 category: 'Pistola',  caliber: '9mm Para' },
  xdm9:           { name: 'Springfield XDM9',        category: 'Pistola',  caliber: '9mm Para' },
  bul:            { name: 'Bul',                     category: 'Pistola',  caliber: '9mm Para', explicit: 4 },
  Strike_one:     { name: 'Strike One (Strizh)',     category: 'Pistola',  caliber: '9mm Para' },
  mp9:            { name: 'B&T MP9',                 category: 'Pistola',  caliber: '9mm Para' },
  jericho941:     { name: 'Jericho 941',             category: 'Pistola',  caliber: '9mm Para' },
  browningm1900:  { name: 'Browning M1900',          category: 'Pistola',  caliber: '7.65 Browning' },
  bersaTP9:       { name: 'Bersa TP9',               category: 'Pistola',  caliber: '9mm Para' },
  shadow:         { name: 'CZ 75 Shadow',            category: 'Pistola',  caliber: '9mm Para', explicit: 4 },
  ruger_comp:     { name: 'Ruger Competition',       category: 'Pistola',  caliber: '9mm Para' },
  steyrL9:        { name: 'Steyr L9',                category: 'Pistola',  caliber: '9mm Para' },
  steyrM9:        { name: 'Steyr M9',                category: 'Pistola',  caliber: '9mm Para' },
  czp10:          { name: 'CZ P-10',                 category: 'Pistola',  caliber: '9mm Para' },
  p10c:           { name: 'CZ P-10 C',               category: 'Pistola',  caliber: '9mm Para' },
  masada:         { name: 'IWI Masada',              category: 'Pistola',  caliber: '9mm Para' },
  apx:            { name: 'Beretta APX',             category: 'Pistola',  caliber: '9mm Para' },
  sig232_opis_pl: { name: 'SIG P232',                category: 'Pistola',  caliber: '9mm Short' },
  pa63:           { name: 'PA-63',                   category: 'Pistola',  caliber: '9mm Makarov' },
  makarov:        { name: 'Makarov PM',              category: 'Pistola',  caliber: '9mm Makarov' },
  cz70:           { name: 'CZ 70',                   category: 'Pistola',  caliber: '7.65 Browning' },
  zastava70:      { name: 'Zastava M70',             category: 'Pistola',  caliber: '7.65 Browning' },
  pdp:            { name: 'Walther PDP',             category: 'Pistola',  caliber: '9mm Para' },
  waltherp99:     { name: 'Walther P99',             category: 'Pistola',  caliber: '9mm Para' },
  canik:          { name: 'Canik TP9',               category: 'Pistola',  caliber: '9mm Para' },
  rex:            { name: 'Arex Rex Zero 1',         category: 'Pistola',  caliber: '9mm Para' },
  p225:           { name: 'SIG P225',                category: 'Pistola',  caliber: '9mm Para' },
  sigp226:        { name: 'SIG P226',                category: 'Pistola',  caliber: '9mm Para' },
  sig320:         { name: 'SIG P320',                category: 'Pistola',  caliber: '9mm Para' },
  falcon9xc:      { name: 'Falcon 9XC',              category: 'Pistola',  caliber: '9mm Para' },
  fn509:          { name: 'FN 509',                  category: 'Pistola',  caliber: '9mm Para' },
  fn1910:         { name: 'FN 1910',                 category: 'Pistola',  caliber: '7.65 Browning' },
  lonewolf:       { name: 'Lone Wolf',               category: 'Pistola',  caliber: '9mm Para' },
  k100:           { name: 'Kahr K100',               category: 'Pistola',  caliber: '9mm Para' },
  q100:           { name: 'Kahr Q100',               category: 'Pistola',  caliber: '9mm Para' },
  desertgolden:   { name: 'Desert Eagle Golden',     category: 'Pistola',  caliber: '.44 Magnum', explicit: 50 },
  sauersohn:      { name: 'Sauer & Sohn 38H',        category: 'Pistola',  caliber: '7.65 Browning' },

  // --- Revólveres ---
  rhino:         { name: 'Chiappa Rhino Gold',       category: 'Revólver', caliber: '.38 Special', explicit: 10 },
  taurus460:     { name: 'Taurus 460',               category: 'Revólver', caliber: '.460 S&W', explicit: 30 },
  redhawk:       { name: 'Ruger Redhawk',            category: 'Revólver', caliber: '.44 Magnum' },
  gp100:         { name: 'Ruger GP100',              category: 'Revólver', caliber: '.357 Magnum' },
  bfr:           { name: 'Magnum Research BFR',      category: 'Revólver', caliber: '45-70 Govt', explicit: 50 },
  raginghunter:  { name: 'Taurus Raging Hunter',     category: 'Revólver', caliber: '.44 Magnum' },
  smith44long:   { name: 'S&W .44',                  category: 'Revólver', caliber: '.44 Magnum' },
  ruger44magnum: { name: 'Ruger .44 Magnum',         category: 'Revólver', caliber: '.44 Magnum' },
  judge:         { name: 'Taurus Judge',             category: 'Revólver', caliber: '.45 Colt / .410' },
  navy:          { name: 'Navy Colt (replica)',      category: 'Revólver', caliber: '.38 Special' },
  nagant:        { name: 'Nagant M1895',             category: 'Revólver', caliber: '7.62x38R', explicit: 15 },

  // --- Rifles / Carabinas ---
  berettastorm:  { name: 'Beretta CX4 Storm',        category: 'Carabina', caliber: '9mm Para', explicit: 5 },
  sub2000:       { name: 'Kel-Tec SUB-2000',         category: 'Carabina', caliber: '9mm Para' },
  lfa_chal:      { name: 'LFA Challenge',            category: 'Carabina', caliber: '9mm Para' },
  pcc:           { name: 'Ruger PCC',                category: 'Carabina', caliber: '9mm Para', explicit: 5 },
  M16:           { name: 'M16',                      category: 'Rifle',    caliber: '.223 Rem', explicit: 8 },
  m4sw:          { name: 'S&W M&P15 (M4)',           category: 'Rifle',    caliber: '.223 Rem' },
  zion:          { name: 'Springfield Saint',        category: 'Rifle',    caliber: '.223 Rem' },
  haenel:        { name: 'Haenel CR223',             category: 'Rifle',    caliber: '.223 Rem', explicit: 8 },
  mutant:        { name: 'SIG Mutant',               category: 'Rifle',    caliber: '7.62x39mm', explicit: 6 },
  sig510:        { name: 'SIG 510 / K31',            category: 'Rifle',    caliber: '7.5x55 Swiss', explicit: 10 },
  fnfal:         { name: 'FN FAL',                   category: 'Rifle',    caliber: '7.62x51mm NATO', explicit: 10 },
  g3:            { name: 'HK G3',                    category: 'Rifle',    caliber: '7.62x51mm NATO', explicit: 10 },
  hk11:          { name: 'HK 11',                    category: 'Rifle',    caliber: '7.62x51mm NATO', explicit: 10 },
  galil:         { name: 'IWI Galil',                category: 'Rifle',    caliber: '.223 Rem' },
  saiga102:      { name: 'Saiga 102',                category: 'Rifle',    caliber: '7.62x39mm' },
  tantal:        { name: 'Tantal wz.88',             category: 'Rifle',    caliber: '5.45x39mm' },
  beryls762:     { name: 'Beryl S762',               category: 'Rifle',    caliber: '7.62x39mm', explicit: 6 },
  sadu:          { name: 'SADU',                     category: 'Rifle',    caliber: '7.62x39mm' },
  hk243:         { name: 'HK 243',                   category: 'Rifle',    caliber: '.223 Rem' },
  sl8:           { name: 'HK SL8',                   category: 'Rifle',    caliber: '.223 Rem', explicit: 6 },
  mosin:         { name: 'Mosin-Nagant',             category: 'Rifle',    caliber: '7.62x54mmR', explicit: 8 },
  kar98:         { name: 'Mauser Kar98k',            category: 'Rifle',    caliber: '7.92x57 Mauser', explicit: 8 },
  enfield:       { name: 'Lee-Enfield',              category: 'Rifle',    caliber: '.303 British', explicit: 8 },
  garand:        { name: 'M1 Garand',                category: 'Rifle',    caliber: '.30-06', explicit: 15 },
  m1:            { name: 'M1 Carbine',               category: 'Carabina', caliber: '.30 Carbine', explicit: 8 },
  cz527:         { name: 'CZ 527',                   category: 'Rifle',    caliber: '7.62x39mm' },
  marlin:        { name: 'Marlin Lever Action',      category: 'Rifle',    caliber: '.44 Magnum', explicit: 10 },
  daniel:        { name: 'Daniel Defense',           category: 'Rifle',    caliber: '7.62x54mmR', explicit: 8 },
  mosin_hunter:  { name: 'Mosin Hunter',             category: 'Rifle',    caliber: '7.62x54mmR', explicit: 8 },
  sks:           { name: 'SKS',                      category: 'Rifle',    caliber: '7.62x39mm' },
  dragunov:      { name: 'SVD Dragunov',             category: 'Rifle',    caliber: '7.62x54mmR', explicit: 8 },
  aug:           { name: 'Steyr AUG',                category: 'Rifle',    caliber: '.223 Rem' },
  tavor:         { name: 'IWI Tavor',                category: 'Rifle',    caliber: '.223 Rem', explicit: 6 },
  grot_bull:     { name: 'MSBS GROT Bull',           category: 'Rifle',    caliber: '.223 Rem' },
  grot:          { name: 'MSBS GROT',                category: 'Rifle',    caliber: '.223 Rem' },
  bwidow:        { name: 'Black Widow',              category: 'Rifle',    caliber: '.223 Rem' },
  carmel:        { name: 'IWI Carmel',               category: 'Rifle',    caliber: '.223 Rem', explicit: 6 },
  csv:           { name: 'CSV',                      category: 'Rifle',    caliber: '.223 Rem' },
  cz557:         { name: 'CZ 557',                   category: 'Rifle',    caliber: '.30-06', explicit: 10 },
  savage_xp:     { name: 'Savage XP',                category: 'Rifle',    caliber: '7.62x51mm NATO' },
  axis_precision:{ name: 'Savage Axis Precision',    category: 'Rifle',    caliber: '7.62x51mm NATO' },
  fg9:           { name: 'FG9',                      category: 'Carabina', caliber: '9mm Para' },
  gatling:       { name: 'Gatling Gun',              category: 'Ametralladora', caliber: '9mm Para', explicit: 10 },

  // --- Escopetas ---
  hunt:        { name: 'Mossberg Hunt',      category: 'Escopeta', caliber: 'Shotgun 12ga' },
  tavorshotgun:{ name: 'Tavor TS12',         category: 'Escopeta', caliber: 'Shotgun 12ga', explicit: 10 },
  hatsan:      { name: 'Hatsan',             category: 'Escopeta', caliber: 'Shotgun 12ga' },
  armsan_RSX1: { name: 'Armsan RSX1',        category: 'Escopeta', caliber: 'Shotgun 12ga' },
  armsanrss1:  { name: 'Armsan RSS1',        category: 'Escopeta', caliber: 'Shotgun 12ga' },
  lupara:      { name: 'Lupara',             category: 'Escopeta', caliber: 'Shotgun 12ga' },
  sauer:       { name: 'Sauer Shotgun',      category: 'Escopeta', caliber: 'Shotgun 12ga' },
  valmetbock:  { name: 'Valmet Bock',        category: 'Escopeta', caliber: 'Shotgun 12ga' },

  // --- Ametralladoras/SMG dentro de bojowa ---
  zb26:  { name: 'ZB vz. 26',   category: 'Ametralladora', caliber: '7.92x57 Mauser', explicit: 9 },
  mg42:  { name: 'MG 42',       category: 'Ametralladora', caliber: '7.62x51mm NATO', explicit: 12 },
  DPM:   { name: 'DP-27 / DPM', category: 'Ametralladora', caliber: '7.62x54mmR', explicit: 9 },
  mp40:  { name: 'MP40',        category: 'SMG',           caliber: '9mm Para', explicit: 5 },

  // ============ MASZYNOWA (automáticas) ============
  akms_auto:     { name: 'AKMS (full auto)',          category: 'Ametralladora', caliber: '7.62x39mm', explicit: 8 },
  ak47:          { name: 'AK-47 (full auto)',         category: 'Ametralladora', caliber: '7.62x39mm', explicit: 8 },
  beryl:         { name: 'Beryl (full auto)',         category: 'Ametralladora', caliber: '.223 Rem', explicit: 8 },
  smarownica:    { name: 'M3 Grease Gun',             category: 'SMG',           caliber: '.45 ACP', explicit: 10 },
  tommy:         { name: 'Thompson M1A1',             category: 'SMG',           caliber: '.45 ACP', explicit: 7 },
  suomi:         { name: 'Suomi KP/-31',              category: 'SMG',           caliber: '9mm Para' },
  pepesza:       { name: 'PPSh-41 "Pepesza"',         category: 'SMG',           caliber: '7.62x25 Tokarev' },
  PPS:           { name: 'PPS-43',                    category: 'SMG',           caliber: '7.62x25 Tokarev' },
  uzi9mm:        { name: 'Uzi',                       category: 'SMG',           caliber: '9mm Para', explicit: 5 },
  pm84:          { name: 'PM-84 Glauberyt',           category: 'SMG',           caliber: '9mm Para', explicit: 5 },
  miniberyl:     { name: 'Mini-Beryl (full auto)',    category: 'SMG',           caliber: '.223 Rem', explicit: 8 },
  rkmd:          { name: 'RKMD',                      category: 'Ametralladora', caliber: '7.62x39mm', explicit: 8 },
  rpk:           { name: 'RPK / RPKS',                category: 'Ametralladora', caliber: '7.62x39mm', explicit: 8 },
  PKM:           { name: 'PKM',                       category: 'Ametralladora', caliber: '7.62x54mmR', explicit: 12 },
  goriunov:      { name: 'Goryunov SG-43',            category: 'Ametralladora', caliber: '7.62x54mmR', explicit: 9 },
  rak:           { name: 'RAK PM-63',                 category: 'SMG',           caliber: '9mm Makarov', explicit: 5 },
  pompiczka:     { name: 'Pompiczka',                 category: 'SMG',           caliber: '.45 ACP' },
  yugopepesza:   { name: 'Yugo PPSh',                 category: 'SMG',           caliber: '7.62x25 Tokarev' },
  jugoszmajser:  { name: 'Yugo Schmeisser',           category: 'SMG',           caliber: '9mm Para' },
  solothurnmp34: { name: 'Solothurn MP34',            category: 'SMG',           caliber: '9mm Para', explicit: 20 },
  sten:          { name: 'Sten',                      category: 'SMG',           caliber: '9mm Para', explicit: 6 },
  scorpion:      { name: 'CZ Scorpion EVO',           category: 'SMG',           caliber: '9mm Para', explicit: 5 },
  mp5:           { name: 'HK MP5',                    category: 'SMG',           caliber: '9mm Para', explicit: 6 },
  smt9:          { name: 'Taurus SMT9',               category: 'SMG',           caliber: '9mm Para', explicit: 5 },
  sog:           { name: 'SOG',                       category: 'SMG',           caliber: '9mm Para' },
  g18:           { name: 'Glock 18C',                 category: 'SMG',           caliber: '9mm Para', explicit: 6 },
  ingram:        { name: 'Ingram MAC-10',             category: 'SMG',           caliber: '9mm Short', explicit: 5 },
  skorpion:      { name: 'Škorpion vz. 61',           category: 'SMG',           caliber: '7.65 Browning', explicit: 5 },
  grotauto:      { name: 'MSBS GROT (full auto)',     category: 'Ametralladora', caliber: '.223 Rem', explicit: 8 },
  aug9:          { name: 'Steyr AUG Para 9mm',        category: 'SMG',           caliber: '9mm Para', explicit: 5 },
  miniuzi:       { name: 'Mini-Uzi',                  category: 'SMG',           caliber: '9mm Para', explicit: 6 },
  kp44:          { name: 'KP-44',                     category: 'SMG',           caliber: '9mm Para', explicit: 6 },
};

const SECTION_LABEL = {
  malokalibrowa: 'Pequeño calibre',
  bojowa:        'Combate',
  maszynowa:     'Automáticas',
};

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function fetchImage(url, outPath) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': BASE } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(outPath, buf);
  return buf.length;
}

function parseArsenal(html) {
  // Localizar los 3 encabezados de sección — hay una meta-tag de keywords
  // con las mismas palabras, así que buscamos la ÚLTIMA ocurrencia de cada
  // término (los encabezados reales están más abajo en el DOM).
  const sectionMarkers = [
    { key: 'malokalibrowa', re: /Broń\s+małokalibrowa/gi },
    { key: 'bojowa',        re: /Broń\s+bojowa\s*[:<]/gi },
    { key: 'maszynowa',     re: /Broń\s+maszynowa\s*[:<]/gi },
  ];
  const boundaries = sectionMarkers.map(({ key, re }) => {
    const matches = [...html.matchAll(re)];
    return { key, pos: matches.length ? matches[matches.length - 1].index : -1 };
  }).filter(s => s.pos >= 0).sort((a, b) => a.pos - b.pos);

  const sectionAt = pos => {
    let cur = 'unknown';
    for (const s of boundaries) if (pos >= s.pos) cur = s.key;
    return cur;
  };

  const pairRe = /href="[^"]*images\/arsenal_info\/([^"]+)"[^>]*>\s*<img[^>]*src="[^"]*images\/arsenal\/([^"]+)"/gi;
  const pairs = [];
  let m;
  while ((m = pairRe.exec(html)) !== null) {
    const slug = m[1].replace(/_opis\.png$/i, '').replace(/_info\.png$/i, '').replace(/\.png$/i, '');
    pairs.push({
      slug,
      thumb: m[2],
      infoImage: `images/arsenal_info/${m[1]}`,
      section: sectionAt(m.index),
    });
  }
  return pairs;
}

async function ensureDir(p) {
  try { await stat(p); } catch { await mkdir(p, { recursive: true }); }
}

async function main() {
  await ensureDir(IMAGES_DIR);

  console.log('→ Fetching arsenal page...');
  const html = await fetchText(ARSENAL_URL);
  const pairs = parseArsenal(html);
  console.log(`  Found ${pairs.length} weapon entries.`);

  const weapons = [];
  const missing = [];

  for (const p of pairs) {
    const meta = WEAPONS_META[p.slug];
    if (!meta) {
      missing.push(p.slug);
      continue;
    }
    const caliber = meta.caliber;
    const explicit = meta.explicit !== undefined;
    const pricePLN = explicit ? meta.explicit : PRICE_BY_CALIBER[caliber];
    if (pricePLN === undefined) {
      console.warn(`  ⚠ No price for ${p.slug} (caliber ${caliber})`);
    }
    weapons.push({
      slug: p.slug,
      name: meta.name,
      category: meta.category,
      section: p.section,
      sectionLabel: SECTION_LABEL[p.section] ?? p.section,
      image: `images/${p.thumb}`,
      caliber,
      pricePLN: pricePLN ?? null,
      priceEUR: pricePLN ? Math.round(pricePLN * PLN_TO_EUR * 100) / 100 : null,
      explicitPrice: explicit,
    });
  }

  if (missing.length) {
    console.warn(`  ⚠ ${missing.length} slugs without metadata: ${missing.join(', ')}`);
  }

  // Descargar imágenes en paralelo (máx 10 concurrentes)
  console.log(`→ Downloading ${pairs.length} thumbnails...`);
  const queue = [...pairs];
  const failed = [];
  let done = 0;
  async function worker() {
    while (queue.length) {
      const p = queue.shift();
      const url = `${BASE}images/arsenal/${p.thumb}`;
      const outPath = join(IMAGES_DIR, p.thumb);
      try {
        // skip si ya existe
        try { await stat(outPath); done++; continue; } catch {}
        await fetchImage(url, outPath);
        done++;
        if (done % 20 === 0) console.log(`  ${done}/${pairs.length}`);
      } catch (e) {
        failed.push({ slug: p.slug, thumb: p.thumb, error: e.message });
      }
    }
  }
  await Promise.all(Array.from({ length: 10 }, worker));
  console.log(`  Downloaded: ${done}/${pairs.length}. Failed: ${failed.length}`);
  if (failed.length) console.warn(failed);

  await writeFile(OUT_JSON, JSON.stringify(weapons, null, 2));
  console.log(`✔ Wrote ${weapons.length} weapons to ${OUT_JSON}`);
  const explicitCount = weapons.filter(w => w.explicitPrice).length;
  console.log(`  Explicit prices: ${explicitCount}  |  Inferred: ${weapons.length - explicitCount}`);
}

main().catch(e => { console.error(e); process.exit(1); });
