#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$RemoteHost = "45.76.185.185",
  [string]$RemoteUser = "root",
  [string]$RemoteDir = "/var/www/eelapi",
  [string]$Pm2App = "eelapi",
  [int]$SshPort = 22,
  [string]$IdentityFile = $env:DEPLOY_SSH_KEY,
  [switch]$SkipNpmInstall
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
  param([string]$Message)

  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Please install OpenSSH for Windows and make sure '$Name' is in PATH."
  }
}

function Escape-RemoteValue {
  param([string]$Value)

  return $Value.Replace("\", "\\").Replace('"', '\"')
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

Require-Command "tar"
Require-Command "scp"
Require-Command "ssh"

$DeployId = Get-Date -Format "yyyyMMddHHmmss"
$TempRoot = [System.IO.Path]::GetTempPath()
$TempDir = Join-Path $TempRoot "eelapi-deploy-$DeployId"
$ArchivePath = Join-Path $TempDir "eelapi-deploy-$DeployId.tar.gz"
$RemoteArchive = "/tmp/eelapi-deploy-$DeployId.tar.gz"
$RemoteReleaseDir = "/tmp/eelapi-deploy-$DeployId"
$SshTarget = "$RemoteUser@$RemoteHost"

$RequiredItems = @(
  "app",
  "components",
  "lib",
  "public",
  "supabase",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "next-env.d.ts",
  "components.json",
  ".env.example",
  "restart.sh"
)

$WildcardItems = @(
  "postcss.config.*",
  "tailwind.config.*",
  "eslint.config.*"
)

New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

try {
  Write-Step "Collecting files to deploy..."
  $ArchiveItems = New-Object System.Collections.Generic.List[string]

  foreach ($Item in $RequiredItems) {
    if (Test-Path -LiteralPath (Join-Path $ProjectRoot $Item)) {
      $ArchiveItems.Add($Item)
    }
  }

  foreach ($Pattern in $WildcardItems) {
    Get-ChildItem -Path $ProjectRoot -Filter $Pattern -File -ErrorAction SilentlyContinue |
      ForEach-Object { $ArchiveItems.Add($_.Name) }
  }

  $ArchiveItems = $ArchiveItems | Sort-Object -Unique

  if ($ArchiveItems.Count -eq 0) {
    throw "No deployable files were found."
  }

  Write-Host "Files and folders included:"
  $ArchiveItems | ForEach-Object { Write-Host "  - $_" }

  Write-Step "Creating deploy archive..."
  & tar -czf $ArchivePath -C $ProjectRoot @ArchiveItems
  if ($LASTEXITCODE -ne 0) {
    throw "tar failed with exit code $LASTEXITCODE."
  }

  $SshArgs = @()
  $ScpArgs = @()

  if ($SshPort -ne 22) {
    $SshArgs += @("-p", "$SshPort")
    $ScpArgs += @("-P", "$SshPort")
  }

  if ($IdentityFile) {
    $SshArgs += @("-i", $IdentityFile)
    $ScpArgs += @("-i", $IdentityFile)
  }

  Write-Step "Uploading archive to VPS with scp..."
  & scp @ScpArgs $ArchivePath "$($SshTarget):$RemoteArchive"
  if ($LASTEXITCODE -ne 0) {
    throw "scp failed with exit code $LASTEXITCODE."
  }

  $NpmInstallCommand = if ($SkipNpmInstall) { "echo 'Skipping npm install by local flag.'" } else { "npm install" }

  $RemoteScript = @'
set -euo pipefail

REMOTE_DIR="__REMOTE_DIR__"
ARCHIVE_PATH="__REMOTE_ARCHIVE__"
RELEASE_DIR="__REMOTE_RELEASE_DIR__"
PM2_APP="__PM2_APP__"

if [ -z "$REMOTE_DIR" ] || [ "$REMOTE_DIR" = "/" ]; then
  echo "Refusing to deploy: unsafe REMOTE_DIR=$REMOTE_DIR"
  exit 1
fi

echo "Preparing release directory..."
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
tar -xzf "$ARCHIVE_PATH" -C "$RELEASE_DIR"
mkdir -p "$REMOTE_DIR"

echo "Syncing project files..."
cd "$REMOTE_DIR"
rm -rf app components lib public supabase
rm -f package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts components.json .env.example restart.sh
rm -f postcss.config.* tailwind.config.* eslint.config.*

for item in app components lib public supabase package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts components.json .env.example restart.sh; do
  if [ -e "$RELEASE_DIR/$item" ]; then
    cp -a "$RELEASE_DIR/$item" "$REMOTE_DIR/$item"
  fi
done

for pattern in postcss.config.* tailwind.config.* eslint.config.*; do
  for item in "$RELEASE_DIR"/$pattern; do
    [ -e "$item" ] || continue
    cp -a "$item" "$REMOTE_DIR/$(basename "$item")"
  done
done

echo "Removing old Next.js build cache..."
rm -rf .next

echo "Installing dependencies..."
__NPM_INSTALL_COMMAND__

echo "Building Next.js app..."
npm run build

echo "Restarting PM2 app..."
pm2 restart "$PM2_APP" --update-env
pm2 save

echo "Cleaning temporary files..."
rm -rf "$RELEASE_DIR" "$ARCHIVE_PATH"

echo "Deployment finished. Please check: pm2 logs $PM2_APP"
'@

  $RemoteScript = $RemoteScript.Replace("__REMOTE_DIR__", (Escape-RemoteValue $RemoteDir))
  $RemoteScript = $RemoteScript.Replace("__REMOTE_ARCHIVE__", (Escape-RemoteValue $RemoteArchive))
  $RemoteScript = $RemoteScript.Replace("__REMOTE_RELEASE_DIR__", (Escape-RemoteValue $RemoteReleaseDir))
  $RemoteScript = $RemoteScript.Replace("__PM2_APP__", (Escape-RemoteValue $Pm2App))
  $RemoteScript = $RemoteScript.Replace("__NPM_INSTALL_COMMAND__", $NpmInstallCommand)

  Write-Step "Running remote deploy commands..."
  $RemoteScript | & ssh @SshArgs $SshTarget "bash -s"
  if ($LASTEXITCODE -ne 0) {
    throw "ssh remote deploy failed with exit code $LASTEXITCODE."
  }

  Write-Step "Deploy complete. Check logs with: ssh $SshTarget `"pm2 logs $Pm2App`""
}
finally {
  if (Test-Path -LiteralPath $TempDir) {
    $ResolvedTempDir = (Resolve-Path -LiteralPath $TempDir).Path
    $ResolvedTempRoot = (Resolve-Path -LiteralPath $TempRoot).Path

    if ($ResolvedTempDir.StartsWith($ResolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath $ResolvedTempDir -Recurse -Force
    }
  }
}
