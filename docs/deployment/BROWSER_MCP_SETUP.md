# Playwright MCP Server Setup

> **Purpose:** Give Claude (me) browser control for testing
> **Status:** Ready to configure
> **Date:** February 26, 2026

---

## What This Does

Once set up, I (Claude) will be able to:
- ✅ See your browser screen (via screenshots)
- ✅ Click buttons
- ✅ Fill forms
- ✅ Navigate pages
- ✅ Check for visual issues
- ✅ Test wizards end-to-end

---

## Setup Instructions

### Step 1: Install the MCP Server

Open PowerShell/Terminal and run:

```bash
# Install the Playwright MCP server globally
npm install -g @modelcontextprotocol/server-playwright

# Or install in your project
npm install -D @modelcontextprotocol/server-playwright
```

### Step 2: Create MCP Configuration

Create/Edit this file:
```
%APPDATA%\Claude\claude_desktop_config.json
```

On Windows, that's:
```
C:\Users\YOUR_USERNAME\AppData\Roaming\Claude\claude_desktop_config.json
```

### Step 3: Add This Configuration

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ]
    }
  }
}
```

### Step 4: Restart Claude Code

1. Close Claude Code
2. Re-open it
3. The MCP server will be available

### Step 5: Verify It Works

I should now have access to browser tools and can test your application!

---

## Alternative: Project-Local Setup

If you prefer project-local setup:

### 1. Install in project

```bash
cd "d:\VS STUDIO PROJECT\bhutaneduskill"
npm install -D @modelcontextprotocol/server-playwright
```

### 2. Update package.json

```json
{
  "scripts": {
    "mcp:playwright": "npx @modelcontextprotocol/server-playwright"
  }
}
```

### 3. Create MCP config in project

Create: `.clauderc` or `claude-config.json`:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npm",
      "args": ["run", "mcp:playwright"],
      "cwd": "d:\\VS STUDIO PROJECT\\bhutaneduskill"
    }
  }
}
```

---

## What I Can Do After Setup

Once MCP is running, I'll have these tools:

| Tool | Purpose |
|------|---------|
| `playwright_navigate` | Go to a URL |
| `playwright_screenshot` | Take a screenshot |
| `playwright_click` | Click an element |
| `playwright_fill` | Fill a form field |
| `playwright_select` | Select from dropdown |
| `playwright_hover` | Hover over element |
| `playwright_evaluate` | Run JavaScript in page |
| `playwright_console` | Check console errors |

---

## Example Session

```
You: "Test the setup wizard"

Me: "Let me navigate to the setup wizard and test it..."

1. I navigate to http://localhost:3003/setup/unified
2. I take a screenshot - you see what I see
3. I click the "Student" role card
4. I click "Next" button
5. I fill in the form
6. I report any issues found
```

---

## Troubleshooting

### MCP Server Not Found

**Error:** "Cannot find module '@modelcontextprotocol/server-playwright'"

**Fix:**
```bash
npm install -g @modelcontextprotocol/server-playwright
```

### Config File Not Working

**Error:** MCP tools not available

**Fix:**
1. Check config file path is correct
2. JSON must be valid (no trailing commas!)
3. Restart Claude Code completely

### Browser Not Launching

**Error:** "Failed to launch browser"

**Fix:**
```bash
npx playwright install chromium
```

---

## Security Note

The MCP server runs locally on your machine. It doesn't send browser data to external services - it's just a bridge between Claude and your local browser.

---

## Next Steps

1. Follow the setup above
2. Restart Claude Code
3. Tell me: "Browser MCP is ready"
4. I'll start testing your application!

---

**Ready to proceed?** Run the installation command and let me know when done!
