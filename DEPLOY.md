# 一键部署到 VPS

本项目已提供 Windows 本地一键部署脚本：

- `deploy.ps1`：打包本地代码，上传到 VPS，远程构建并重启 PM2。
- `deploy.bat`：双击后自动调用 `deploy.ps1`。

## 第一次使用前准备

1. 在 Windows 安装或启用 OpenSSH Client，确保 PowerShell 里可以运行：

   ```powershell
   ssh -V
   scp
   tar --version
   ```

2. 配置 SSH 登录，不要把密码写进脚本。推荐使用 SSH Key：

   ```powershell
   ssh-keygen -t ed25519
   ssh-copy-id root@45.76.185.185
   ```

   如果 Windows 没有 `ssh-copy-id`，把本机 `~/.ssh/id_ed25519.pub` 内容追加到 VPS 的 `/root/.ssh/authorized_keys`。

3. 确认 VPS 已安装 Node.js、npm、PM2，并且远程目录存在：

   ```bash
   mkdir -p /var/www/eelapi
   npm -v
   pm2 -v
   ```

4. 服务器上的生产环境变量文件需要保留在：

   ```bash
   /var/www/eelapi/.env.local
   ```

   部署脚本不会上传本地 `.env.local`，也不会删除服务器上的 `.env.local`。

## 日常部署

本地改完代码后，双击：

```text
deploy.bat
```

或者在 PowerShell 里运行：

```powershell
.\deploy.ps1
```

如果 SSH Key 不在默认位置，可以这样运行：

```powershell
.\deploy.ps1 -IdentityFile "$HOME\.ssh\id_ed25519"
```

## 脚本会做什么

1. 本地打包这些项目文件和目录：
   `app`、`components`、`lib`、`public`、`supabase`、`package.json`、`package-lock.json`、`tsconfig.json`、`next.config.ts`、`next-env.d.ts`、`components.json`、`postcss.config.*`、`tailwind.config.*`、`eslint.config.*`、`.env.example`、`restart.sh`。
2. 不上传：`node_modules`、`.next`、`.git`、`.env.local`、本地缓存和日志。
3. 上传压缩包到 VPS `/tmp`。
4. 在 VPS 解包到临时目录，再同步到 `/var/www/eelapi`。
5. 执行：

   ```bash
   cd /var/www/eelapi
   rm -rf .next
   npm install
   npm run build
   pm2 restart eelapi --update-env
   pm2 save
   ```

部署完成后检查：

```bash
pm2 logs eelapi
```
