@echo off
set "NODE_HOME=C:\Users\Bruno\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "PNPM=C:\Users\Bruno\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd"

if not exist "%NODE_HOME%\node.exe" (
  echo Node do ambiente Codex nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org e rode: npm install -g pnpm
  pause
  exit /b 1
)

if not exist "%PNPM%" (
  echo pnpm do ambiente Codex nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org e rode: npm install -g pnpm
  pause
  exit /b 1
)

set "PATH=%NODE_HOME%;%PATH%"
cd /d "%~dp0"
"%PNPM%" run dev
pause
