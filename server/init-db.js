const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'photographer.db');

function init() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS photographer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '摄影师',
      avatar TEXT DEFAULT '',
      intro TEXT DEFAULT '',
      wechat TEXT DEFAULT '',
      wechat_qrcode TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      xiaohongshu TEXT DEFAULT '',
      weibo TEXT DEFAULT '',
      studio_intro TEXT DEFAULT '',
      years_exp TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS banner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS service_item (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS studio_image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT DEFAULT '',
      caption TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS review (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      content TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS portfolio_category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES portfolio_category(id),
      title TEXT DEFAULT '',
      cover TEXT DEFAULT '',
      location TEXT DEFAULT '',
      shoot_date TEXT DEFAULT '',
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS portfolio_image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portfolio_id INTEGER REFERENCES portfolio(id) ON DELETE CASCADE,
      image_url TEXT DEFAULT '',
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS costume_category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS costume (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES costume_category(id),
      name TEXT DEFAULT '',
      cover TEXT DEFAULT '',
      size TEXT DEFAULT '',
      height_range TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status INTEGER DEFAULT 1,
      sort INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS costume_image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      costume_id INTEGER REFERENCES costume(id) ON DELETE CASCADE,
      image_url TEXT DEFAULT '',
      sort INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE NOT NULL,
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('✅ 数据库初始化完成:', DB_PATH);
  db.close();
}

init();
