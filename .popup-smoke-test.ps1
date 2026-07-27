$ErrorActionPreference = "Stop"

function Invoke-CdpCommand {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [int]$Id,
    [string]$Method,
    [hashtable]$Params = @{}
  )

  $payload = @{ id = $Id; method = $Method; params = $Params } | ConvertTo-Json -Depth 12 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $Socket.SendAsync(
    [System.ArraySegment[byte]]::new($bytes),
    [System.Net.WebSockets.WebSocketMessageType]::Text,
    $true,
    [System.Threading.CancellationToken]::None
  ).GetAwaiter().GetResult()

  while ($true) {
    $stream = [System.IO.MemoryStream]::new()
    do {
      $buffer = [byte[]]::new(65536)
      $received = $Socket.ReceiveAsync(
        [System.ArraySegment[byte]]::new($buffer),
        [System.Threading.CancellationToken]::None
      ).GetAwaiter().GetResult()
      if ($received.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
        throw "The browser closed the debugging connection."
      }
      $stream.Write($buffer, 0, $received.Count)
    } while (-not $received.EndOfMessage)

    $responseText = [System.Text.Encoding]::UTF8.GetString($stream.ToArray())
    $response = $responseText | ConvertFrom-Json
    if ($response.id -eq $Id) {
      if ($response.error) { throw ($response.error | ConvertTo-Json -Compress) }
      return $response.result
    }
  }
}

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$profilePath = Join-Path ([System.IO.Path]::GetTempPath()) ("bcba-popup-test-" + [guid]::NewGuid().ToString("N"))
$portProbe = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$portProbe.Start()
$debugPort = ([System.Net.IPEndPoint]$portProbe.LocalEndpoint).Port
$portProbe.Stop()
$edgeProcess = $null
$socket = $null

try {
  $pageUrl = "file:///C:/Users/Cy/Documents/Websites/BcbaSchedule_test/index.html"
  $edgeArguments = @(
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--remote-debugging-port=$debugPort",
    "--remote-allow-origins=*",
    "--window-size=800,600",
    "--user-data-dir=$profilePath",
    $pageUrl
  )
  $edgeProcess = Start-Process -FilePath $edgePath -ArgumentList $edgeArguments -WindowStyle Hidden -PassThru

  $targets = $null
  for ($attempt = 0; $attempt -lt 80; $attempt++) {
    try {
      $targets = Invoke-RestMethod -Uri "http://127.0.0.1:$debugPort/json/list" -TimeoutSec 1
      if ($targets) { break }
    } catch {
      Start-Sleep -Milliseconds 100
    }
  }
  $target = $targets | Where-Object { $_.type -eq "page" -and $_.url -like "file:*index.html*" } | Select-Object -First 1
  if (-not $target) { throw "Could not find the scheduler browser tab."
  }

  $socket = [System.Net.WebSockets.ClientWebSocket]::new()
  $socket.ConnectAsync(
    [uri]$target.webSocketDebuggerUrl,
    [System.Threading.CancellationToken]::None
  ).GetAwaiter().GetResult()

  $commandId = 1
  Invoke-CdpCommand -Socket $socket -Id $commandId -Method "Runtime.enable" | Out-Null
  $commandId++

  for ($attempt = 0; $attempt -lt 50; $attempt++) {
    $readyResult = Invoke-CdpCommand -Socket $socket -Id $commandId -Method "Runtime.evaluate" -Params @{
      expression = "document.querySelector('#clientCount')?.textContent === '4'"
      returnByValue = $true
    }
    $commandId++
    if ($readyResult.result.value) { break }
    Start-Sleep -Milliseconds 100
  }

  $testExpression = @'
(() => {
  const popups = [
    { name: "Add client", modalId: "clientModal", openerId: "addClientBtn" },
    { name: "Session details", modalId: "sessionModal" },
    { name: "Block time", modalId: "blockModal", openerId: "addBlockBtn" },
    { name: "Summary", modalId: "summaryModal", openerId: "weeklySummaryBtn" },
    { name: "Service rules", modalId: "rulesModal", openerId: "manageRulesBtn" },
    { name: "Schedule optimizer", modalId: "optimizerModal", openerId: "scheduleCreatorBtn" }
  ];

  return popups.map((popup) => {
    document.querySelectorAll(".modal-backdrop").forEach((item) => item.classList.add("hidden"));
    if (popup.openerId) document.getElementById(popup.openerId)?.click();
    const backdrop = document.getElementById(popup.modalId);
    if (backdrop.classList.contains("hidden")) backdrop.classList.remove("hidden");
    const dialog = backdrop.querySelector(".modal");
    const actions = dialog.querySelector(":scope > .modal-actions");
    const button = actions?.querySelector("button:last-child");
    dialog.scrollTop = 0;
    const initialScrollTop = dialog.scrollTop;
    dialog.scrollTop = dialog.scrollHeight;
    const finalScrollTop = dialog.scrollTop;
    const dialogRect = dialog.getBoundingClientRect();
    const buttonRect = button?.getBoundingClientRect();
    const centerX = buttonRect ? buttonRect.left + buttonRect.width / 2 : -1;
    const centerY = buttonRect ? buttonRect.top + buttonRect.height / 2 : -1;
    const hit = centerX >= 0 && centerY >= 0 ? document.elementFromPoint(centerX, centerY) : null;
    const overflowY = getComputedStyle(dialog).overflowY;
    const needsScroll = dialog.scrollHeight > dialog.clientHeight + 1;
    const canScroll = !needsScroll || finalScrollTop > initialScrollTop;
    const buttonVisible = Boolean(buttonRect) &&
      buttonRect.top >= Math.max(0, dialogRect.top) - 1 &&
      buttonRect.bottom <= Math.min(innerHeight, dialogRect.bottom) + 1;
    const buttonHitTest = Boolean(button) && Boolean(hit) && (hit === button || button.contains(hit));
    const result = {
      popup: popup.name,
      viewport: `${innerWidth}x${innerHeight}`,
      dialogClientHeight: dialog.clientHeight,
      dialogScrollHeight: dialog.scrollHeight,
      finalScrollTop,
      overflowY,
      needsScroll,
      canScroll,
      buttonVisible,
      buttonHitTest,
      dialogRect: { left: dialogRect.left, right: dialogRect.right, top: dialogRect.top, bottom: dialogRect.bottom },
      buttonRect: buttonRect ? { left: buttonRect.left, right: buttonRect.right, top: buttonRect.top, bottom: buttonRect.bottom } : null,
      hitElement: hit ? { tag: hit.tagName, id: hit.id, className: String(hit.className || "") } : null,
      pass: canScroll && buttonVisible && buttonHitTest && ["auto", "scroll"].includes(overflowY)
    };
    backdrop.classList.add("hidden");
    return result;
  });
})()
'@

  $viewports = @(
    @{ width = 375; height = 480 }
  )
  $allResults = @()
  foreach ($viewport in $viewports) {
    Invoke-CdpCommand -Socket $socket -Id $commandId -Method "Emulation.setDeviceMetricsOverride" -Params @{
      width = $viewport.width
      height = $viewport.height
      deviceScaleFactor = 1
      mobile = $false
    } | Out-Null
    $commandId++
    $testResult = Invoke-CdpCommand -Socket $socket -Id $commandId -Method "Runtime.evaluate" -Params @{
      expression = $testExpression
      returnByValue = $true
    }
    $commandId++
    $allResults += $testResult.result.value
  }

  $allResults | ConvertTo-Json -Depth 5
  $failedResults = @($allResults | Where-Object { -not $_.pass })
  if ($failedResults.Count -gt 0) {
    Write-Output "FAILED CHECKS:"
    $failedResults | ConvertTo-Json -Depth 5
    throw "One or more popup checks failed."
  }
} finally {
  if ($socket) { $socket.Dispose() }
  if ($edgeProcess -and -not $edgeProcess.HasExited) {
    Stop-Process -Id $edgeProcess.Id -Force -ErrorAction SilentlyContinue
    $edgeProcess.WaitForExit(5000)
  }
  if (Test-Path -LiteralPath $profilePath) {
    $resolvedProfile = (Resolve-Path -LiteralPath $profilePath).Path
    $tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
    if ($resolvedProfile.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}
