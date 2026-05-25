# Aibo Studio - 摄影师品牌网站

网页版，手机端优先设计，适配微信内打开。

## 项目结构

```
photographer-web/
├── start.sh                  # 一键启动
├── server/                   # 后端服务 (端口 3800)
│   ├── index.js             # Express + SQLite
│   ├── init-db.js           # 初始化数据库
│   ├── seed-demo.js         # 示例数据
│   ├── photographer.db      # SQLite 数据文件
│   └── uploads/             # 图片上传目录
└── public/                   # 前端静态文件
    ├── index.html           # SPA 入口
    ├── css/style.css        # 全站样式 (移动端优先)
    └── js/app.js            # SPA 路由 + 所有页面逻辑
```

## 🚀 启动

```bash
cd /root/openclaw-workspace/photographer-web
bash start.sh
```

访问 http://localhost:3800

## 页面

| 路由 | 页面 |
|------|------|
| `/` | 首页 (Banner + 简介 + 服务 + 精选作品) |
| `/portfolio` | 作品集 (分类Tab + 双列网格) |
| `/portfolio/:id` | 作品详情 |
| `/costume` | 服装馆 (分类Tab + 卡片) |
| `/costume/:id` | 服装详情 |
| `/about` | 关于摄影师 |
| `/admin-login` | 管理后台登录 |
| `/admin` | 后台首页 |
| `/admin/home` | 首页内容管理 |
| `/admin/portfolio` | 作品管理 |
| `/admin/costume` | 服装管理 |
| `/admin/contact` | 联系方式管理 |

## 管理后台

- 地址: `/admin-login`
- 默认密码: `admin123`

## 服务器公网访问

当前服务器 IP 可通过以下命令查看:
```bash
curl -s ifconfig.me
```

然后用 `http://你的IP:3800` 从手机浏览器访问。
