const Database = require('better-sqlite3');
const db = new Database('wedding.db');

// Create the guests table
db.exec(`
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE,
    name TEXT NOT NULL,
    max_pax INTEGER NOT NULL,
    attending_pax INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'attending', 'declined', 'pending'
    notes TEXT,
    updated_at DATETIME
  )
`);

// Optional: Seed dummy data if the table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM guests').get();
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO guests (slug, name, max_pax) VALUES (?, ?, ?)');
  insert.run('philip-bobby', 'Philip Bobby & Keluarga', 4);
  insert.run('lilyana-faratasha', 'Lilyana Faratasha', 1);
  insert.run('boboy', 'Joshua & Pasangan', 2);
  console.log('Seeded initial guests!');
}

module.exports = db;