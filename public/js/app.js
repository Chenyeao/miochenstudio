// ============================================================
// Aibo Studio - SPA App (重构版)
// 功能：首页 / 作品集 / 服装馆 / 用户系统 / 管理后台
// ============================================================

const ADMIN_TOKEN_KEY = 'admin_token';
const USER_KEY = 'current_user';
let _wechat = '';

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

function onBook() {
  if (_wechat) { navigator.clipboard.writeText(_wechat).then(() => showToast('微信号已复制')).catch(() => showToast('微信号：' + _wechat)); }
  else { showToast('请联系摄影师获取微信号'); }
}

function copyText(text, msg) {
  navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(() => showToast(text));
}

function imgOrPlaceholder(url, alt, cls) {
  if (url) return '<img src="' + url + '" alt="' + alt + '" class="' + cls + '" onerror="this.style.display=\'none\'" />';
  return '<div class="' + cls + '" style="background:#EDE8E2;display:flex;align-items:center;justify-content:center;color:#bbb;font-size:12px">暂无图片</div>';
}

function route(path) {
  history.pushState(null, '', path);
  render(path);
  return false;
}
window.addEventListener('popstate', () => render(location.pathname));

// ============================================================
// 路由入口
// ============================================================
function render(path) {
  const c = document.getElementById('pageContent');
  const tabs = document.getElementById('bottomTabs');
  const book = document.getElementById('floatBook');
  const nav = document.getElementById('navLinks');
  const back = document.getElementById('backBtn');
  const brand = document.querySelector('.nav-brand');

  if (path.startsWith('/admin')) {
    tabs.style.display = 'none'; book.style.display = 'none';
    nav.style.display = 'none'; back.style.display = 'inline-flex';
    brand.textContent = '管理后台';
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  } else if (path === '/user') {
    tabs.style.display = 'flex'; book.style.display = 'flex';
    nav.style.display = 'flex'; back.style.display = 'none';
    brand.textContent = 'Aibo Studio';
    document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.getAttribute('href') === '/user'));
  } else {
    tabs.style.display = 'flex'; book.style.display = 'flex';
    nav.style.display = 'flex'; back.style.display = 'none';
    brand.textContent = 'Aibo Studio';
    document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.getAttribute('href') === path));
  }

  if (path === '/' || path === '') renderHome(c);
  else if (path === '/portfolio') renderPortfolio(c);
  else if (path.startsWith('/portfolio/')) renderPortfolioDetail(c, path.split('/')[2]);
  else if (path === '/costume') renderCostume(c);
  else if (path.startsWith('/costume/')) renderCostumeDetail(c, path.split('/')[2]);
  else if (path === '/user') renderUser(c);
  else if (path === '/admin-login') renderAdminLogin(c);
  else if (path === '/admin') renderAdmin(c);
  else if (path.startsWith('/admin/')) renderAdminPage(c, path);
  else renderHome(c);
}

// ============================================================
// 首页
// ============================================================
async function renderHome(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const res = await fetch('/api/home').then(r => r.json());
    _wechat = res.photographer?.wechat || '';
    const p = res.photographer || {};
    const banners = res.banners || [];
    const services = res.services || [];
    const featured = res.featured || [];
    const studioImages = res.studioImages || [];
    const reviews = res.reviews || [];
    let html = '';

    if (banners.length) {
      html += '<div class="banner"><div class="banner-track" id="bannerTrack">';
      banners.forEach(b => { html += '<div class="banner-slide">' + imgOrPlaceholder(b.image_url, b.title, 'banner-img') + '</div>'; });
      html += '</div><div class="banner-dots" id="bannerDots">';
      banners.forEach((_, i) => { html += '<span class="banner-dot' + (i===0?' active':'') + '"></span>'; });
      html += '</div><div class="banner-overlay"><h1>' + (banners[0].title||'') + '</h1><p>' + (banners[0].subtitle||'') + '</p></div></div>';
    }

    html += '<div class="profile-card">' +
      imgOrPlaceholder(p.avatar, '头像', 'profile-avatar') +
      '<div class="profile-info"><span class="profile-name">' + (p.name||'摄影师') + '</span>' +
      (p.years_exp ? '<span class="profile-years">' + p.years_exp + '从业经验</span>' : '') +
      '<span class="profile-intro">' + (p.intro||'').replace(/\n/g,'<br>') + '</span></div></div>';

    if (services.length) {
      html += '<div class="section"><div class="section-title">服务项目</div><div class="services-grid">';
      services.forEach(s => { html += '<div class="service-item"><div class="service-icon">' + (s.icon||'📷') + '</div><span class="service-name">' + s.name + '</span></div>'; });
      html += '</div></div>';
    }

    if (featured.length) {
      html += '<div class="section"><div class="section-title">精选作品</div><div class="featured-scroll"><div class="featured-track">';
      featured.forEach(g => { g.portfolios.forEach(pf => {
        html += '<div class="featured-card" onclick="route(\'/portfolio/' + pf.id + '\')">' + imgOrPlaceholder(pf.cover, pf.title, 'featured-img') + '<span class="featured-label">' + g.category.name + ' · ' + pf.title + '</span></div>';
      }); });
      html += '</div></div></div>';
    }

    if (studioImages.length) {
      html += '<div class="section"><div class="section-title">工作室环境</div><div class="studio-scroll"><div class="studio-track">';
      studioImages.forEach(si => { html += '<div>' + imgOrPlaceholder(si.image_url, si.caption, 'studio-img') + (si.caption?'<div class="studio-caption">' + si.caption + '</div>':'') + '</div>'; });
      html += '</div></div></div>';
    }

    if (reviews.length) {
      html += '<div class="section"><div class="section-title">客户评价</div>';
      reviews.forEach(r => { html += '<div class="review-item"><div class="review-header">' + imgOrPlaceholder(r.avatar, r.nickname, 'review-avatar') + '<span class="review-name">' + r.nickname + '</span></div><div class="review-content">' + r.content + '</div></div>'; });
      html += '</div>';
    }

    c.innerHTML = html;

    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    if (track && dots && banners.length > 1) {
      let idx = 0;
      setInterval(() => {
        idx = (idx + 1) % banners.length;
        track.style.transform = 'translateX(-' + (idx*100) + '%)';
        dots.querySelectorAll('.banner-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
      }, 4000);
    }
  } catch (e) { c.innerHTML = '<div class="empty-state">加载失败，请检查服务器</div>'; }
}

// ============================================================
// 作品集
// ============================================================
async function renderPortfolio(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const res = await fetch('/api/portfolios').then(r => r.json());
    const categories = res.categories || [];
    const portfolios = res.portfolios || [];
    let html = '<div class="tab-bar"><span class="tab-item-tab active" data-id="all" onclick="switchPortfolioTab(\'all\',this)">全部</span>';
    categories.forEach(cat => { html += '<span class="tab-item-tab" data-id="' + cat.id + '" onclick="switchPortfolioTab(\'' + cat.id + '\',this)">' + cat.name + '</span>'; });
    html += '</div><div class="card-grid" id="portfolioGrid">';
    portfolios.forEach(p => {
      html += '<div class="card-grid-item" onclick="route(\'/portfolio/' + p.id + '\')">' + imgOrPlaceholder(p.cover, p.title, 'card-grid-cover') + '<div class="card-grid-info"><span class="card-grid-title">' + p.title + '</span></div></div>';
    });
    html += '</div>';
    if (!portfolios.length) html += '<div class="empty-state">暂无作品</div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function switchPortfolioTab(catId, el) {
  document.querySelectorAll('.tab-item-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  try {
    const res = await fetch('/api/portfolios' + (catId!=='all'?'?category_id='+catId:'')).then(r => r.json());
    const grid = document.getElementById('portfolioGrid');
    let html = '';
    (res.portfolios||[]).forEach(p => { html += '<div class="card-grid-item" onclick="route(\'/portfolio/' + p.id + '\')">' + imgOrPlaceholder(p.cover, p.title, 'card-grid-cover') + '<div class="card-grid-info"><span class="card-grid-title">' + p.title + '</span></div></div>'; });
    grid.innerHTML = html || '<div class="empty-state">暂无作品</div>';
  } catch(e) {}
}

async function renderPortfolioDetail(c, id) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const p = await fetch('/api/portfolios/' + id).then(r => r.json());
    let html = '';
    if (p.images && p.images.length) {
      if (p.images.length > 1) { html += '<div class="detail-swiper">'; p.images.forEach(img => { html += imgOrPlaceholder(img.image_url, '', 'detail-swiper-img'); }); html += '</div>'; }
      else { html += imgOrPlaceholder(p.images[0].image_url, '', 'detail-img'); }
    } else { html += imgOrPlaceholder(p.cover, '', 'detail-img'); }
    html += '<div class="detail-body"><span class="detail-title">' + p.title + '</span><div class="detail-meta-card">' +
      (p.category_name ? '<div class="meta-row"><span class="meta-label">分类</span><span class="meta-value">' + p.category_name + '</span></div>' : '') +
      (p.shoot_date ? '<div class="meta-row"><span class="meta-label">拍摄时间</span><span class="meta-value">' + p.shoot_date + '</span></div>' : '') +
      (p.location ? '<div class="meta-row"><span class="meta-label">拍摄地点</span><span class="meta-value">' + p.location + '</span></div>' : '') +
      '</div></div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">作品不存在</div>'; }
}

// ============================================================
// 服装馆
// ============================================================
async function renderCostume(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const res = await fetch('/api/costumes').then(r => r.json());
    const categories = res.categories || [];
    const costumes = res.costumes || [];
    let html = '<div class="tab-bar"><span class="tab-item-tab active" data-id="all" onclick="switchCostumeTab(\'all\',this)">全部</span>';
    categories.forEach(cat => { html += '<span class="tab-item-tab" data-id="' + cat.id + '" onclick="switchCostumeTab(\'' + cat.id + '\',this)">' + cat.name + '</span>'; });
    html += '</div><div class="card-grid" id="costumeGrid">';
    costumes.forEach(c => {
      const tags = c.tags ? c.tags.split(',').map(t => '<span class="tag">' + t.trim() + '</span>').join('') : '';
      html += '<div class="card-grid-item" onclick="route(\'/costume/' + c.id + '\')">' + imgOrPlaceholder(c.cover, c.name, 'card-grid-cover') + '<div class="card-grid-info"><span class="card-grid-title">' + c.name + '</span><div class="card-grid-tags">' + tags + '</div></div></div>';
    });
    html += '</div>';
    if (!costumes.length) html += '<div class="empty-state">暂无服装</div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function switchCostumeTab(catId, el) {
  document.querySelectorAll('.tab-item-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  try {
    const res = await fetch('/api/costumes' + (catId!=='all'?'?category_id='+catId:'')).then(r => r.json());
    const grid = document.getElementById('costumeGrid');
    let html = '';
    (res.costumes||[]).forEach(c => {
      const tags = c.tags ? c.tags.split(',').map(t => '<span class="tag">' + t.trim() + '</span>').join('') : '';
      html += '<div class="card-grid-item" onclick="route(\'/costume/' + c.id + '\')">' + imgOrPlaceholder(c.cover, c.name, 'card-grid-cover') + '<div class="card-grid-info"><span class="card-grid-title">' + c.name + '</span><div class="card-grid-tags">' + tags + '</div></div></div>';
    });
    grid.innerHTML = html || '<div class="empty-state">暂无服装</div>';
  } catch(e) {}
}

async function renderCostumeDetail(c, id) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const d = await fetch('/api/costumes/' + id).then(r => r.json());
    let html = '';
    if (d.images && d.images.length) {
      if (d.images.length > 1) { html += '<div class="detail-swiper">'; d.images.forEach(img => { html += imgOrPlaceholder(img.image_url, '', 'detail-swiper-img'); }); html += '</div>'; }
      else { html += imgOrPlaceholder(d.images[0].image_url, '', 'detail-img'); }
    } else { html += imgOrPlaceholder(d.cover, '', 'detail-img'); }
    html += '<div class="detail-body"><span class="detail-title">' + d.name + '</span><div class="detail-meta-card">' +
      (d.category_name ? '<div class="meta-row"><span class="meta-label">分类</span><span class="meta-value">' + d.category_name + '</span></div>' : '') +
      (d.size ? '<div class="meta-row"><span class="meta-label">尺码</span><span class="meta-value">' + d.size + '</span></div>' : '') +
      (d.height_range ? '<div class="meta-row"><span class="meta-label">适合身高</span><span class="meta-value">' + d.height_range + '</span></div>' : '') +
      '</div>';
    if (d.tags) html += '<div style="padding:0 16px">' + d.tags.split(',').map(t => '<span class="tag tag-gold">' + t.trim() + '</span>').join('') + '</div>';
    if (d.notes) html += '<div class="detail-notes"><h4>备注</h4><p>' + d.notes + '</p></div>';
    html += '</div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">服装不存在</div>'; }
}

// ============================================================
// 用户页面（替代原来的"关于"）
// ============================================================
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch(e) { return null; }
}

function renderUser(c) {
  const user = getCurrentUser();
  if (user) {
    renderUserProfile(c, user);
  } else {
    renderUserLogin(c);
  }
}

function renderUserLogin(c) {
  c.innerHTML = '<div class="hero-section"><div style="padding:32px 16px;text-align:center"><span style="font-size:48px">📸</span><span class="hero-name" style="margin-top:12px">我的</span><div class="hero-desc">登录或注册账号，管理个人信息</div></div>' +
    '<div style="padding:0 24px"><div class="form-group"><label class="form-label">用户名</label><input class="form-input" id="ul_username" placeholder="设置你的用户名" /></div>' +
    '<div class="form-group"><label class="form-label">密码</label><input class="form-input" type="password" id="ul_password" placeholder="设置密码" /></div>' +
    '<div style="display:flex;gap:12px;margin-top:24px"><button class="btn btn-secondary" style="flex:1" onclick="userLogin()">登录</button><button class="btn btn-primary" style="flex:1" onclick="userRegister()">注册</button></div>' +
    '<p style="text-align:center;font-size:12px;color:var(--text-tertiary);margin-top:24px">注册后可管理个人资料，便于后续服务</p></div></div>';
}

async function userLogin() {
  const username = document.getElementById('ul_username').value.trim();
  const password = document.getElementById('ul_password').value.trim();
  if (!username || !password) return showToast('请填写用户名和密码');
  try {
    const res = await fetch('/api/user/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) }).then(r => r.json());
    if (res.success) {
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      showToast('登录成功');
      route('/user');
    } else { showToast(res.error||'登录失败'); }
  } catch(e) { showToast('网络错误'); }
}

async function userRegister() {
  const username = document.getElementById('ul_username').value.trim();
  const password = document.getElementById('ul_password').value.trim();
  if (!username || !password) return showToast('请填写用户名和密码');
  if (password.length < 3) return showToast('密码至少3位');
  try {
    const res = await fetch('/api/user/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password,nickname:username}) }).then(r => r.json());
    if (res.success) {
      showToast('注册成功，请登录');
      // 自动登录
      const loginRes = await fetch('/api/user/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username,password}) }).then(r => r.json());
      if (loginRes.success) { localStorage.setItem(USER_KEY, JSON.stringify(loginRes.user)); route('/user'); }
    } else { showToast(res.error||'注册失败'); }
  } catch(e) { showToast('网络错误'); }
}

function renderUserProfile(c, user) {
  c.innerHTML = '<div class="hero-section"><div style="padding:32px 16px;text-align:center">' +
    imgOrPlaceholder(user.avatar, user.nickname, 'hero-avatar') +
    '<span class="hero-name">' + user.nickname + '</span><span class="hero-desc">用户 ID: ' + user.id + '</span></div>' +
    '<div style="padding:0 16px 24px"><div class="section" style="padding:0;margin:0"><div class="contact-card">' +
    '<div class="form-group"><label class="form-label">昵称</label><input class="form-input" id="up_nickname" value="' + htmlEscape(user.nickname||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">年龄</label><input class="form-input" id="up_age" type="number" value="' + (user.age||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">性别</label><select class="form-input" id="up_gender"><option value="" ' + (!user.gender?'selected':'') + '>未设置</option><option value="男" ' + (user.gender==='男'?'selected':'') + '>男</option><option value="女" ' + (user.gender==='女'?'selected':'') + '>女</option></select></div>' +
    '<div class="form-group"><label class="form-label">手机号</label><input class="form-input" id="up_phone" value="' + htmlEscape(user.phone||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">头像 URL</label><input class="form-input" id="up_avatar" value="' + htmlEscape(user.avatar||'') + '" /></div>' +
    '<div style="display:flex;gap:12px;margin-top:16px"><button class="btn btn-primary" style="flex:1" onclick="saveUserProfile()">保存资料</button><button class="btn btn-danger" style="flex:1" onclick="userLogout()">退出登录</button></div>' +
    '</div></div></div></div>';
}

async function saveUserProfile() {
  const user = getCurrentUser();
  if (!user) return;
  const data = {
    id: user.id,
    nickname: document.getElementById('up_nickname').value,
    age: parseInt(document.getElementById('up_age').value) || 0,
    gender: document.getElementById('up_gender').value,
    phone: document.getElementById('up_phone').value,
    avatar: document.getElementById('up_avatar').value
  };
  try {
    await fetch('/api/user/profile', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).then(r => r.json());
    Object.assign(user, data);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    showToast('保存成功');
  } catch(e) { showToast('保存失败'); }
}

function userLogout() {
  localStorage.removeItem(USER_KEY);
  showToast('已退出');
  route('/user');
}

// ============================================================
// 管理后台
// ============================================================
function renderAdminLogin(c) {
  c.innerHTML = '<div class="admin-login-box"><h2>管理员登录</h2><p>请输入管理密码</p><input class="admin-login-input" type="password" id="adminPwd" placeholder="输入密码" onkeydown="if(event.key===\'Enter\') adminLogin()" /><button class="btn btn-primary" onclick="adminLogin()">登录</button></div>';
}

async function adminLogin() {
  const pwd = document.getElementById('adminPwd').value;
  if (!pwd) return showToast('请输入密码');
  try {
    const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pwd}) }).then(r => r.json());
    if (res.success) { localStorage.setItem(ADMIN_TOKEN_KEY, res.token); showToast('登录成功'); route('/admin'); }
    else showToast('密码错误');
  } catch(e) { showToast('登录失败'); }
}

function getToken() { return localStorage.getItem(ADMIN_TOKEN_KEY); }

function adminFetch(url, opts) {
  opts = opts || {};
  const token = getToken();
  if (!token) { route('/admin-login'); return Promise.reject(); }
  var headers = opts.headers || {};
  headers['Content-Type'] = 'application/json';
  headers['X-Admin-Token'] = token;
  opts.headers = headers;
  return fetch(url, opts).then(function(r) {
    if (r.status === 401) { route('/admin-login'); throw new Error('unauth'); }
    return r.json();
  });
}

function htmlEscape(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderAdmin(c) {
  var token = getToken();
  if (!token) { renderAdminLogin(c); return; }
  c.innerHTML = '<div class="admin-page"><div class="admin-header"><span class="admin-title">管理后台</span><button class="btn btn-text" onclick="localStorage.removeItem(\'' + ADMIN_TOKEN_KEY + '\');route(\'/admin-login\')">退出</button></div><div class="admin-menu">' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/home\')"><div class="admin-menu-icon" style="background:#F5EDDC">🏠</div><div><span class="admin-menu-label">首页管理</span><span class="admin-menu-desc">Banner、简介、服务项目</span></div></a>' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/portfolio\')"><div class="admin-menu-icon" style="background:#F0E6D0">🖼️</div><div><span class="admin-menu-label">作品管理</span><span class="admin-menu-desc">上传、编辑、分类标签</span></div></a>' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/costume\')"><div class="admin-menu-icon" style="background:#EDE0C8">👗</div><div><span class="admin-menu-label">服装管理</span><span class="admin-menu-desc">服装库、分类、上下架</span></div></a>' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/contact\')"><div class="admin-menu-icon" style="background:#F5EDDC">📞</div><div><span class="admin-menu-label">联系方式</span><span class="admin-menu-desc">微信、电话、社交链接</span></div></a>' +
    '</div></div>';
}

function renderAdminPage(c, path) {
  var token = getToken();
  if (!token) { renderAdminLogin(c); return; }
  if (path === '/admin/home') renderAdminHome(c);
  else if (path === '/admin/portfolio') renderAdminPortfolio(c);
  else if (path === '/admin/costume') renderAdminCostume(c);
  else if (path === '/admin/contact') renderAdminContact(c);
}

// ============================================================
// 后台 - 首页管理
// ============================================================
async function renderAdminHome(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    var res = await adminFetch('/api/admin/home');
    var p = res.photographer || {};
    var html = '<div class="admin-page"><div class="admin-section"><span class="admin-section-title">摄影师信息</span>' +
      '<div class="form-group"><label class="form-label">姓名</label><input class="form-input" id="ph_name" value="' + htmlEscape(p.name||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">头像 URL</label><input class="form-input" id="ph_avatar" value="' + htmlEscape(p.avatar||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">从业年限</label><input class="form-input" id="ph_years" value="' + htmlEscape(p.years_exp||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">个人介绍</label><textarea class="form-textarea" id="ph_intro">' + htmlEscape(p.intro||'') + '</textarea></div>' +
      '<div class="form-group"><label class="form-label">工作室介绍</label><textarea class="form-textarea" id="ph_studio">' + htmlEscape(p.studio_intro||'') + '</textarea></div>' +
      '<button class="btn btn-primary" onclick="savePhotographer()">保存信息</button></div>';

    html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="margin-bottom:0;border:none;padding:0">Banner 管理</span><button class="add-btn" onclick="showPromptModal(\'新增 Banner\',\'标题\',\'图片URL(可选)\',function(t,i){adminFetch(\'/api/admin/banners\',{method:\'POST\',body:JSON.stringify({title:t,image_url:i||\'\',subtitle:\'\'})}).then(function(){renderAdminHome(document.getElementById(\'pageContent\'))}).catch(function(){})})">+ 新增</button></div><div id="bannerList">';
    (res.banners||[]).forEach(function(b) {
      html += '<div class="list-item-admin"><div style="width:50px;height:50px;border-radius:4px;background:#eee;flex-shrink:0;overflow:hidden">' + imgOrPlaceholder(b.image_url,'','list-thumb') + '</div><div class="list-info"><span class="list-title">' + htmlEscape(b.title) + '</span><span class="list-desc">' + htmlEscape(b.subtitle) + '</span></div><button class="list-del-btn" onclick="confirmDelete(\'确认删除\',function(){adminFetch(\'/api/admin/banners/' + b.id + '\',{method:\'DELETE\'}).then(function(){renderAdminHome(document.getElementById(\'pageContent\'))})})">删除</button></div>';
    });
    html += '</div></div>';

    html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="margin-bottom:0;border:none;padding:0">服务项目</span><button class="add-btn" onclick="showPromptModal(\'新增服务\',\'服务名称\',null,function(n){if(n)adminFetch(\'/api/admin/services\',{method:\'POST\',body:JSON.stringify({name:n,icon:\'\'})}).then(function(){renderAdminHome(document.getElementById(\'pageContent\'))}).catch(function(){})})">+ 新增</button></div><div id="serviceList">';
    (res.services||[]).forEach(function(s) { html += '<div class="list-item-admin"><div class="list-info"><span class="list-title">' + (s.icon||'') + ' ' + htmlEscape(s.name) + '</span></div><button class="list-del-btn" onclick="confirmDelete(\'确认删除\',function(){adminFetch(\'/api/admin/services/' + s.id + '\',{method:\'DELETE\'}).then(function(){renderAdminHome(document.getElementById(\'pageContent\'))})})">删除</button></div>'; });
    html += '</div></div>';

    html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="margin-bottom:0;border:none;padding:0">客户评价</span><button class="add-btn" onclick="showPromptModal(\'新增评价\',\'评价内容\',\'客户昵称\',function(c,n){if(c)adminFetch(\'/api/admin/reviews\',{method:\'POST\',body:JSON.stringify({nickname:n||\'客户\',content:c})}).then(function(){renderAdminHome(document.getElementById(\'pageContent\'))}).catch(function(){})})">+ 新增</button></div><div id="reviewList">';
    (res.reviews||[]).forEach(function(r) { html += '<div class="list-item-admin"><div class="list-info"><span class="list-title">' + htmlEscape(r.nickname) + '</span><span class="list-desc">' + htmlEscape(r.content) + '</span></div><button class="list-del-btn" onclick="confirmDelete(\'确认删除\',function(){adminFetch(\'/api/admin/reviews/' + r.id + '\',{method:\'DELETE\'}).then(function(){renderAdminHome(document.getElementById(\'pageContent\'))})})">删除</button></div>'; });
    html += '</div></div></div>';

    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function savePhotographer() {
  await adminFetch('/api/admin/photographer', { method:'PUT', body:JSON.stringify({
    name: document.getElementById('ph_name').value,
    avatar: document.getElementById('ph_avatar').value,
    intro: document.getElementById('ph_intro').value,
    years_exp: document.getElementById('ph_years').value,
    studio_intro: document.getElementById('ph_studio').value
  })});
  showToast('保存成功');
}

// ============================================================
// 后台 - 作品管理（完整编辑弹窗）
// ============================================================
async function renderAdminPortfolio(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    var res = await adminFetch('/api/admin/portfolios');
    var html = '<div class="admin-page"><div class="admin-header"><span class="admin-title">作品管理</span><button class="add-btn" onclick="showPortfolioEditModal(null)">+ 新增</button></div>';
    (res.portfolios||[]).forEach(function(p) {
      html += '<div class="list-item-admin">' + imgOrPlaceholder(p.cover, p.title, 'list-thumb') + '<div class="list-info"><span class="list-title">' + htmlEscape(p.title) + ' <span style="font-size:11px;color:var(--text-tertiary)">[' + htmlEscape(p.category_name) + ']</span></span><span class="list-desc">' + (p.shoot_date||'') + '</span></div><button class="btn btn-text" onclick="showPortfolioEditModal(' + p.id + ')">编辑</button><button class="list-del-btn" onclick="confirmDelete(\'确认删除？\',function(){adminFetch(\'/api/admin/portfolios/' + p.id + '\',{method:\'DELETE\'}).then(function(){renderAdminPortfolio(document.getElementById(\'pageContent\'))}).catch(function(){})})">删除</button></div>';
    });
    html += '</div>';
    if ((res.categories||[]).length) {
      html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="border:none;padding:0">作品分类</span><button class="add-btn" onclick="showPromptModal(\'新增分类\',\'分类名称\',null,function(n){if(n)adminFetch(\'/api/admin/portfolio-categories\',{method:\'POST\',body:JSON.stringify({name:n})}).then(function(){renderAdminPortfolio(document.getElementById(\'pageContent\'))}).catch(function(){})})">+ 新增</button></div>';
      res.categories.forEach(function(cat) {
        html += '<div class="list-item-admin"><div class="list-info"><span class="list-title">' + htmlEscape(cat.name) + '</span></div><button class="list-del-btn" onclick="confirmDelete(\'确认删除分类\',function(){adminFetch(\'/api/admin/portfolio-categories/' + cat.id + '\',{method:\'DELETE\'}).then(function(){renderAdminPortfolio(document.getElementById(\'pageContent\'))}).catch(function(){})})">删除</button></div>';
      });
      html += '</div>';
    }
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

// 弹出作品编辑/新增弹窗
async function showPortfolioEditModal(id) {
  var user = getCurrentUser();
  var isNew = !id;
  var data = {};
  var categories = [];
  try {
    var baseRes = await adminFetch('/api/admin/portfolios');
    categories = baseRes.categories || [];
    if (!isNew) {
      data = await adminFetch('/api/admin/portfolios/' + id);
    }
  } catch(e) { return; }

  var mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.id = 'portfolioModal';

  var catOptions = '<option value="">选择分类</option>';
  categories.forEach(function(c) { catOptions += '<option value="' + c.id + '"' + (data.category_id==c.id?' selected':'') + '>' + htmlEscape(c.name) + '</option>'; });

  var imagesHtml = '';
  if (data.images) {
    data.images.forEach(function(img, i) {
      imagesHtml += '<div class="img-preview-item" data-url="' + htmlEscape(img.image_url) + '">' + imgOrPlaceholder(img.image_url, '', 'img-preview-thumb') + '<button class="img-preview-del" onclick="this.parentElement.remove()">×</button></div>';
    });
  }

  mask.innerHTML = '<div class="modal-box modal-box-wide"><span class="modal-title">' + (isNew ? '新增' : '编辑') + '作品</span><div class="modal-body-scroll">' +
    '<div class="form-group"><label class="form-label">作品标题</label><input class="form-input" id="pf_title" value="' + htmlEscape(data.title||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">分类</label><select class="form-input" id="pf_category">' + catOptions + '</select></div>' +
    '<div class="form-group"><label class="form-label">封面图URL</label><input class="form-input" id="pf_cover" value="' + htmlEscape(data.cover||'') + '" placeholder="输入图片URL" /></div>' +
    '<div class="form-group"><label class="form-label">拍摄地点</label><input class="form-input" id="pf_location" value="' + htmlEscape(data.location||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">拍摄日期</label><input class="form-input" id="pf_date" value="' + htmlEscape(data.shoot_date||'') + '" placeholder="如 2025-03" /></div>' +
    '<div class="form-group"><label class="form-label">作品图片 (URL，每行一个)</label><textarea class="form-textarea" id="pf_images" placeholder="每行一个图片URL">' + ((data.images||[]).map(function(i){return i.image_url}).join('\n')) + '</textarea></div>' +
    '<div class="img-preview-list" id="pf_preview">' + imagesHtml + '</div>' +
    '</div><div class="modal-actions"><button class="btn btn-secondary" onclick="document.getElementById(\'portfolioModal\').remove()">取消</button><button class="btn btn-primary" onclick="savePortfolio(' + (id||'null') + ')">保存</button></div></div>';
  document.body.appendChild(mask);
}

async function savePortfolio(id) {
  var data = {
    title: document.getElementById('pf_title').value,
    category_id: parseInt(document.getElementById('pf_category').value) || 1,
    cover: document.getElementById('pf_cover').value,
    location: document.getElementById('pf_location').value,
    shoot_date: document.getElementById('pf_date').value,
    images: document.getElementById('pf_images').value.split('\n').filter(Boolean)
  };
  // 自动设封面
  if (!data.cover && data.images.length) data.cover = data.images[0];

  try {
    if (id) {
      await adminFetch('/api/admin/portfolios/' + id, { method:'PUT', body:JSON.stringify(data) });
    } else {
      await adminFetch('/api/admin/portfolios', { method:'POST', body:JSON.stringify(data) });
    }
    document.getElementById('portfolioModal').remove();
    showToast('保存成功');
    renderAdminPortfolio(document.getElementById('pageContent'));
  } catch(e) { showToast('保存失败'); }
}

// ============================================================
// 后台 - 服装管理（完整编辑弹窗）
// ============================================================
async function renderAdminCostume(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    var res = await adminFetch('/api/admin/costumes');
    var html = '<div class="admin-page"><div class="admin-header"><span class="admin-title">服装管理</span><button class="add-btn" onclick="showCostumeEditModal(null)">+ 新增</button></div>';
    (res.costumes||[]).forEach(function(co) {
      var statusText = co.status ? '已上架' : '已下架';
      html += '<div class="list-item-admin">' + imgOrPlaceholder(co.cover, co.name, 'list-thumb') + '<div class="list-info"><span class="list-title">' + htmlEscape(co.name) + ' <span style="font-size:11px;color:var(--text-tertiary)">[' + htmlEscape(co.category_name) + ']</span></span><span class="list-desc">' + statusText + '</span></div><button class="btn btn-text" onclick="showCostumeEditModal(' + co.id + ')">编辑</button><button class="list-del-btn" onclick="confirmDelete(\'确认删除？\',function(){adminFetch(\'/api/admin/costumes/' + co.id + '\',{method:\'DELETE\'}).then(function(){renderAdminCostume(document.getElementById(\'pageContent\'))}).catch(function(){})})">删除</button></div>';
    });
    html += '</div>';
    if ((res.categories||[]).length) {
      html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="border:none;padding:0">服装分类</span><button class="add-btn" onclick="showPromptModal(\'新增分类\',\'分类名称\',null,function(n){if(n)adminFetch(\'/api/admin/costume-categories\',{method:\'POST\',body:JSON.stringify({name:n})}).then(function(){renderAdminCostume(document.getElementById(\'pageContent\'))}).catch(function(){})})">+ 新增</button></div>';
      res.categories.forEach(function(cat) {
        html += '<div class="list-item-admin"><div class="list-info"><span class="list-title">' + htmlEscape(cat.name) + '</span></div><button class="list-del-btn" onclick="confirmDelete(\'确认删除分类\',function(){adminFetch(\'/api/admin/costume-categories/' + cat.id + '\',{method:\'DELETE\'}).then(function(){renderAdminCostume(document.getElementById(\'pageContent\'))}).catch(function(){})})">删除</button></div>';
      });
      html += '</div>';
    }
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function showCostumeEditModal(id) {
  var isNew = !id;
  var data = {};
  var categories = [];
  try {
    var baseRes = await adminFetch('/api/admin/costumes');
    categories = baseRes.categories || [];
    if (!isNew) {
      data = await adminFetch('/api/admin/costumes/' + id);
    }
  } catch(e) { return; }

  var mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.id = 'costumeModal';

  var catOptions = '<option value="">选择分类</option>';
  categories.forEach(function(c) { catOptions += '<option value="' + c.id + '"' + (data.category_id==c.id?' selected':'') + '>' + htmlEscape(c.name) + '</option>'; });

  mask.innerHTML = '<div class="modal-box modal-box-wide"><span class="modal-title">' + (isNew ? '新增' : '编辑') + '服装</span><div class="modal-body-scroll">' +
    '<div class="form-group"><label class="form-label">服装名称</label><input class="form-input" id="cs_name" value="' + htmlEscape(data.name||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">分类</label><select class="form-input" id="cs_category">' + catOptions + '</select></div>' +
    '<div class="form-group"><label class="form-label">封面图URL</label><input class="form-input" id="cs_cover" value="' + htmlEscape(data.cover||'') + '" /></div>' +
    '<div class="form-group"><label class="form-label">尺码</label><input class="form-input" id="cs_size" value="' + htmlEscape(data.size||'') + '" placeholder="如 M/L" /></div>' +
    '<div class="form-group"><label class="form-label">适合身高</label><input class="form-input" id="cs_height" value="' + htmlEscape(data.height_range||'') + '" placeholder="如 160-170cm" /></div>' +
    '<div class="form-group"><label class="form-label">标签 (逗号分隔)</label><input class="form-input" id="cs_tags" value="' + htmlEscape(data.tags||'') + '" placeholder="如 红色,明制,大袖衫" /></div>' +
    '<div class="form-group"><label class="form-label">备注</label><textarea class="form-textarea" id="cs_notes">' + htmlEscape(data.notes||'') + '</textarea></div>' +
    '<div class="form-group"><label class="form-label">状态</label><select class="form-input" id="cs_status"><option value="1"' + (data.status!=0?' selected':'') + '>上架</option><option value="0"' + (data.status===0?' selected':'') + '>下架</option></select></div>' +
    '<div class="form-group"><label class="form-label">服装图片 (URL，每行一个)</label><textarea class="form-textarea" id="cs_images" placeholder="每行一个图片URL">' + ((data.images||[]).map(function(i){return i.image_url}).join('\n')) + '</textarea></div>' +
    '</div><div class="modal-actions"><button class="btn btn-secondary" onclick="document.getElementById(\'costumeModal\').remove()">取消</button><button class="btn btn-primary" onclick="saveCostume(' + (id||'null') + ')">保存</button></div></div>';
  document.body.appendChild(mask);
}

async function saveCostume(id) {
  var data = {
    name: document.getElementById('cs_name').value,
    category_id: parseInt(document.getElementById('cs_category').value) || 1,
    cover: document.getElementById('cs_cover').value,
    size: document.getElementById('cs_size').value,
    height_range: document.getElementById('cs_height').value,
    tags: document.getElementById('cs_tags').value,
    notes: document.getElementById('cs_notes').value,
    status: parseInt(document.getElementById('cs_status').value) || 1,
    images: document.getElementById('cs_images').value.split('\n').filter(Boolean)
  };
  if (!data.name) { showToast('请填写服装名称'); return; }
  if (!data.cover && data.images.length) data.cover = data.images[0];

  try {
    if (id) {
      await adminFetch('/api/admin/costumes/' + id, { method:'PUT', body:JSON.stringify(data) });
    } else {
      await adminFetch('/api/admin/costumes', { method:'POST', body:JSON.stringify(data) });
    }
    document.getElementById('costumeModal').remove();
    showToast('保存成功');
    renderAdminCostume(document.getElementById('pageContent'));
  } catch(e) { showToast('保存失败'); }
}

// ============================================================
// 后台 - 联系方式
// ============================================================
async function renderAdminContact(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    var d = await adminFetch('/api/admin/contact') || {};
    c.innerHTML = '<div class="admin-page"><div class="admin-section"><span class="admin-section-title">联系方式</span>' +
      '<div class="form-group"><label class="form-label">微信号</label><input class="form-input" id="ct_wechat" value="' + htmlEscape(d.wechat||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">二维码 URL</label><input class="form-input" id="ct_qrcode" value="' + htmlEscape(d.wechat_qrcode||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">联系电话</label><input class="form-input" id="ct_phone" value="' + htmlEscape(d.phone||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">小红书链接</label><input class="form-input" id="ct_xhs" value="' + htmlEscape(d.xiaohongshu||'') + '" /></div>' +
      '<div class="form-group"><label class="form-label">微博链接</label><input class="form-input" id="ct_weibo" value="' + htmlEscape(d.weibo||'') + '" /></div>' +
      '<button class="btn btn-primary" onclick="saveContact()">保存</button></div></div>';
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function saveContact() {
  await adminFetch('/api/admin/contact', { method:'PUT', body:JSON.stringify({
    wechat: document.getElementById('ct_wechat').value,
    wechat_qrcode: document.getElementById('ct_qrcode').value,
    phone: document.getElementById('ct_phone').value,
    xiaohongshu: document.getElementById('ct_xhs').value,
    weibo: document.getElementById('ct_weibo').value
  })});
  showToast('保存成功');
}

// ============================================================
// 工具：确认删除弹窗 / 表单输入弹窗
// ============================================================
function confirmDelete(msg, cb) {
  var mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = '<div class="modal-box"><span class="modal-title">' + msg + '</span><div class="modal-actions" style="margin-top:16px"><button class="btn btn-secondary" onclick="this.closest(\'.modal-mask\').remove()">取消</button><button class="btn btn-danger" onclick="this.closest(\'.modal-mask\').remove();(function(){' + cb.toString() + '})()">确认</button></div></div>';
  document.body.appendChild(mask);
  return false;
}

function showPromptModal(title, placeholder1, placeholder2, cb) {
  var mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.id = 'promptModal';
  var html = '<div class="modal-box"><span class="modal-title">' + title + '</span><div class="modal-body-scroll">' +
    '<div class="form-group"><input class="form-input" id="pmt_input1" placeholder="' + placeholder1 + '" /></div>';
  if (placeholder2) html += '<div class="form-group"><input class="form-input" id="pmt_input2" placeholder="' + placeholder2 + '" /></div>';
  html += '</div><div class="modal-actions"><button class="btn btn-secondary" onclick="this.closest(\'.modal-mask\').remove()">取消</button><button class="btn btn-primary" onclick="var v1=document.getElementById(\'pmt_input1\').value;var v2=document.getElementById(\'pmt_input2\')?document.getElementById(\'pmt_input2\').value:null;document.getElementById(\'promptModal\').remove();(' + cb.toString() + ')(v1,v2)">确认</button></div></div>';
  mask.innerHTML = html;
  document.body.appendChild(mask);
  setTimeout(function(){document.getElementById('pmt_input1').focus()}, 100);
}
