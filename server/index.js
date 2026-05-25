const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3800;
const DB_PATH = path.join(__dirname, 'photographer.db');

// ============================================================
// 数据库
// ============================================================
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 自动建表
const SCHEMA = `
CREATE TABLE IF NOT EXISTS photographer (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '摄影师', avatar TEXT DEFAULT '', intro TEXT DEFAULT '', wechat TEXT DEFAULT '', wechat_qrcode TEXT DEFAULT '', phone TEXT DEFAULT '', xiaohongshu TEXT DEFAULT '', weibo TEXT DEFAULT '', studio_intro TEXT DEFAULT '', years_exp TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS banner (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT DEFAULT '', subtitle TEXT DEFAULT '', image_url TEXT DEFAULT '', sort INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS service_item (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, icon TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS studio_image (id INTEGER PRIMARY KEY AUTOINCREMENT, image_url TEXT DEFAULT '', caption TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS review (id INTEGER PRIMARY KEY AUTOINCREMENT, nickname TEXT DEFAULT '', avatar TEXT DEFAULT '', content TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS portfolio_category (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS portfolio (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER, title TEXT DEFAULT '', cover TEXT DEFAULT '', location TEXT DEFAULT '', shoot_date TEXT DEFAULT '', sort INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS portfolio_image (id INTEGER PRIMARY KEY AUTOINCREMENT, portfolio_id INTEGER, image_url TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS costume_category (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS costume (id INTEGER PRIMARY KEY AUTOINCREMENT, category_id INTEGER, name TEXT DEFAULT '', cover TEXT DEFAULT '', size TEXT DEFAULT '', height_range TEXT DEFAULT '', tags TEXT DEFAULT '', notes TEXT DEFAULT '', status INTEGER DEFAULT 1, sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS costume_image (id INTEGER PRIMARY KEY AUTOINCREMENT, costume_id INTEGER, image_url TEXT DEFAULT '', sort INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY AUTOINCREMENT, openid TEXT UNIQUE NOT NULL, nickname TEXT DEFAULT '', avatar TEXT DEFAULT '');
`;
SCHEMA.split('CREATE TABLE').filter(Boolean).forEach(t => {
  try { db.exec('CREATE TABLE IF NOT EXISTS ' + t); } catch (e) {}
});

// ============================================================
// 中间件
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, '..', 'public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.random().toString(36).substring(2,8) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 10*1024*1024 }, fileFilter: (req, file, cb) => cb(null, /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path.extname(file.originalname))) });

// ============================================================
// 上传
// ============================================================
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  res.json({ url: '/uploads/' + req.file.filename });
});

app.post('/api/upload-multi', upload.array('files', 20), (req, res) => {
  if (!req.files) return res.status(400).json({ error: '请选择文件' });
  res.json({ urls: req.files.map(f => '/uploads/' + f.filename) });
});

// ============================================================
// 客户端 API
// ============================================================
app.get('/api/home', (req, res) => {
  res.json({
    photographer: db.prepare('SELECT * FROM photographer WHERE id = 1').get() || {},
    banners: db.prepare('SELECT * FROM banner ORDER BY sort ASC').all(),
    services: db.prepare('SELECT * FROM service_item ORDER BY sort ASC').all(),
    studioImages: db.prepare('SELECT * FROM studio_image ORDER BY sort ASC').all(),
    reviews: db.prepare('SELECT * FROM review ORDER BY sort ASC').all(),
    featured: db.prepare('SELECT * FROM portfolio_category ORDER BY sort ASC').all().map(cat => ({
      category: cat,
      portfolios: db.prepare('SELECT * FROM portfolio WHERE category_id = ? ORDER BY sort ASC LIMIT 3').all(cat.id)
    })).filter(g => g.portfolios.length > 0)
  });
});

app.get('/api/portfolios', (req, res) => {
  const { category_id } = req.query;
  res.json({
    categories: db.prepare('SELECT * FROM portfolio_category ORDER BY sort ASC').all(),
    portfolios: category_id && category_id !== 'all'
      ? db.prepare('SELECT * FROM portfolio WHERE category_id = ? ORDER BY sort ASC').all(category_id)
      : db.prepare('SELECT * FROM portfolio ORDER BY sort ASC').all()
  });
});

app.get('/api/portfolios/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM portfolio WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: '不存在' });
  p.images = db.prepare('SELECT * FROM portfolio_image WHERE portfolio_id = ? ORDER BY sort ASC').all(req.params.id);
  const cat = db.prepare('SELECT name FROM portfolio_category WHERE id = ?').get(p.category_id);
  p.category_name = cat ? cat.name : '';
  res.json(p);
});

app.get('/api/costumes', (req, res) => {
  const { category_id } = req.query;
  res.json({
    categories: db.prepare('SELECT * FROM costume_category ORDER BY sort ASC').all(),
    costumes: category_id && category_id !== 'all'
      ? db.prepare('SELECT * FROM costume WHERE category_id = ? AND status = 1 ORDER BY sort ASC').all(category_id)
      : db.prepare('SELECT * FROM costume WHERE status = 1 ORDER BY sort ASC').all()
  });
});

app.get('/api/costumes/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM costume WHERE id = ?').get(req.params.id);
  if (!c) return res.status(404).json({ error: '不存在' });
  c.images = db.prepare('SELECT * FROM costume_image WHERE costume_id = ? ORDER BY sort ASC').all(req.params.id);
  const cat = db.prepare('SELECT name FROM costume_category WHERE id = ?').get(c.category_id);
  c.category_name = cat ? cat.name : '';
  res.json(c);
});

app.get('/api/about', (req, res) => {
  res.json({
    photographer: db.prepare('SELECT * FROM photographer WHERE id = 1').get() || {},
    studioImages: db.prepare('SELECT * FROM studio_image ORDER BY sort ASC').all()
  });
});

// ============================================================
// 管理 API
// ============================================================
function auth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== 'photographer_admin_token') return res.status(401).json({ error: '未授权' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === 'admin123') {
    // 返回一个简单 token
    res.json({ success: true, token: 'photographer_admin_token', nickname: '摄影师' });
  } else {
    res.status(401).json({ error: '密码错误' });
  }
});

// 首页数据
app.get('/api/admin/home', auth, (req, res) => {
  res.json({
    photographer: db.prepare('SELECT * FROM photographer WHERE id = 1').get() || {},
    banners: db.prepare('SELECT * FROM banner ORDER BY sort ASC').all(),
    services: db.prepare('SELECT * FROM service_item ORDER BY sort ASC').all(),
    studioImages: db.prepare('SELECT * FROM studio_image ORDER BY sort ASC').all(),
    reviews: db.prepare('SELECT * FROM review ORDER BY sort ASC').all()
  });
});

app.put('/api/admin/photographer', auth, (req, res) => {
  const d = req.body;
  const e = db.prepare('SELECT id FROM photographer WHERE id = 1').get();
  if (e) {
    db.prepare('UPDATE photographer SET name=?,avatar=?,intro=?,years_exp=?,studio_intro=?,updated_at=CURRENT_TIMESTAMP WHERE id=1')
      .run(d.name||'', d.avatar||'', d.intro||'', d.years_exp||'', d.studio_intro||'');
  } else {
    db.prepare('INSERT INTO photographer(id,name,avatar,intro,years_exp,studio_intro) VALUES(1,?,?,?,?,?)')
      .run(d.name||'', d.avatar||'', d.intro||'', d.years_exp||'', d.studio_intro||'');
  }
  res.json({ success: true });
});

// Banner
app.get('/api/admin/banners', auth, (req, res) => res.json(db.prepare('SELECT * FROM banner ORDER BY sort ASC').all()));
app.post('/api/admin/banners', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM banner').get();
  res.json({ id: db.prepare('INSERT INTO banner(title,subtitle,image_url,sort) VALUES(?,?,?,?)').run(d.title||'', d.subtitle||'', d.image_url||'', s.s).lastInsertRowid });
});
app.delete('/api/admin/banners/:id', auth, (req, res) => { db.prepare('DELETE FROM banner WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 服务
app.get('/api/admin/services', auth, (req, res) => res.json(db.prepare('SELECT * FROM service_item ORDER BY sort ASC').all()));
app.post('/api/admin/services', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM service_item').get();
  res.json({ id: db.prepare('INSERT INTO service_item(name,icon,sort) VALUES(?,?,?)').run(d.name, d.icon||'', s.s).lastInsertRowid });
});
app.delete('/api/admin/services/:id', auth, (req, res) => { db.prepare('DELETE FROM service_item WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 工作室图片
app.get('/api/admin/studio-images', auth, (req, res) => res.json(db.prepare('SELECT * FROM studio_image ORDER BY sort ASC').all()));
app.post('/api/admin/studio-images', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM studio_image').get();
  res.json({ id: db.prepare('INSERT INTO studio_image(image_url,caption,sort) VALUES(?,?,?)').run(d.image_url||'', d.caption||'', s.s).lastInsertRowid });
});
app.delete('/api/admin/studio-images/:id', auth, (req, res) => { db.prepare('DELETE FROM studio_image WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 评价
app.get('/api/admin/reviews', auth, (req, res) => res.json(db.prepare('SELECT * FROM review ORDER BY sort ASC').all()));
app.post('/api/admin/reviews', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM review').get();
  res.json({ id: db.prepare('INSERT INTO review(nickname,avatar,content,sort) VALUES(?,?,?,?)').run(d.nickname||'', d.avatar||'', d.content||'', s.s).lastInsertRowid });
});
app.delete('/api/admin/reviews/:id', auth, (req, res) => { db.prepare('DELETE FROM review WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 作品
app.get('/api/admin/portfolios', auth, (req, res) => {
  res.json({ categories: db.prepare('SELECT * FROM portfolio_category ORDER BY sort ASC').all(), portfolios: db.prepare('SELECT * FROM portfolio ORDER BY sort ASC').all() });
});
app.post('/api/admin/portfolios', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM portfolio').get();
  res.json({ id: db.prepare('INSERT INTO portfolio(title,category_id,cover,location,shoot_date,sort) VALUES(?,?,?,?,?,?)').run(d.title||'', d.category_id||1, d.cover||'', d.location||'', d.shoot_date||'', s.s).lastInsertRowid });
});
app.put('/api/admin/portfolios/:id', auth, (req, res) => {
  const d = req.body;
  db.prepare('UPDATE portfolio SET title=?,category_id=?,cover=?,location=?,shoot_date=?,sort=? WHERE id=?').run(d.title||'', d.category_id||1, d.cover||'', d.location||'', d.shoot_date||'', d.sort||0, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/portfolios/:id', auth, (req, res) => { db.prepare('DELETE FROM portfolio WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 作品图片
app.post('/api/admin/portfolio-images', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM portfolio_image WHERE portfolio_id=?').get(d.portfolio_id);
  res.json({ id: db.prepare('INSERT INTO portfolio_image(portfolio_id,image_url,sort) VALUES(?,?,?)').run(d.portfolio_id, d.image_url||'', s.s).lastInsertRowid });
});
app.delete('/api/admin/portfolio-images/:id', auth, (req, res) => { db.prepare('DELETE FROM portfolio_image WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 作品分类
app.get('/api/admin/portfolio-categories', auth, (req, res) => res.json(db.prepare('SELECT * FROM portfolio_category ORDER BY sort ASC').all()));
app.post('/api/admin/portfolio-categories', auth, (req, res) => {
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM portfolio_category').get();
  res.json({ id: db.prepare('INSERT INTO portfolio_category(name,sort) VALUES(?,?)').run(req.body.name, s.s).lastInsertRowid });
});
app.delete('/api/admin/portfolio-categories/:id', auth, (req, res) => { db.prepare('DELETE FROM portfolio_category WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 服装
app.get('/api/admin/costumes', auth, (req, res) => {
  res.json({ categories: db.prepare('SELECT * FROM costume_category ORDER BY sort ASC').all(), costumes: db.prepare('SELECT * FROM costume ORDER BY sort ASC').all() });
});
app.post('/api/admin/costumes', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM costume').get();
  res.json({ id: db.prepare('INSERT INTO costume(name,category_id,cover,size,height_range,tags,notes,sort) VALUES(?,?,?,?,?,?,?,?)').run(d.name||'', d.category_id||1, d.cover||'', d.size||'', d.height_range||'', d.tags||'', d.notes||'', s.s).lastInsertRowid });
});
app.put('/api/admin/costumes/:id', auth, (req, res) => {
  const d = req.body;
  db.prepare('UPDATE costume SET name=?,category_id=?,cover=?,size=?,height_range=?,tags=?,notes=?,status=?,sort=? WHERE id=?')
    .run(d.name||'', d.category_id||1, d.cover||'', d.size||'', d.height_range||'', d.tags||'', d.notes||'', d.status??1, d.sort||0, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/costumes/:id', auth, (req, res) => { db.prepare('DELETE FROM costume WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 服装图片
app.post('/api/admin/costume-images', auth, (req, res) => {
  const d = req.body;
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM costume_image WHERE costume_id=?').get(d.costume_id);
  res.json({ id: db.prepare('INSERT INTO costume_image(costume_id,image_url,sort) VALUES(?,?,?)').run(d.costume_id, d.image_url||'', s.s).lastInsertRowid });
});
app.delete('/api/admin/costume-images/:id', auth, (req, res) => { db.prepare('DELETE FROM costume_image WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 服装分类
app.get('/api/admin/costume-categories', auth, (req, res) => res.json(db.prepare('SELECT * FROM costume_category ORDER BY sort ASC').all()));
app.post('/api/admin/costume-categories', auth, (req, res) => {
  const s = db.prepare('SELECT COALESCE(MAX(sort),0)+1 AS s FROM costume_category').get();
  res.json({ id: db.prepare('INSERT INTO costume_category(name,sort) VALUES(?,?)').run(req.body.name, s.s).lastInsertRowid });
});
app.delete('/api/admin/costume-categories/:id', auth, (req, res) => { db.prepare('DELETE FROM costume_category WHERE id=?').run(req.params.id); res.json({ success: true }); });

// 联系方式
app.get('/api/admin/contact', auth, (req, res) => {
  res.json(db.prepare('SELECT wechat,wechat_qrcode,phone,xiaohongshu,weibo FROM photographer WHERE id=1').get() || {});
});
app.put('/api/admin/contact', auth, (req, res) => {
  const d = req.body;
  const e = db.prepare('SELECT id FROM photographer WHERE id=1').get();
  if (e) {
    db.prepare('UPDATE photographer SET wechat=?,wechat_qrcode=?,phone=?,xiaohongshu=?,weibo=?,updated_at=CURRENT_TIMESTAMP WHERE id=1')
      .run(d.wechat||'', d.wechat_qrcode||'', d.phone||'', d.xiaohongshu||'', d.weibo||'');
  } else {
    db.prepare('INSERT INTO photographer(id,wechat,wechat_qrcode,phone,xiaohongshu,weibo) VALUES(1,?,?,?,?,?)')
      .run(d.wechat||'', d.wechat_qrcode||'', d.phone||'', d.xiaohongshu||'', d.weibo||'');
  }
  res.json({ success: true });
});

// ============================================================
// SPA 路由：所有前端页面都走这里
// ============================================================
const pages = ['/', '/portfolio', '/costume', '/about', '/admin', '/admin-login'];
app.get(pages, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ============================================================
// 启动
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`📸 摄影师网站服务运行中: http://localhost:${PORT}`);
  console.log(`📁 上传目录: ${UPLOAD_DIR}`);
});
