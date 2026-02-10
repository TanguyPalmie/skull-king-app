/**
 * Seed runner for the Taggy API.
 *
 * - Connects to PostgreSQL using DATABASE_URL from env (loads dotenv).
 * - Idempotent: uses INSERT ... ON CONFLICT DO NOTHING.
 * - Seeds 80 sports, 30 languages, 3 test users, and some user-sport /
 *   user-language associations.
 */

const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// ---------------------------------------------------------------------------
// Embedded data (mirrors packages/shared/src/constants)
// ---------------------------------------------------------------------------

const SPORTS = [
  { id: 1, key: 'football', fr: 'Football', en: 'Football (Soccer)', es: 'F\u00fatbol' },
  { id: 2, key: 'basketball', fr: 'Basketball', en: 'Basketball', es: 'Baloncesto' },
  { id: 3, key: 'tennis', fr: 'Tennis', en: 'Tennis', es: 'Tenis' },
  { id: 4, key: 'swimming', fr: 'Natation', en: 'Swimming', es: 'Nataci\u00f3n' },
  { id: 5, key: 'running', fr: 'Course \u00e0 pied', en: 'Running', es: 'Running' },
  { id: 6, key: 'cycling', fr: 'Cyclisme', en: 'Cycling', es: 'Ciclismo' },
  { id: 7, key: 'volleyball', fr: 'Volleyball', en: 'Volleyball', es: 'Voleibol' },
  { id: 8, key: 'handball', fr: 'Handball', en: 'Handball', es: 'Balonmano' },
  { id: 9, key: 'rugby', fr: 'Rugby', en: 'Rugby', es: 'Rugby' },
  { id: 10, key: 'table_tennis', fr: 'Tennis de table', en: 'Table Tennis', es: 'Tenis de mesa' },
  { id: 11, key: 'badminton', fr: 'Badminton', en: 'Badminton', es: 'B\u00e1dminton' },
  { id: 12, key: 'golf', fr: 'Golf', en: 'Golf', es: 'Golf' },
  { id: 13, key: 'boxing', fr: 'Boxe', en: 'Boxing', es: 'Boxeo' },
  { id: 14, key: 'judo', fr: 'Judo', en: 'Judo', es: 'Judo' },
  { id: 15, key: 'karate', fr: 'Karat\u00e9', en: 'Karate', es: 'Karate' },
  { id: 16, key: 'taekwondo', fr: 'Taekwondo', en: 'Taekwondo', es: 'Taekwondo' },
  { id: 17, key: 'fencing', fr: 'Escrime', en: 'Fencing', es: 'Esgrima' },
  { id: 18, key: 'gymnastics', fr: 'Gymnastique', en: 'Gymnastics', es: 'Gimnasia' },
  { id: 19, key: 'athletics', fr: 'Athl\u00e9tisme', en: 'Athletics', es: 'Atletismo' },
  { id: 20, key: 'skiing', fr: 'Ski', en: 'Skiing', es: 'Esqu\u00ed' },
  { id: 21, key: 'snowboarding', fr: 'Snowboard', en: 'Snowboarding', es: 'Snowboard' },
  { id: 22, key: 'ice_hockey', fr: 'Hockey sur glace', en: 'Ice Hockey', es: 'Hockey sobre hielo' },
  { id: 23, key: 'field_hockey', fr: 'Hockey sur gazon', en: 'Field Hockey', es: 'Hockey hierba' },
  { id: 24, key: 'cricket', fr: 'Cricket', en: 'Cricket', es: 'Cr\u00edquet' },
  { id: 25, key: 'rowing', fr: 'Aviron', en: 'Rowing', es: 'Remo' },
  { id: 26, key: 'sailing', fr: 'Voile', en: 'Sailing', es: 'Vela' },
  { id: 27, key: 'surfing', fr: 'Surf', en: 'Surfing', es: 'Surf' },
  { id: 28, key: 'climbing', fr: 'Escalade', en: 'Climbing', es: 'Escalada' },
  { id: 29, key: 'skateboarding', fr: 'Skateboard', en: 'Skateboarding', es: 'Skateboard' },
  { id: 30, key: 'horse_riding', fr: '\u00c9quitation', en: 'Horse Riding', es: 'Equitaci\u00f3n' },
  { id: 31, key: 'archery', fr: "Tir \u00e0 l'arc", en: 'Archery', es: 'Tiro con arco' },
  { id: 32, key: 'shooting', fr: 'Tir sportif', en: 'Sport Shooting', es: 'Tiro deportivo' },
  { id: 33, key: 'triathlon', fr: 'Triathlon', en: 'Triathlon', es: 'Triatl\u00f3n' },
  { id: 34, key: 'weightlifting', fr: 'Halt\u00e9rophilie', en: 'Weightlifting', es: 'Halterofilia' },
  { id: 35, key: 'crossfit', fr: 'CrossFit', en: 'CrossFit', es: 'CrossFit' },
  { id: 36, key: 'yoga', fr: 'Yoga', en: 'Yoga', es: 'Yoga' },
  { id: 37, key: 'pilates', fr: 'Pilates', en: 'Pilates', es: 'Pilates' },
  { id: 38, key: 'dance', fr: 'Danse', en: 'Dance', es: 'Danza' },
  { id: 39, key: 'figure_skating', fr: 'Patinage artistique', en: 'Figure Skating', es: 'Patinaje art\u00edstico' },
  { id: 40, key: 'water_polo', fr: 'Water-polo', en: 'Water Polo', es: 'Waterpolo' },
  { id: 41, key: 'diving', fr: 'Plong\u00e9e', en: 'Diving', es: 'Buceo' },
  { id: 42, key: 'canoeing', fr: 'Cano\u00eb', en: 'Canoeing', es: 'Pirag\u00fcismo' },
  { id: 43, key: 'kayaking', fr: 'Kayak', en: 'Kayaking', es: 'Kayak' },
  { id: 44, key: 'windsurfing', fr: 'Planche \u00e0 voile', en: 'Windsurfing', es: 'Windsurf' },
  { id: 45, key: 'kitesurfing', fr: 'Kitesurf', en: 'Kitesurfing', es: 'Kitesurf' },
  { id: 46, key: 'padel', fr: 'Padel', en: 'Padel', es: 'P\u00e1del' },
  { id: 47, key: 'squash', fr: 'Squash', en: 'Squash', es: 'Squash' },
  { id: 48, key: 'bowling', fr: 'Bowling', en: 'Bowling', es: 'Bolos' },
  { id: 49, key: 'petanque', fr: 'P\u00e9tanque', en: 'P\u00e9tanque', es: 'Petanca' },
  { id: 50, key: 'darts', fr: 'Fl\u00e9chettes', en: 'Darts', es: 'Dardos' },
  { id: 51, key: 'billiards', fr: 'Billard', en: 'Billiards', es: 'Billar' },
  { id: 52, key: 'futsal', fr: 'Futsal', en: 'Futsal', es: 'Futsal' },
  { id: 53, key: 'beach_volleyball', fr: 'Beach-volley', en: 'Beach Volleyball', es: 'V\u00f3ley playa' },
  { id: 54, key: 'lacrosse', fr: 'Lacrosse', en: 'Lacrosse', es: 'Lacrosse' },
  { id: 55, key: 'baseball', fr: 'Baseball', en: 'Baseball', es: 'B\u00e9isbol' },
  { id: 56, key: 'softball', fr: 'Softball', en: 'Softball', es: 'S\u00f3ftbol' },
  { id: 57, key: 'american_football', fr: 'Football am\u00e9ricain', en: 'American Football', es: 'F\u00fatbol americano' },
  { id: 58, key: 'wrestling', fr: 'Lutte', en: 'Wrestling', es: 'Lucha' },
  { id: 59, key: 'mma', fr: 'MMA', en: 'MMA', es: 'MMA' },
  { id: 60, key: 'kickboxing', fr: 'Kickboxing', en: 'Kickboxing', es: 'Kickboxing' },
  { id: 61, key: 'muay_thai', fr: 'Muay Thai', en: 'Muay Thai', es: 'Muay Thai' },
  { id: 62, key: 'bjj', fr: 'Jiu-Jitsu br\u00e9silien', en: 'Brazilian Jiu-Jitsu', es: 'Jiu-Jitsu brasile\u00f1o' },
  { id: 63, key: 'aikido', fr: 'A\u00efkido', en: 'Aikido', es: 'Aikido' },
  { id: 64, key: 'krav_maga', fr: 'Krav Maga', en: 'Krav Maga', es: 'Krav Maga' },
  { id: 65, key: 'trail_running', fr: 'Trail', en: 'Trail Running', es: 'Trail Running' },
  { id: 66, key: 'mountain_biking', fr: 'VTT', en: 'Mountain Biking', es: 'Bicicleta de monta\u00f1a' },
  { id: 67, key: 'roller_skating', fr: 'Roller', en: 'Roller Skating', es: 'Patinaje' },
  { id: 68, key: 'ice_skating', fr: 'Patinage sur glace', en: 'Ice Skating', es: 'Patinaje sobre hielo' },
  { id: 69, key: 'cross_country_skiing', fr: 'Ski de fond', en: 'Cross-Country Skiing', es: 'Esqu\u00ed de fondo' },
  { id: 70, key: 'biathlon', fr: 'Biathlon', en: 'Biathlon', es: 'Biatl\u00f3n' },
  { id: 71, key: 'curling', fr: 'Curling', en: 'Curling', es: 'Curling' },
  { id: 72, key: 'polo', fr: 'Polo', en: 'Polo', es: 'Polo' },
  { id: 73, key: 'parkour', fr: 'Parkour', en: 'Parkour', es: 'Parkour' },
  { id: 74, key: 'trampoline', fr: 'Trampoline', en: 'Trampoline', es: 'Trampol\u00edn' },
  { id: 75, key: 'orienteering', fr: "Course d'orientation", en: 'Orienteering', es: 'Orientaci\u00f3n' },
  { id: 76, key: 'hiking', fr: 'Randonn\u00e9e', en: 'Hiking', es: 'Senderismo' },
  { id: 77, key: 'nordic_walking', fr: 'Marche nordique', en: 'Nordic Walking', es: 'Marcha n\u00f3rdica' },
  { id: 78, key: 'calisthenics', fr: 'Callisth\u00e9nie', en: 'Calisthenics', es: 'Calistenia' },
  { id: 79, key: 'paddle_boarding', fr: 'Stand-up paddle', en: 'Stand-Up Paddle', es: 'Paddle surf' },
  { id: 80, key: 'rock_climbing', fr: 'Escalade en bloc', en: 'Bouldering', es: 'B\u00falder' },
];

const LANGUAGES = [
  { code: 'fr', fr: 'Fran\u00e7ais', en: 'French', es: 'Franc\u00e9s' },
  { code: 'en', fr: 'Anglais', en: 'English', es: 'Ingl\u00e9s' },
  { code: 'es', fr: 'Espagnol', en: 'Spanish', es: 'Espa\u00f1ol' },
  { code: 'de', fr: 'Allemand', en: 'German', es: 'Alem\u00e1n' },
  { code: 'it', fr: 'Italien', en: 'Italian', es: 'Italiano' },
  { code: 'pt', fr: 'Portugais', en: 'Portuguese', es: 'Portugu\u00e9s' },
  { code: 'nl', fr: 'N\u00e9erlandais', en: 'Dutch', es: 'Neerland\u00e9s' },
  { code: 'pl', fr: 'Polonais', en: 'Polish', es: 'Polaco' },
  { code: 'ro', fr: 'Roumain', en: 'Romanian', es: 'Rumano' },
  { code: 'sv', fr: 'Su\u00e9dois', en: 'Swedish', es: 'Sueco' },
  { code: 'da', fr: 'Danois', en: 'Danish', es: 'Dan\u00e9s' },
  { code: 'fi', fr: 'Finnois', en: 'Finnish', es: 'Fin\u00e9s' },
  { code: 'el', fr: 'Grec', en: 'Greek', es: 'Griego' },
  { code: 'cs', fr: 'Tch\u00e8que', en: 'Czech', es: 'Checo' },
  { code: 'hu', fr: 'Hongrois', en: 'Hungarian', es: 'H\u00fangaro' },
  { code: 'hr', fr: 'Croate', en: 'Croatian', es: 'Croata' },
  { code: 'bg', fr: 'Bulgare', en: 'Bulgarian', es: 'B\u00falgaro' },
  { code: 'sk', fr: 'Slovaque', en: 'Slovak', es: 'Eslovaco' },
  { code: 'sl', fr: 'Slov\u00e8ne', en: 'Slovenian', es: 'Esloveno' },
  { code: 'et', fr: 'Estonien', en: 'Estonian', es: 'Estonio' },
  { code: 'lv', fr: 'Letton', en: 'Latvian', es: 'Let\u00f3n' },
  { code: 'lt', fr: 'Lituanien', en: 'Lithuanian', es: 'Lituano' },
  { code: 'ga', fr: 'Irlandais', en: 'Irish', es: 'Irland\u00e9s' },
  { code: 'mt', fr: 'Maltais', en: 'Maltese', es: 'Malt\u00e9s' },
  { code: 'ar', fr: 'Arabe', en: 'Arabic', es: '\u00c1rabe' },
  { code: 'tr', fr: 'Turc', en: 'Turkish', es: 'Turco' },
  { code: 'ru', fr: 'Russe', en: 'Russian', es: 'Ruso' },
  { code: 'uk', fr: 'Ukrainien', en: 'Ukrainian', es: 'Ucraniano' },
  { code: 'sr', fr: 'Serbe', en: 'Serbian', es: 'Serbio' },
  { code: 'no', fr: 'Norv\u00e9gien', en: 'Norwegian', es: 'Noruego' },
];

// ---------------------------------------------------------------------------
// Test users
// ---------------------------------------------------------------------------

const TEST_USERS = [
  { phone: '+33600000001', display_name: 'Alice Test' },
  { phone: '+33600000002', display_name: 'Bob Test' },
  { phone: '+33600000003', display_name: 'Charlie Test' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a multi-row INSERT ... ON CONFLICT DO NOTHING statement.
 *
 * @param {string} table - target table
 * @param {string[]} columns - column names
 * @param {Array<Array>} rows - array of value arrays (one per row)
 * @param {string} conflictTarget - e.g. "(key)" or "(code)"
 * @returns {{ text: string, values: any[] }}
 */
function bulkInsert(table, columns, rows, conflictTarget) {
  const values = [];
  const rowPlaceholders = [];

  rows.forEach((row, rowIdx) => {
    const placeholders = row.map((_, colIdx) => {
      values.push(row[colIdx]);
      return `$${values.length}`;
    });
    rowPlaceholders.push(`(${placeholders.join(', ')})`);
  });

  const text = [
    `INSERT INTO ${table} (${columns.join(', ')})`,
    `VALUES ${rowPlaceholders.join(',\n       ')}`,
    `ON CONFLICT ${conflictTarget} DO NOTHING`,
  ].join('\n');

  return { text, values };
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedSports(client) {
  console.log('Seeding sports...');
  const columns = ['id', 'key', 'name_fr', 'name_en', 'name_es', 'rank'];
  const rows = SPORTS.map((s) => [s.id, s.key, s.fr, s.en, s.es, s.id]);
  const q = bulkInsert('sports', columns, rows, '(key)');
  await client.query(q.text, q.values);
  // Reset the serial sequence to be above the max manually-inserted id
  await client.query("SELECT setval('sports_id_seq', (SELECT MAX(id) FROM sports))");
  console.log(`  -> ${SPORTS.length} sports seeded.`);
}

async function seedLanguages(client) {
  console.log('Seeding languages...');
  const columns = ['code', 'name_fr', 'name_en', 'name_es'];
  const rows = LANGUAGES.map((l) => [l.code, l.fr, l.en, l.es]);
  const q = bulkInsert('languages', columns, rows, '(code)');
  await client.query(q.text, q.values);
  console.log(`  -> ${LANGUAGES.length} languages seeded.`);
}

async function seedTestUsers(client) {
  console.log('Seeding test users...');

  const userIds = [];

  for (const user of TEST_USERS) {
    const { rows } = await client.query(
      `INSERT INTO users (phone_e164, phone_verified_at, display_name)
       VALUES ($1, NOW(), $2)
       ON CONFLICT (phone_e164) DO NOTHING
       RETURNING id`,
      [user.phone, user.display_name]
    );

    if (rows.length > 0) {
      userIds.push(rows[0].id);
      console.log(`  -> Created user ${user.display_name} (${user.phone})`);
    } else {
      // User already exists -- fetch their id for associations
      const existing = await client.query(
        'SELECT id FROM users WHERE phone_e164 = $1',
        [user.phone]
      );
      userIds.push(existing.rows[0].id);
      console.log(`  -> User ${user.display_name} already exists, skipping.`);
    }
  }

  return userIds;
}

async function seedUserSports(client, userIds) {
  console.log('Seeding user sports...');

  // Give each test user a few sports with different levels
  const assignments = [
    // Alice: football(3), tennis(4), yoga(2)
    { userId: userIds[0], sportId: 1, level: 3 },
    { userId: userIds[0], sportId: 3, level: 4 },
    { userId: userIds[0], sportId: 36, level: 2 },
    // Bob: basketball(5), swimming(3), running(4), padel(2)
    { userId: userIds[1], sportId: 2, level: 5 },
    { userId: userIds[1], sportId: 4, level: 3 },
    { userId: userIds[1], sportId: 5, level: 4 },
    { userId: userIds[1], sportId: 46, level: 2 },
    // Charlie: climbing(4), surfing(3), cycling(5)
    { userId: userIds[2], sportId: 28, level: 4 },
    { userId: userIds[2], sportId: 27, level: 3 },
    { userId: userIds[2], sportId: 6, level: 5 },
  ];

  for (const a of assignments) {
    await client.query(
      `INSERT INTO user_sports (user_id, sport_id, level)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, sport_id) DO NOTHING`,
      [a.userId, a.sportId, a.level]
    );
  }

  console.log(`  -> ${assignments.length} user-sport associations seeded.`);
}

async function seedUserLanguages(client, userIds) {
  console.log('Seeding user languages...');

  const assignments = [
    // Alice: French, English
    { userId: userIds[0], code: 'fr' },
    { userId: userIds[0], code: 'en' },
    // Bob: French, English, Spanish
    { userId: userIds[1], code: 'fr' },
    { userId: userIds[1], code: 'en' },
    { userId: userIds[1], code: 'es' },
    // Charlie: French, German
    { userId: userIds[2], code: 'fr' },
    { userId: userIds[2], code: 'de' },
  ];

  for (const a of assignments) {
    await client.query(
      `INSERT INTO user_languages (user_id, language_code)
       VALUES ($1, $2)
       ON CONFLICT (user_id, language_code) DO NOTHING`,
      [a.userId, a.code]
    );
  }

  console.log(`  -> ${assignments.length} user-language associations seeded.`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database.');
    console.log('Starting seed...\n');

    await seedSports(client);
    await seedLanguages(client);
    const userIds = await seedTestUsers(client);
    await seedUserSports(client, userIds);
    await seedUserLanguages(client, userIds);

    console.log('\nSeed completed successfully.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

seed();
