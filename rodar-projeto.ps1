$nodeHome = "C:\Users\Bruno\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$pnpm = "C:\Users\Bruno\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"

if (-not (Test-Path "$nodeHome\node.exe")) {
  Write-Host "Node do ambiente Codex nao encontrado."
  Write-Host "Instale o Node.js LTS em https://nodejs.org e rode: npm install -g pnpm"
  Read-Host "Pressione Enter para sair"
  exit 1
}

if (-not (Test-Path $pnpm)) {
  Write-Host "pnpm do ambiente Codex nao encontrado."
  Write-Host "Instale o Node.js LTS em https://nodejs.org e rode: npm install -g pnpm"
  Read-Host "Pressione Enter para sair"
  exit 1
}

$env:Path = "$nodeHome;$env:Path"
Set-Location $PSScriptRoot
& $pnpm run dev
Read-Host "Pressione Enter para sair"
