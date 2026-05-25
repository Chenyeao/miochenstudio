const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'photographer.db'));

db.prepare(`INSERT OR IGNORE INTO photographer (id, name, avatar, intro, years_exp, studio_intro, wechat, wechat_qrcode)
VALUES (1, 'Aibo Studio', '', '记录属于你的故事。
独立摄影师，5年人像摄影经验。
擅长汉服、Lolita、婚纱、Cosplay拍摄。',
'5年', 
'位于市中心的工作室，拥有专业影棚、化妆间和多个实景拍摄区域。
配备专业灯光设备，提供服装和妆造一站式服务。
欢迎来工作室参观了解。',
'photographer_wechat', '')`).run();

const insBanner = db.prepare('INSERT OR IGNORE INTO banner (id, title, subtitle, image_url, sort) VALUES (?, ?, ?, ?, ?)');
[['Aibo Studio', '记录属于你的故事'], ['汉服写真', '穿越时光的美丽'], ['婚纱摄影', '定格最幸福的瞬间']].forEach((b, i) => insBanner.run(i+1, b[0], b[1], '', i+1));

const insSvc = db.prepare('INSERT OR IGNORE INTO service_item (id, name, icon, sort) VALUES (?, ?, ?, ?)');
const svcs = [['汉服写真','🏮'],['Lolita写真','🎀'],['婚纱摄影','💒'],['Cos摄影','🎭'],['情侣写真','💑'],['个人写真','📸']];
svcs.forEach((s, i) => insSvc.run(i+1, s[0], s[1], i+1));

const insPfCat = db.prepare('INSERT OR IGNORE INTO portfolio_category (id, name, sort) VALUES (?, ?, ?)');
['婚纱','汉服','常服写真','Lolita','Cos','情侣','亲子'].forEach((c, i) => insPfCat.run(i+1, c, i+1));

const insCsCat = db.prepare('INSERT OR IGNORE INTO costume_category (id, name, sort) VALUES (?, ?, ?)');
['汉服','Lolita','JK','Cos服','婚纱','礼服'].forEach((c, i) => insCsCat.run(i+1, c, i+1));

const insPf = db.prepare('INSERT OR IGNORE INTO portfolio (id, title, category_id, cover, location, shoot_date, sort) VALUES (?, ?, ?, ?, ?, ?, ?)');
[['春日汉服外景',2,'颐和园','2025-03'],['梦幻Lolita棚拍',4,'工作室','2025-02'],['森系婚纱',1,'植物园','2025-01'],['暗黑Cos风',5,'影棚','2024-12']].forEach((p, i) => insPf.run(i+1, p[0], p[1], '', p[2], p[3], i+1));

const insCs = db.prepare('INSERT OR IGNORE INTO costume (id, name, category_id, cover, size, height_range, tags, notes, status, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)');
[['十三余·明制汉服',1,'M/L','160-170cm','明制,红色,大袖衫','包含头饰，可搭配团扇'],['古典·花嫁Lolita',2,'S/M','155-165cm','花嫁,白色,蝴蝶结','含裙撑和头饰'],['基础款水手JK',3,'M','155-170cm','水手服,蓝色,基础款','可搭配领结/领带']].forEach((c, i) => insCs.run(i+1, c[0], c[1], '', c[2], c[3], c[4], c[5], i+1));

const insRv = db.prepare('INSERT OR IGNORE INTO review (id, nickname, content, sort) VALUES (?, ?, ?, ?)');
[['小月','摄影师非常专业，拍出来的效果超出预期！'],['阿琳','第一次拍汉服写真，全程指导动作，成片很满意～'],['Cici','服装种类很多，小姐姐也很耐心帮忙搭配！']].forEach((r, i) => insRv.run(i+1, r[0], r[1], i+1));

console.log('✅ 示例数据写入完成');
db.close();
