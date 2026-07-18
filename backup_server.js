const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKUP_FILE = path.join(__dirname, 'maternopro_db_backup.json');

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/backup') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf8');
        
        // Also keep a history of backups (up to 5 versions) inside a backups folder
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const historyFile = path.join(backupDir, `maternopro_backup_${timestamp}.json`);
        fs.writeFileSync(historyFile, JSON.stringify(data, null, 2), 'utf8');
        
        // Rotate: keep only the 5 most recent files
        const files = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('maternopro_backup_') && f.endsWith('.json'))
          .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);
        
        if (files.length > 5) {
          for (let i = 5; i < files.length; i++) {
            try {
              fs.unlinkSync(path.join(backupDir, files[i].name));
            } catch(e) {}
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Backup saved successfully to ' + BACKUP_FILE }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/api/backup') {
    if (fs.existsSync(BACKUP_FILE)) {
      const data = fs.readFileSync(BACKUP_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No backup found' }));
    }
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(5000, 'localhost', () => {
  console.log('Antigravity Backup Server running on http://localhost:5000');
});
