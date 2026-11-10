param([int]$WebPort = 3000, [int]$ApiPort = 4000, [int]$MongoPort = 27019)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiDirectory = Join-Path $projectRoot 'apps/api'
$webDirectory = Join-Path $projectRoot 'apps/web'
$runtimeDirectory = Join-Path $projectRoot '.local'
$logDirectory = Join-Path $runtimeDirectory 'logs'
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
foreach ($port in @($WebPort, $ApiPort, $MongoPort)) {
  if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) { throw "Port $port is already in use. Check the running application before starting another instance." }
}
$nodeExecutable = (Get-Command node.exe).Source
Push-Location $apiDirectory
try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'API build failed.' }
  $env:NODE_ENV = 'development'
  $env:MONGODB_URI = "mongodb://127.0.0.1:$MongoPort/healthcare_checkpoint_20261109?replicaSet=rs0"
  $env:DEV_MONGO_PORT = "$MongoPort"
  $env:DEV_MONGO_PATH = Join-Path $runtimeDirectory "mongodb-$MongoPort"
  $env:MONGOMS_DOWNLOAD_DIR = Join-Path $projectRoot '.mongodb-binaries'
  $env:PORT = "$ApiPort"
  $env:WEB_ORIGIN = "http://localhost:$WebPort"
  $env:PRIVATE_STORAGE_PATH = Join-Path $runtimeDirectory 'private-documents'
  $env:DEV_EMAIL_OUTBOX = 'true'
  $env:DEV_SIMPLE_AUTH = 'true'
  $env:DEV_SCANNER = 'synthetic'
  $env:ALLOW_DEMO_SEED = 'true'
  $env:NDA_VERSION = 'local-demo-v1'
  $env:NDA_TEXT = 'DEVELOPMENT ONLY: synthetic confidentiality agreement for fictional demonstration records. Not legally reviewed or a validated electronic signature.'
  $mongoProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @('dist/dev-mongo.js') -WorkingDirectory $apiDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'mongo.out.log') -RedirectStandardError (Join-Path $logDirectory 'mongo.err.log') -PassThru
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 1000
    if (Get-NetTCPConnection -State Listen -LocalPort $MongoPort -ErrorAction SilentlyContinue) { break }
    if ($mongoProcess.HasExited) { throw 'Replica-set launcher exited; inspect .local/logs/mongo.err.log.' }
  }
  & $nodeExecutable -e "const m=require('mongoose');(async()=>{await m.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});const {seed}=require('./dist/seed');const {User}=require('./dist/platform/models');if(!await User.exists({}))await seed();else console.log('Existing checkpoint records retained.');await m.disconnect();})().catch(()=>{console.error('Local database initialization failed');process.exitCode=1;});"
  if ($LASTEXITCODE -ne 0) { throw 'Local database setup failed; inspect the local replica-set log.' }
  $apiProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @('dist/server.js') -WorkingDirectory $apiDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'api.out.log') -RedirectStandardError (Join-Path $logDirectory 'api.err.log') -PassThru
  $workerProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @('dist/worker.js') -WorkingDirectory $apiDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'worker.out.log') -RedirectStandardError (Join-Path $logDirectory 'worker.err.log') -PassThru
  $env:API_ORIGIN = "http://127.0.0.1:$ApiPort"
  $env:NEXT_DIST_DIR = if ($WebPort -eq 3000) { '.next' } else { ".next-local-$WebPort" }
  $nextEntry = Join-Path $webDirectory 'node_modules/next/dist/bin/next'
  $webProcess = Start-Process -FilePath $nodeExecutable -ArgumentList @(('"' + $nextEntry + '"'), 'dev', '--hostname', '127.0.0.1', '--port', "$WebPort") -WorkingDirectory $webDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDirectory 'web.out.log') -RedirectStandardError (Join-Path $logDirectory 'web.err.log') -PassThru
  $statePath = Join-Path $runtimeDirectory 'processes.json'
  if (Test-Path -LiteralPath $statePath) { Copy-Item -LiteralPath $statePath -Destination (Join-Path $runtimeDirectory ("processes-previous-" + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json')) }
  @{ mongoLauncher = $mongoProcess.Id; api = $apiProcess.Id; worker = $workerProcess.Id; web = $webProcess.Id; webUrl = "http://localhost:$WebPort"; apiPort = $ApiPort; database = 'healthcare_checkpoint_20261109'; mongoPort = $MongoPort } | ConvertTo-Json | Set-Content -LiteralPath $statePath
  Write-Output "Local project starting at http://localhost:$WebPort. Logs: .local/logs. Development accounts: seller@example.test / buyer@example.test / broker@example.test. Password: DevelopmentOnly!2026. Local sign-in uses email/password; verification and MFA are deferred in development."
} finally { Pop-Location }
