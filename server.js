const express = require('express');
const db = require('./db');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const ADMIN_PASSWORD = "weddingadmin123"; // Change this!

// 1. Guest Invitation Page
app.get('/to/:slug', (req, res) => {
  const guest = db.prepare('SELECT * FROM guests WHERE slug = ?').get(req.params.slug);
  
  if (!guest) {
    return res.status(404).send('Invitation not found. Please check your link.');
  }

  res.render('invite', { guest, success: req.query.success === 'true' });
});

// 2. RSVP Submission Handler
app.post('/rsvp', (req, res) => {
  const { slug, attendance, pax, notes } = req.body;
  const guest = db.prepare('SELECT * FROM guests WHERE slug = ?').get(slug);

  if (!guest) return res.status(404).send('Guest not found');

  const status = attendance === 'yes' ? 'attending' : 'declined';
  const attendingPax = attendance === 'yes' ? Math.min(parseInt(pax), guest.max_pax) : 0;

  const update = db.prepare(`
    UPDATE guests 
    SET status = ?, attending_pax = ?, notes = ?, updated_at = datetime('now')
    WHERE slug = ?
  `);
  update.run(status, attendingPax, notes, slug);

  res.redirect(`/to/${slug}?success=true`);
});

// 3. Admin Dashboard
app.get('/admin', (req, res) => {
  // Simple query-param protection: /admin?pw=weddingadmin123
  if (req.query.pw !== ADMIN_PASSWORD) {
    return res.status(401).send('Unauthorized. Append ?pw=YOUR_PASSWORD to the URL.');
  }

  const guests = db.prepare('SELECT * FROM guests ORDER BY name ASC').all();
  
  const stats = {
    totalInvitedPax: guests.reduce((sum, g) => sum + g.max_pax, 0),
    totalConfirmedPax: guests.filter(g => g.status === 'attending').reduce((sum, g) => sum + g.attending_pax, 0),
    totalDeclined: guests.filter(g => g.status === 'declined').length,
    totalPending: guests.filter(g => g.status === 'pending').length
  };

  res.render('admin', { guests, stats, pw: req.query.pw });
});

// 4. Export to CSV for Excel
app.get('/admin/export', (req, res) => {
  if (req.query.pw !== ADMIN_PASSWORD) return res.status(401).send('Unauthorized');

  const guests = db.prepare('SELECT * FROM guests').all();
  let csv = 'Name,Max Pax,Status,Attending Pax,Notes,Updated At\n';

  guests.forEach(g => {
    csv += `"${g.name}",${g.max_pax},${g.status},${g.attending_pax},"${(g.notes || '').replace(/"/g, '""')}",${g.updated_at || ''}\n`;
  });

  res.header('Content-Type', 'text/csv');
  res.attachment('wedding_guest_list.csv');
  res.send(csv);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));