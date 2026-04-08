# PolyBot Deployment

## Target
Ubuntu 24.04 VPS with Node.js 22, PM2, and a dedicated app path.

## Suggested layout
- `/opt/polyedge-lite/current`
- `/opt/polyedge-lite/shared`
- `/opt/polyedge-lite/shared/.env`
- `/opt/polyedge-lite/shared/data/`

## One-time server setup
```bash
sudo mkdir -p /opt/polyedge-lite/shared/data
sudo mkdir -p /opt/polyedge-lite/releases
sudo chown -R $USER:$USER /opt/polyedge-lite
```

## Clone and install
```bash
cd /opt/polyedge-lite
git clone git@github.com:the-villian-09/PolyBot.git current
cd current
npm install --include=dev
npm run build
```

## Env setup
Create `/opt/polyedge-lite/shared/.env` and symlink it:
```bash
ln -sf /opt/polyedge-lite/shared/.env /opt/polyedge-lite/current/.env
```

## PM2 setup
```bash
npm install -g pm2
cd /opt/polyedge-lite/current
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

## Logs
```bash
pm2 logs polybot
pm2 status
```

## Restart after updates
```bash
cd /opt/polyedge-lite/current
git pull origin main
npm install --include=dev
npm run build
pm2 restart polybot
```
