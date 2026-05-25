// ============================================================
// Aibo Studio - SPA App
// ============================================================

const ADMIN_TOKEN_KEY = 'admin_token';
let _wechat = '';

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1600);
}

function onBook() {
  if (_wechat) {
    navigator.clipboard.writeText(_wechat).then(() => showToast('微信号已复制，请打开微信添加好友'))
      .catch(() => showToast('微信号：' + _wechat));
  } else {
    showToast('请联系摄影师获取微信号');
  }
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

function render(path) {
  const c = document.getElementById('pageContent');
  const tabs = document.getElementById('bottomTabs');
  const book = document.getElementById('floatBook');
  const nav = document.getElementById('navLinks');
  const back = document.getElementById('backBtn');
  const brand = document.querySelector('.nav-brand');

  if (path.startsWith('/admin')) {
    tabs.style.display = 'none';
    book.style.display = 'none';
    nav.style.display = 'none';
    back.style.display = 'inline-flex';
    brand.textContent = '管理后台';
  } else {
    tabs.style.display = 'flex';
    book.style.display = 'flex';
    nav.style.display = 'flex';
    back.style.display = 'none';
    brand.textContent = 'Aibo Studio';
    document.querySelectorAll('.tab-item').forEach(t => t.classList.toggle('active', t.getAttribute('href') === path));
  }

  if (path === '/' || path === '') renderHome(c);
  else if (path === '/portfolio') renderPortfolio(c);
  else if (path.startsWith('/portfolio/')) renderPortfolioDetail(c, path.split('/')[2]);
  else if (path === '/costume') renderCostume(c);
  else if (path.startsWith('/costume/')) renderCostumeDetail(c, path.split('/')[2]);
  else if (path === '/about') renderAbout(c);
  else if (path === '/admin-login') renderAdminLogin(c);
  else if (path === '/admin') renderAdmin(c);
  else if (path.startsWith('/admin/')) renderAdminPage(c, path);
  else renderHome(c);
}

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
  } catch (e) {
    c.innerHTML = '<div class="empty-state">加载失败，请检查服务器</div>';
  }
}

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
  const url = catId === 'all' ? '/api/portfolios' : '/api/portfolios?category_id=' + catId;
  try {
    const res = await fetch(url).then(r => r.json());
    const grid = document.getElementById('portfolioGrid');
    let html = '';
    (res.portfolios||[]).forEach(p => {
      html += '<div class="card-grid-item" onclick="route(\'/portfolio/' + p.id + '\')">' + imgOrPlaceholder(p.cover, p.title, 'card-grid-cover') + '<div class="card-grid-info"><span class="card-grid-title">' + p.title + '</span></div></div>';
    });
    grid.innerHTML = html || '<div class="empty-state">暂无作品</div>';
  } catch(e) {}
}

async function renderPortfolioDetail(c, id) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const p = await fetch('/api/portfolios/' + id).then(r => r.json());
    let html = '';
    if (p.images && p.images.length > 1) {
      html += '<div class="detail-swiper">';
      p.images.forEach(img => { html += imgOrPlaceholder(img.image_url, '', 'detail-swiper-img'); });
      html += '</div>';
    } else if (p.images && p.images.length === 1) {
      html += imgOrPlaceholder(p.images[0].image_url, '', 'detail-img');
    } else {
      html += imgOrPlaceholder(p.cover, '', 'detail-img');
    }
    html += '<div class="detail-body"><span class="detail-title">' + p.title + '</span><div class="detail-meta-card">' +
      (p.category_name ? '<div class="meta-row"><span class="meta-label">分类</span><span class="meta-value">' + p.category_name + '</span></div>' : '') +
      (p.shoot_date ? '<div class="meta-row"><span class="meta-label">拍摄时间</span><span class="meta-value">' + p.shoot_date + '</span></div>' : '') +
      (p.location ? '<div class="meta-row"><span class="meta-label">拍摄地点</span><span class="meta-value">' + p.location + '</span></div>' : '') +
      '</div></div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">作品不存在</div>'; }
}

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
  const url = catId === 'all' ? '/api/costumes' : '/api/costumes?category_id=' + catId;
  try {
    const res = await fetch(url).then(r => r.json());
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
    if (d.images && d.images.length > 1) {
      html += '<div class="detail-swiper">';
      d.images.forEach(img => { html += imgOrPlaceholder(img.image_url, '', 'detail-swiper-img'); });
      html += '</div>';
    } else if (d.images && d.images.length === 1) {
      html += imgOrPlaceholder(d.images[0].image_url, '', 'detail-img');
    } else {
      html += imgOrPlaceholder(d.cover, '', 'detail-img');
    }
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

async function renderAbout(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    const res = await fetch('/api/about').then(r => r.json());
    const p = res.photographer || {};
    const studioImages = res.studioImages || [];
    const steps = ['咨询', '档期确认', '选服装', '拍摄', '选片', '交付'];
    let html = '<div class="hero-section">' + imgOrPlaceholder(p.avatar, '', 'hero-avatar') +
      '<span class="hero-name">' + (p.name||'摄影师') + '</span><div class="hero-desc">' + (p.intro||'').replace(/\n/g,'<br>') + '</div></div>';
    if (p.studio_intro) html += '<div class="section"><div class="section-title">工作室介绍</div><p style="font-size:13px;color:var(--text-secondary);line-height:1.8">' + p.studio_intro.replace(/\n/g,'<br>') + '</p></div>';
    if (studioImages.length) {
      html += '<div class="section"><div class="section-title">环境展示</div>';
      studioImages.forEach(si => { html += imgOrPlaceholder(si.image_url, si.caption, 'studio-grid-img'); });
      html += '</div>';
    }
    html += '<div class="section"><div class="section-title">服务流程</div>';
    steps.forEach((s, i) => { html += '<div class="process-step"><div class="process-num">' + (i+1) + '</div><span class="process-text">' + s + '</span></div>'; });
    html += '</div><div class="section"><div class="section-title">联系方式</div><div class="contact-card">';
    if (p.wechat) html += '<div class="contact-row"><span class="contact-label">微信号</span><span class="contact-value">' + p.wechat + '</span><button class="contact-copy" onclick="copyText(\'' + p.wechat + '\',\'微信号已复制\')">复制</button></div>';
    if (p.wechat_qrcode) html += imgOrPlaceholder(p.wechat_qrcode, '二维码', 'qrcode-img');
    if (p.phone) html += '<div class="contact-row"><span class="contact-label">电话</span><span class="contact-value">' + p.phone + '</span></div>';
    if (p.xiaohongshu || p.weibo) {
      html += '<div class="contact-social">';
      if (p.xiaohongshu) html += '<button class="contact-link" onclick="copyText(\'' + p.xiaohongshu + '\',\'小红书链接已复制\')">小红书 ›</button>';
      if (p.weibo) html += '<button class="contact-link" onclick="copyText(\'' + p.weibo + '\',\'微博链接已复制\')">微博 ›</button>';
      html += '</div>';
    }
    html += '</div></div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

function renderAdminLogin(c) {
  c.innerHTML = '<div class="admin-login-box"><h2>管理员登录</h2><p>请输入管理密码以管理内容</p><input class="admin-login-input" type="password" id="adminPwd" placeholder="输入密码" onkeydown="if(event.key===\'Enter\') adminLogin()" /><button class="btn btn-primary" onclick="adminLogin()">登录</button></div>';
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

function renderAdmin(c) {
  var token = getToken();
  if (!token) { renderAdminLogin(c); return; }
  c.innerHTML = '<div class="admin-page"><div class="admin-header"><span class="admin-title">管理后台</span><button class="btn btn-text" onclick="localStorage.removeItem(\'' + ADMIN_TOKEN_KEY + '\');route(\'/admin-login\')">退出</button></div><div class="admin-menu">' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/home\')"><div class="admin-menu-icon" style="background:#F5EDDC">🏠</div><div><span class="admin-menu-label">首页管理</span><span class="admin-menu-desc">Banner、简介、服务项目</span></div></a>' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/portfolio\')"><div class="admin-menu-icon" style="background:#F0E6D0">🖼️</div><div><span class="admin-menu-label">作品管理</span><span class="admin-menu-desc">上传、编辑、分类</span></div></a>' +
    '<a class="admin-menu-item" onclick="return route(\'/admin/costume\')"><div class="admin-menu-icon" style="background:#EDE0C8">👗</div><div><span class="admin-menu-label">服装管理</span><span class="admin-menu-desc">服装库、上下架</span></div></a>' +
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

function htmlEscape(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

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

    html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="margin-bottom:0;border:none;padding:0">Banner 管理</span><button class="add-btn" onclick="showAddBannerDialog()">+ 新增</button></div><div id="bannerList">';
    (res.banners||[]).forEach(function(b) {
      html += '<div class="list-item-admin"><div style="width:50px;height:50px;border-radius:4px;background:#eee;flex-shrink:0;overflow:hidden">' + imgOrPlaceholder(b.image_url,'','list-thumb') + '</div><div class="list-info"><span class="list-title">' + htmlEscape(b.title) + '</span><span class="list-desc">' + htmlEscape(b.subtitle) + '</span></div><button class="list-del-btn" onclick="deleteBanner(' + b.id + ')">删除</button></div>';
    });
    html += '</div></div>';

    html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="margin-bottom:0;border:none;padding:0">服务项目</span><button class="add-btn" onclick="showAddServiceDialog()">+ 新增</button></div><div id="serviceList">';
    (res.services||[]).forEach(function(s) { html += '<div class="list-item-admin"><div class="list-info"><span class="list-title">' + (s.icon||'') + ' ' + htmlEscape(s.name) + '</span></div><button class="list-del-btn" onclick="deleteService(' + s.id + ')">删除</button></div>'; });
    html += '</div></div>';

    html += '<div class="admin-section"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="admin-section-title" style="margin-bottom:0;border:none;padding:0">客户评价</span><button class="add-btn" onclick="showAddReviewDialog()">+ 新增</button></div><div id="reviewList">';
    (res.reviews||[]).forEach(function(r) { html += '<div class="list-item-admin"><div class="list-info"><span class="list-title">' + htmlEscape(r.nickname) + '</span><span class="list-desc">' + htmlEscape(r.content) + '</span></div><button class="list-del-btn" onclick="deleteReview(' + r.id + ')">删除</button></div>'; });
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

async function deleteBanner(id) { if (!confirm('确认删除？')) return; await adminFetch('/api/admin/banners/' + id,{method:'DELETE'}); render(document.getElementById('pageContent'),location.pathname); }
function showAddBannerDialog() {
  var title = prompt('Banner 标题', '新 Banner'); if (title === null) return;
  var img = prompt('图片 URL（可选）','');
  adminFetch('/api/admin/banners',{method:'POST',body:JSON.stringify({title:title||'',image_url:img||'',subtitle:''})}).then(function(){render(document.getElementById('pageContent'),location.pathname);}).catch(function(){});
}
async function deleteService(id) { if (!confirm('确认删除？')) return; await adminFetch('/api/admin/services/' + id,{method:'DELETE'}); render(document.getElementById('pageContent'),location.pathname); }
function showAddServiceDialog() { var n = prompt('服务名称','新服务'); if (n) adminFetch('/api/admin/services',{method:'POST',body:JSON.stringify({name:n,icon:''})}).then(function(){render(document.getElementById('pageContent'),location.pathname);}).catch(function(){}); }
async function deleteReview(id) { if (!confirm('确认删除？')) return; await adminFetch('/api/admin/reviews/' + id,{method:'DELETE'}); render(document.getElementById('pageContent'),location.pathname); }
function showAddReviewDialog() { var c = prompt('评价内容',''); if (c) adminFetch('/api/admin/reviews',{method:'POST',body:JSON.stringify({nickname:'客户',content:c})}).then(function(){render(document.getElementById('pageContent'),location.pathname);}).catch(function(){}); }

async function renderAdminPortfolio(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    var res = await adminFetch('/api/admin/portfolios');
    var html = '<div class="admin-page"><div class="admin-header"><span class="admin-title">作品管理</span><button class="add-btn" onclick="addPortfolio()">+ 新增</button></div>';
    (res.portfolios||[]).forEach(function(p) {
      html += '<div class="list-item-admin">' + imgOrPlaceholder(p.cover, p.title, 'list-thumb') + '<div class="list-info"><span class="list-title">' + htmlEscape(p.title) + '</span><span class="list-desc">' + (p.shoot_date||'') + '</span></div><button class="list-del-btn" onclick="deletePortfolio(' + p.id + ')">删除</button></div>';
    });
    html += '</div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function addPortfolio() { var title = prompt('作品标题','新作品'); if (!title) return; await adminFetch('/api/admin/portfolios',{method:'POST',body:JSON.stringify({title:title,category_id:1})}); render(document.getElementById('pageContent'),location.pathname); }
async function deletePortfolio(id) { if (!confirm('确认删除？')) return; await adminFetch('/api/admin/portfolios/' + id,{method:'DELETE'}); render(document.getElementById('pageContent'),location.pathname); }

async function renderAdminCostume(c) {
  c.innerHTML = '<div class="empty-state">加载中...</div>';
  try {
    var res = await adminFetch('/api/admin/costumes');
    var html = '<div class="admin-page"><div class="admin-header"><span class="admin-title">服装管理</span><button class="add-btn" onclick="addCostume()">+ 新增</button></div>';
    (res.costumes||[]).forEach(function(co) {
      html += '<div class="list-item-admin">' + imgOrPlaceholder(co.cover, co.name, 'list-thumb') + '<div class="list-info"><span class="list-title">' + htmlEscape(co.name) + '</span><span class="list-desc">' + (co.status?'已上架':'已下架') + '</span></div><button class="list-del-btn" onclick="deleteCostume(' + co.id + ')">删除</button></div>';
    });
    html += '</div>';
    c.innerHTML = html;
  } catch(e) { c.innerHTML = '<div class="empty-state">加载失败</div>'; }
}

async function addCostume() { var name = prompt('服装名称','新服装'); if (!name) return; await adminFetch('/api/admin/costumes',{method:'POST',body:JSON.stringify({name:name,category_id:1})}); render(document.getElementById('pageContent'),location.pathname); }
async function deleteCostume(id) { if (!confirm('确认删除？')) return; await adminFetch('/api/admin/costumes/' + id,{method:'DELETE'}); render(document.getElementById('pageContent'),location.pathname); }

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
