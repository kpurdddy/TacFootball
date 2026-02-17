# Claude Code — New PC Setup (One Shot)

Run these in PowerShell, in order. The whole thing takes about 5 minutes.

## Step 1 — Install Node.js and Git
```
winget install OpenJS.NodeJS
winget install Git.Git
```

## Step 2 — Close PowerShell completely and reopen it
(PATH doesn't update until you do this)

## Step 3 — Set permissions and install Claude Code
```
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
npm install -g @anthropic-ai/claude-code
```
Say Yes if it asks about execution policy.

## Step 4 — Find the game file
Check whichever of these exists on this PC:
```
dir D:\TacFootball\tacfoot4.html
dir E:\TacFootball\tacfoot4.html
dir C:\Users\obrie\Desktop\TacFoot\index.html
dir C:\Users\Lash2\Desktop\TacFoot\index.html
dir C:\Users\domain\Desktop\TacFoot\index.html
```

## Step 5 — Go to the folder and launch
```
cd D:\TacFootball
claude --dangerously-skip-permissions
```
(Replace D: with E: or whatever drive the thumb drive is on)

## If you get a "git-bash not found" error
Run this before launching Claude Code:
```
$env:CLAUDE_CODE_GIT_BASH_PATH = "C:\Program Files\Git\bin\bash.exe"
claude --dangerously-skip-permissions
```

If the error keeps coming back every time you open PowerShell, set it permanently:
1. Windows key → type "environment variables" → click "Edit the system environment variables"
2. Click "Environment Variables"
3. Under User variables, click "New"
4. Variable name: CLAUDE_CODE_GIT_BASH_PATH
5. Variable value: C:\Program Files\Git\bin\bash.exe
6. OK, OK, OK

## Deploying to Netlify
Drag the TacFoot folder onto the deploy zone on the Project Overview page at netlify.com.

## Token budget
~44,000 tokens per 5-hour window on Pro plan. Check with /usage in Claude Code.
