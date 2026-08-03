/**
 * Pakistan city → delivery area knowledge with postal (ZIP) codes.
 * Seeded for doorstep / rider verticals (water-delivery and reusable route businesses).
 *
 * Codes are commonly cited Pakistan Post / directory values (5-digit delivery codes).
 * Sources aggregated from public directories (Pakistan Post listings, city ZIP guides).
 * Not an official GIS layer — operators may override postalcode per customer.
 *
 * @typedef {{ name: string, postalCode: string }} PakistanDeliveryArea
 */

/**
 * @param {string} name
 * @param {string} postalCode
 * @returns {PakistanDeliveryArea}
 */
function a(name, postalCode) {
  return { name, postalCode: String(postalCode).replace(/\D/g, '').padStart(5, '0').slice(-5) };
}

/** @type {Record<string, PakistanDeliveryArea[]>} */
export const PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY = Object.freeze({
  Karachi: Object.freeze([
    // South / DHA / Clifton
    a('DHA Phase 1', '75500'),
    a('DHA Phase 2', '75500'),
    a('DHA Phase 2 Extension', '75500'),
    a('DHA Phase 4', '75500'),
    a('DHA Phase 5', '75500'),
    a('DHA Phase 5 (Bukhari Commercial)', '75500'),
    a('DHA Phase 5 (Badar Commercial)', '75500'),
    a('DHA Phase 5 (Khayaban-e-Shahbaz)', '75500'),
    a('DHA Phase 6', '75500'),
    a('DHA Phase 6 (Muslim Commercial)', '75500'),
    a('DHA Phase 6 (Rahat Commercial)', '75500'),
    a('DHA Phase 6 (Seher Commercial)', '75500'),
    a('DHA Phase 7', '75500'),
    a('DHA Phase 7 Extension', '75500'),
    a('DHA Phase 8', '75500'),
    a('DHA Phase 8 (Zone A)', '75500'),
    a('DHA Phase 8 (Zone B)', '75500'),
    a('DHA Phase 8 (Zone C)', '75500'),
    a('DHA Phase 8 (Creek Vistas)', '75500'),
    a('Defence View Phase 1', '75500'),
    a('Defence View Phase 2', '75500'),
    a('Defence View Phase 3', '75500'),
    a('Clifton Block 1', '75600'),
    a('Clifton Block 2', '75600'),
    a('Clifton Block 3', '75600'),
    a('Clifton Block 4', '75600'),
    a('Clifton Block 5', '75600'),
    a('Clifton Block 7', '75600'),
    a('Clifton Block 8', '75600'),
    a('Clifton Block 9', '75600'),
    a('Bath Island', '75600'),
    a('Keamari', '75620'),
    a('Manora', '75640'),
    a('Lyari', '75660'),
    a('Karachi Cantt', '75530'),
    a('Saddar', '74400'),
    a('Empress Market', '74400'),
    a('Karachi City GPO', '74000'),
    a('I.I. Chundrigar Road', '74000'),
    a('M.A. Jinnah Road', '74200'),
    a('Garden East', '74800'),
    a('Garden West', '74800'),
    a('Soldier Bazaar', '74400'),
    a('PECHS Block 1', '75400'),
    a('PECHS Block 2', '75400'),
    a('PECHS Block 3', '75400'),
    a('PECHS Block 6', '75400'),
    a('Bahadurabad', '74800'),
    a('Tariq Road', '75400'),
    a('Mehmoodabad', '75460'),
    a('Nishtar Road', '75550'),

    // East / Gulshan / Jauhar / Scheme 33 / BTK
    a('Gulshan-e-Iqbal Block 1', '75300'),
    a('Gulshan-e-Iqbal Block 2', '75300'),
    a('Gulshan-e-Iqbal Block 3', '75300'),
    a('Gulshan-e-Iqbal Block 4', '75300'),
    a('Gulshan-e-Iqbal Block 5', '75300'),
    a('Gulshan-e-Iqbal Block 6', '75300'),
    a('Gulshan-e-Iqbal Block 7', '75300'),
    a('Gulshan-e-Iqbal Block 10', '75300'),
    a('Gulshan-e-Iqbal Block 11', '75300'),
    a('Gulshan-e-Iqbal Block 13', '75300'),
    a('Gulshan-e-Iqbal Block 13D', '75300'),
    a('Gulshan-e-Iqbal Block 14', '75300'),
    a('Gulshan-e-Iqbal Block 15', '75300'),
    a('Gulshan-e-Iqbal Block 16', '75300'),
    a('Gulshan-e-Iqbal Block 17', '75300'),
    a('Gulshan-e-Iqbal Block 18', '75300'),
    a('Gulshan-e-Iqbal Block 19', '75300'),

    a('Gulistan-e-Jauhar Block 1', '75290'),
    a('Gulistan-e-Jauhar Block 2', '75290'),
    a('Gulistan-e-Jauhar Block 3', '75290'),
    a('Gulistan-e-Jauhar Block 4', '75290'),
    a('Gulistan-e-Jauhar Block 7', '75290'),
    a('Gulistan-e-Jauhar Block 8', '75290'),
    a('Gulistan-e-Jauhar Block 10', '75290'),
    a('Gulistan-e-Jauhar Block 11', '75290'),
    a('Gulistan-e-Jauhar Block 12', '75290'),
    a('Gulistan-e-Jauhar Block 13', '75290'),
    a('Gulistan-e-Jauhar Block 14', '75290'),
    a('Gulistan-e-Jauhar Block 15', '75290'),
    a('Gulistan-e-Jauhar Block 16', '75290'),
    a('Gulistan-e-Jauhar Block 17', '75290'),
    a('Gulistan-e-Jauhar Block 18', '75290'),
    a('Gulistan-e-Jauhar Block 19', '75290'),
    a('Gulistan-e-Jauhar Block 20', '75290'),

    a('Gulshan-e-Jamal', '75260'),
    a('Gulzar-e-Hijri', '75330'),
    a('Karachi University', '75270'),
    a('Shahrah-e-Faisal', '75350'),
    a('Scheme 33 (Saadi Town)', '75300'),
    a('Scheme 33 (Saadi Garden)', '75300'),
    a('Scheme 33 (Gwalior Society)', '75300'),
    a('Scheme 33 (Punjab Town)', '75300'),
    a('Scheme 33 (Teachers Society)', '75300'),
    a('Gulshan-e-Maymar', '75300'),
    a('New Sabzi Mandi', '75340'),

    // Bahria Town Karachi Precincts & Towers
    a('Bahria Town Karachi (BTK)', '75340'),
    a('BTK Precinct 1 (Villa Precinct)', '75340'),
    a('BTK Precinct 2 (Midway Commercial North)', '75340'),
    a('BTK Precinct 3 (Midway Commercial South)', '75340'),
    a('BTK Precinct 4', '75340'),
    a('BTK Precinct 6', '75340'),
    a('BTK Precinct 8 (Ali Block)', '75340'),
    a('BTK Precinct 10A (Bahria Homes)', '75340'),
    a('BTK Precinct 10B', '75340'),
    a('BTK Precinct 11A (Bahria Homes)', '75340'),
    a('BTK Precinct 11B (Bahria Homes)', '75340'),
    a('BTK Precinct 12 (Bahria Farmhouses)', '75340'),
    a('BTK Precinct 14', '75340'),
    a('BTK Precinct 15', '75340'),
    a('BTK Precinct 15A', '75340'),
    a('BTK Precinct 16', '75340'),
    a('BTK Precinct 17', '75340'),
    a('BTK Precinct 18', '75340'),
    a('BTK Precinct 19 (Bahria Apartments)', '75340'),
    a('BTK Precinct 20', '75340'),
    a('BTK Precinct 27', '75340'),
    a('BTK Precinct 28', '75340'),
    a('BTK Precinct 29', '75340'),
    a('BTK Precinct 30', '75340'),
    a('BTK Precinct 31', '75340'),
    a('BTK Precinct 34 (Sports City)', '75340'),
    a('BTK Precinct 35 (Sports City)', '75340'),
    a('BTK Precinct 36 (Sports City)', '75340'),
    a('BTK Precinct 37 (Sports City)', '75340'),
    a('BTK Precinct 47 (Paradise)', '75340'),
    a('BTK Precinct 48 (Paradise)', '75340'),
    a('BTK Bahria Apartments', '75340'),
    a('BTK Bahria Heights', '75340'),
    a('BTK Bahria Icon Tower', '75340'),
    a('BTK Jinnah Avenue Commercial', '75340'),

    // Bahria Town Karachi Neighboring Areas & M-9 Super Highway Corridor
    a('Usmania Town / Osmania Town', '75340'),
    a('Usmania City (M-9)', '75340'),
    a('Gadap Town / Gadap City', '75330'),
    a('Gadap Road', '75330'),
    a('Kathore / Kathore Junction (M-9)', '75340'),
    a('Dumba Got / Dumba Lake Area', '75340'),
    a('DHA City Karachi (DCK)', '75340'),
    a('ASF City Karachi (M-9)', '75340'),
    a('Commanders City (M-9)', '75340'),
    a('Shah Town (M-9)', '75340'),
    a('MDA Scheme 45', '75340'),
    a('Al-Ghafoor Green City (M-9)', '75340'),
    a('Garden City M-9', '75340'),
    a('Teachers Society (M-9)', '75340'),
    a('Nooriabad Industrial Zone (M-9)', '73000'),
    a('Memon Goth (Malir / Gadap)', '75050'),
    a('Chowkandi', '75050'),

    // Central / FB Area / Nazimabad
    a('Nazimabad Block 1', '74600'),
    a('Nazimabad Block 2', '74600'),
    a('Nazimabad Block 3', '74600'),
    a('Nazimabad Block 4', '74600'),
    a('North Nazimabad Block A', '74700'),
    a('North Nazimabad Block B', '74700'),
    a('North Nazimabad Block C', '74700'),
    a('North Nazimabad Block D', '74700'),
    a('North Nazimabad Block F', '74700'),
    a('North Nazimabad Block H', '74700'),
    a('North Nazimabad Block K', '74700'),
    a('North Nazimabad Block N', '74700'),
    a('Federal B Area Block 1', '75950'),
    a('Federal B Area Block 5', '75950'),
    a('Federal B Area Block 10', '75950'),
    a('Federal B Area Block 14', '75950'),
    a('Federal B Area Block 15', '75950'),
    a('Federal B Area Block 20', '75950'),
    a('Liaquatabad', '75900'),
    a('PIB Colony', '75950'),
    a('Buffer Zone', '75850'),
    a('Metroville', '75840'),
    a('New Karachi', '75850'),
    a('North Karachi Sector 5', '75850'),
    a('North Karachi Sector 7', '75850'),
    a('North Karachi Sector 11', '75850'),
    a('Surjani Town', '75340'),
    a('Orangi Town', '75800'),
    a('Baldia Town', '75760'),
    a('SITE', '75700'),

    // Malir / Korangi / Landhi / Askari
    a('Askari 4', '75070'),
    a('Askari 5', '75070'),
    a('Malir City', '75050'),
    a('Malir Cantt', '75070'),
    a('Model Colony', '75100'),
    a('Shah Faisal Colony', '75230'),
    a('Korangi Industrial Area', '75190'),
    a('Korangi Creek', '75190'),
    a('Landhi Colony', '75160'),
    a('Quaidabad', '75120'),
    a('Port Qasim', '75020'),
    a('Gulshan-e-Hadeed', '75020'),
    a('Steel Town', '75010'),
    a('Mauripur', '75750'),
    a('Hawksbay', '75020'),
  ]),

  Hyderabad: Object.freeze([
    a('Hyderabad GPO', '71000'),
    a('Hyderabad City', '71500'),
    a('Hyderabad Cantt', '71110'),
    a('Qasimabad', '71100'),
    a('Latifabad', '71800'),
    a('Latifabad Unit 1', '71800'),
    a('Latifabad Unit 2', '71800'),
    a('Latifabad Unit 5', '71800'),
    a('Latifabad Unit 7', '71800'),
    a('Latifabad Unit 8', '71800'),
    a('Latifabad Unit 11', '71800'),
    a('Latifabad Unit 12', '71800'),
    a('Hirabad', '71500'),
    a('Citizens Colony', '71500'),
    a('Auto Bahn Road', '71500'),
    a('SITE Hyderabad', '71900'),
    a('Sindh Regimental Centre', '71850'),
    a('Kotri', '76000'),
    a('SITE Kotri', '76010'),
    a('Jamshoro University', '76080'),
    a('Tando Jam', '70050'),
    a('Hala', '70120'),
    a('Matiari', '70150'),
  ]),

  Lahore: Object.freeze([
    a('Lahore GPO', '54000'),
    a('Lahore Cantt', '54810'),
    // DHA Lahore Phases
    a('DHA Phase 1', '54810'),
    a('DHA Phase 2', '54820'),
    a('DHA Phase 3', '54830'),
    a('DHA Phase 4', '54890'),
    a('DHA Phase 5', '54910'),
    a('DHA Phase 6', '54920'),
    a('DHA Phase 6 (CCA)', '54920'),
    a('DHA Phase 7', '54930'),
    a('DHA Phase 8', '54940'),
    a('DHA Phase 8 (Air Avenue)', '54940'),
    a('DHA Phase 8 (Park View)', '54940'),
    a('DHA Phase 8 (Broadway)', '54940'),
    a('DHA Phase 9 Town', '54950'),
    a('DHA Phase 9 Prism', '54950'),

    // Johar Town Blocks
    a('Johar Town Block A', '54782'),
    a('Johar Town Block B', '54782'),
    a('Johar Town Block C', '54782'),
    a('Johar Town Block D', '54782'),
    a('Johar Town Block E', '54782'),
    a('Johar Town Block F', '54782'),
    a('Johar Town Block G', '54782'),
    a('Johar Town Block H', '54782'),
    a('Johar Town Block J', '54782'),
    a('Johar Town Block K', '54782'),
    a('Johar Town Block M', '54782'),
    a('Johar Town Block R', '54782'),

    // Gulberg & Model Town
    a('Gulberg I', '54660'),
    a('Gulberg II', '54660'),
    a('Gulberg III', '54660'),
    a('Gulberg IV', '54660'),
    a('Gulberg V', '54660'),
    a('Model Town Block A', '54700'),
    a('Model Town Block B', '54700'),
    a('Model Town Block C', '54700'),
    a('Model Town Block D', '54700'),
    a('Model Town Block J', '54700'),
    a('Model Town Block M', '54700'),
    a('Model Town Link Road', '54700'),

    // Bahria Town Lahore Sectors & Blocks
    a('Bahria Town Lahore', '53720'),
    a('Bahria Town Sector A', '53720'),
    a('Bahria Town Sector B (Umar Block)', '53720'),
    a('Bahria Town Sector B (Takbeer Block)', '53720'),
    a('Bahria Town Sector C (Jasmine Block)', '53720'),
    a('Bahria Town Sector C (Tulip Block)', '53720'),
    a('Bahria Town Sector C (Nargis Block)', '53720'),
    a('Bahria Town Sector C (Iris Block)', '53720'),
    a('Bahria Town Sector D (AA Block)', '53720'),
    a('Bahria Town Sector D (BB Block)', '53720'),
    a('Bahria Town Sector E (Nishtar Block)', '53720'),
    a('Bahria Town Sector E (Rafi Block)', '53720'),
    a('Bahria Town Sector F (Ghaznavi Block)', '53720'),
    a('Bahria Town Sector F (Tipu Sultan Block)', '53720'),
    a('Bahria Town Sector F (Touheed Block)', '53720'),
    a('Bahria Orchard Phase 1', '53720'),
    a('Bahria Orchard Phase 2', '53720'),
    a('Bahria Orchard Phase 3', '53720'),
    a('Bahria Orchard Phase 4', '53720'),
    a('Bahria Safari Villas', '53720'),

    // Townships / Valencia / Wapda Town
    a('Township Block 1', '54770'),
    a('Township Block 2', '54770'),
    a('Wapda Town Phase 1', '54770'),
    a('Wapda Town Phase 2', '54770'),
    a('Valencia Town Block A', '54784'),
    a('Valencia Town Block B', '54784'),
    a('Valencia Town Block C', '54784'),
    a('Valencia Town Block H', '54784'),
    a('EME Society', '53710'),
    a('Thokar Niaz Baig', '53700'),
    a('Faisal Town Block A', '54700'),
    a('Faisal Town Block B', '54700'),
    a('Garden Town (Tariq Block)', '54520'),
    a('Garden Town (Usman Block)', '54520'),
    a('Garden Town (Aibak Block)', '54520'),
    a('Allama Iqbal Town (Khyber Block)', '54570'),
    a('Allama Iqbal Town (Chenab Block)', '54570'),
    a('Allama Iqbal Town (Nizam Block)', '54570'),
    a('Allama Iqbal Town (Kamran Block)', '54570'),
    a('Samanabad', '54500'),
    a('Sabzazar', '54500'),
    a('Ferozepur Road', '54600'),
    a('Ichhra', '54000'),
    a('Mughalpura', '54840'),
    a('Harbanspura', '54850'),
    a('Askari 1', '54850'),
    a('Askari 5', '54850'),
    a('Askari 10', '54850'),
    a('Askari 11', '54860'),
    a('Walton Road', '54750'),
    a('Shahdara Bagh', '54950'),
    a('Baghbanpura', '54920'),
    a('Raiwind Road', '55150'),
    a('Lake City Lahore', '53720'),
    a('Khayaban-e-Amin', '53720'),
  ]),

  Islamabad: Object.freeze([
    a('Islamabad GPO', '44000'),
    a('Blue Area', '44000'),
    a('F-6', '44060'),
    a('F-7', '44210'),
    a('F-8', '44220'),
    a('F-10', '44170'),
    a('F-11', '44180'),
    a('G-6', '44010'),
    a('G-7', '44070'),
    a('G-8', '44080'),
    a('G-9', '44090'),
    a('G-10', '44100'),
    a('G-11', '44120'),
    a('G-13', '44130'),
    a('G-15', '44150'),
    a('I-8', '44790'),
    a('I-9', '44790'),
    a('I-10', '44800'),
    a('E-7 / E-8 / E-9', '44230'),
    a('Bahria Town Islamabad', '46220'),
    a('DHA Islamabad', '45730'),
    a('DHA Phase II', '45730'),
    a('Pakistan Town', '45720'),
    a('Rawal Town', '45510'),
    a('Ghauri Town', '45551'),
  ]),

  Rawalpindi: Object.freeze([
    a('Rawalpindi GPO', '46000'),
    a('Saddar Rawalpindi', '46000'),
    a('Cantt Rawalpindi', '46000'),
    a('Bahria Town Phase 1-8', '46220'),
    a('Bahria Town Rawalpindi', '46220'),
    a('DHA Rawalpindi', '45730'),
    a('Westridge', '46000'),
    a('Satellite Town', '46300'),
    a('Chaklala', '46200'),
    a('Askari Rawalpindi', '46000'),
    a('Committee Chowk', '46000'),
    a('Raja Bazaar', '46000'),
  ]),

  Faisalabad: Object.freeze([
    a('Faisalabad GPO', '38000'),
    a('D Ground', '38000'),
    a('Madina Town', '38000'),
    a('Peoples Colony', '38000'),
    a('Gulberg Faisalabad', '38000'),
    a('Jaranwala Road', '38000'),
    a('Satiana Road', '38000'),
    a('Canal Road', '38000'),
    a('Susan Road', '38000'),
  ]),

  Multan: Object.freeze([
    a('Multan GPO', '60000'),
    a('Cantt Multan', '60000'),
    a('Gulgasht', '60000'),
    a('Shah Rukn-e-Alam', '60000'),
    a('Bosan Road', '60000'),
    a('MDA', '60000'),
    a('Hussain Agahi', '60000'),
  ]),

  Peshawar: Object.freeze([
    a('Peshawar GPO', '25000'),
    a('University Town', '25000'),
    a('Hayatabad', '25100'),
    a('Cantt Peshawar', '25000'),
    a('Board Bazaar', '25000'),
    a('Ring Road', '25000'),
    a('Saddar Peshawar', '25000'),
  ]),

  Quetta: Object.freeze([
    a('Quetta GPO', '87300'),
    a('Cantt Quetta', '87300'),
    a('Jinnah Town', '87300'),
    a('Samungli', '87300'),
    a('Airport Road', '87300'),
  ]),

  Sukkur: Object.freeze([
    a('Sukkur GPO', '65200'),
    a('Military Road', '65200'),
    a('Local Board', '65200'),
    a('Minara Road', '65200'),
  ]),
});

/** @deprecated Prefer PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY — kept as name-only map. */
export const PAKISTAN_DELIVERY_AREAS_BY_CITY = Object.freeze(
  Object.fromEntries(
    Object.entries(PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY).map(([city, rows]) => [
      city,
      rows.map((r) => r.name),
    ])
  )
);

export const WATER_DELIVERY_CITIES = Object.freeze(Object.keys(PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY));

/**
 * @param {string | null | undefined} city
 * @returns {PakistanDeliveryArea[]}
 */
export function getDeliveryAreaRecordsForCity(city) {
  const key = String(city || '').trim();
  if (!key) return [];
  if (PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY[key]) {
    return PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY[key].map((r) => ({ ...r }));
  }
  const match = Object.keys(PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY).find(
    (c) => c.toLowerCase() === key.toLowerCase()
  );
  return match
    ? PAKISTAN_DELIVERY_AREA_RECORDS_BY_CITY[match].map((r) => ({ ...r }))
    : [];
}

/**
 * @param {string | null | undefined} city
 * @returns {string[]}
 */
export function getDeliveryAreasForCity(city) {
  return getDeliveryAreaRecordsForCity(city).map((r) => r.name);
}

/**
 * Select options: value = area name, label includes postal code.
 * @param {string | null | undefined} city
 * @returns {Array<{ value: string, label: string, postalCode: string }>}
 */
export function getDeliveryAreaSelectOptions(city) {
  return getDeliveryAreaRecordsForCity(city).map((r) => ({
    value: r.name,
    label: `${r.name} · ${r.postalCode}`,
    postalCode: r.postalCode,
  }));
}

/**
 * Resolve postal code for a city + area name (case-insensitive).
 * @param {string | null | undefined} city
 * @param {string | null | undefined} areaName
 * @returns {string | null}
 */
export function resolvePostalCodeForArea(city, areaName) {
  const want = String(areaName || '').trim().toLowerCase();
  if (!want) return null;
  const rows = getDeliveryAreaRecordsForCity(city);
  const hit =
    rows.find((r) => r.name.toLowerCase() === want) ||
    rows.find((r) => r.name.toLowerCase().includes(want) || want.includes(r.name.toLowerCase()));
  return hit?.postalCode || null;
}

/**
 * Flat unique area names (Karachi first) for select fallbacks when city is unknown.
 * @returns {string[]}
 */
export function getAllPakistanDeliveryAreas() {
  const out = [];
  const seen = new Set();
  for (const city of WATER_DELIVERY_CITIES) {
    for (const area of getDeliveryAreasForCity(city)) {
      if (seen.has(area)) continue;
      seen.add(area);
      out.push(area);
    }
  }
  return out;
}

/**
 * Flat unique labels with postal codes for fallback selects.
 * @returns {Array<{ value: string, label: string, postalCode: string }>}
 */
export function getAllPakistanDeliveryAreaSelectOptions() {
  const out = [];
  const seen = new Set();
  for (const city of WATER_DELIVERY_CITIES) {
    for (const opt of getDeliveryAreaSelectOptions(city)) {
      if (seen.has(opt.value)) continue;
      seen.add(opt.value);
      out.push(opt);
    }
  }
  return out;
}

/**
 * Weekday delivery cadence presets for water / route customers.
 */
export const WATER_DELIVERY_DAY_PRESETS = Object.freeze([
  'Daily',
  'Mon Wed Fri',
  'Tue Thu Sat',
  'Weekdays',
  'Sat Sun',
  'Mon only',
  'Monthly',
  'Custom',
]);

/**
 * Whether a cadence string covers local weekday (0=Sun … 6=Sat).
 * @param {string | null | undefined} cadence
 * @param {Date} [date]
 */
export function waterDeliveryCadenceCoversDate(cadence, date = new Date()) {
  const raw = String(cadence || '').trim();
  if (!raw || /^daily$/i.test(raw) || /^every\s*day$/i.test(raw)) return true;
  if (/^custom$/i.test(raw)) return true;
  const day = date.getDay();
  const isWeekday = day >= 1 && day <= 5;
  const isWeekend = day === 0 || day === 6;
  if (/^weekdays?$/i.test(raw)) return isWeekday;
  if (/^(sat\s*sun|weekends?)$/i.test(raw)) return isWeekend;

  const tokens = raw
    .toLowerCase()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((t) => t.slice(0, 3));
  const map = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const wanted = new Set(tokens.map((t) => map[t]).filter((n) => n != null));
  if (!wanted.size) return true;
  return wanted.has(day);
}
