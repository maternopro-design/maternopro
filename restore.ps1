$logPath = 'C:\Users\ASUS\.gemini\antigravity\brain\d0334b17-913d-4061-9139-10699a94e007\.system_generated\logs\transcript_full.jsonl'
$line = (Get-Content $logPath)[165]
$json = ConvertFrom-Json $line
$code = $json.tool_calls[0].args.CodeContent
$code | Out-File -FilePath 'C:\Users\ASUS\.gemini\antigravity\scratch\maternopro\backup_extracted.txt' -Encoding utf8
