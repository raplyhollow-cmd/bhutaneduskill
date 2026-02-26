/**
 * System Administrator Agent Monitoring Script
 *
 * Purpose: Monitor agent health, token usage, and system resources
 * Usage: node scripts/system-admin-monitor.js
 *
 * Run this script periodically to check:
 * - Active agent tasks
 * - CPU and RAM usage
 * - TypeScript build status
 * - Token budget warnings
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TASKS_DIR = 'D:\\TEMP\\claude\\d--VS-STUDIO-PROJECT-bhutaneduskill\\tasks';
const PROJECT_DIR = 'd:\\VS STUDIO PROJECT\\bhutaneduskill';

// Thresholds
const THRESHOLDS = {
  TOKEN_WARNING: 150000,
  TOKEN_CRITICAL: 180000,
  CPU_WARNING: 80,
  CPU_CRITICAL: 95,
  RAM_WARNING: 80,
  RAM_CRITICAL: 90,
  MAX_PARALLEL_AGENTS: 5
};

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getStatusColor(status) {
  if (status === 'OK' || status === 'Passed') return 'green';
  if (status === 'WARNING') return 'yellow';
  if (status === 'CRITICAL' || status === 'Failed') return 'red';
  return 'blue';
}

/**
 * Check active agent tasks
 */
function checkActiveTasks() {
  console.log(colorize('\n=== Active Agent Tasks ===', 'bold'));

  try {
    if (!fs.existsSync(TASKS_DIR)) {
      console.log(colorize('No tasks directory found', 'yellow'));
      return [];
    }

    const files = fs.readdirSync(TASKS_DIR);
    const activeTasks = [];

    for (const file of files) {
      const filePath = path.join(TASKS_DIR, file);
      const stats = fs.statSync(filePath);

      // Read output file for status
      let status = 'Unknown';
      let tokens = 'N/A';

      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const statusMatch = content.match(/<status>(.+?)<\/status>/);
        const tokenMatch = content.match(/tokens_used["\s:]+(\d+)/i);

        if (statusMatch) status = statusMatch[1];
        if (tokenMatch) tokens = parseInt(tokenMatch[1]);

        // Check token budget
        if (typeof tokens === 'number') {
          if (tokens > THRESHOLDS.TOKEN_CRITICAL) {
            status = 'CRITICAL (Token limit)';
          } else if (tokens > THRESHOLDS.TOKEN_WARNING) {
            status = 'WARNING (High tokens)';
          }
        }
      } catch (e) {
        // Skip if can't read content
      }

      activeTasks.push({
        id: file,
        status,
        tokens,
        modified: stats.mtime
      });
    }

    if (activeTasks.length === 0) {
      console.log(colorize('No active tasks', 'green'));
    } else {
      console.log(colorize(`Active Tasks: ${activeTasks.length}`, 'cyan'));
      console.log('');

      for (const task of activeTasks) {
        const statusColor = getStatusColor(task.status);
        console.log(`  Task: ${colorize(task.id, 'blue')}`);
        console.log(`    Status: ${colorize(task.status, statusColor)}`);
        console.log(`    Tokens: ${colorize(String(task.tokens), task.tokens > THRESHOLDS.TOKEN_WARNING ? 'yellow' : 'green')}`);
        console.log(`    Modified: ${task.modified.toLocaleString()}`);
        console.log('');
      }
    }

    return activeTasks;
  } catch (error) {
    console.error(colorize(`Error checking tasks: ${error.message}`, 'red'));
    return [];
  }
}

/**
 * Check CPU usage (Windows)
 */
function checkCPUUsage() {
  console.log(colorize('\n=== CPU Usage ===', 'bold'));

  try {
    // Windows: wmic cpu get loadpercentage
    const output = execSync('wmic cpu get loadpercentage', { encoding: 'utf8' });
    const usage = parseInt(output.match(/\d+/)?.[0] || '0');

    let status = 'OK';
    let color = 'green';

    if (usage >= THRESHOLDS.CPU_CRITICAL) {
      status = 'CRITICAL - Stop non-urgent agents';
      color = 'red';
    } else if (usage >= THRESHOLDS.CPU_WARNING) {
      status = 'WARNING - Monitor closely';
      color = 'yellow';
    }

    const bar = '█'.repeat(Math.floor(usage / 5)) + '░'.repeat(20 - Math.floor(usage / 5));
    console.log(`  Usage: ${colorize(bar, color)} ${usage}%`);
    console.log(`  Status: ${colorize(status, color)}`);

    return { usage, status };
  } catch (error) {
    console.error(colorize(`Could not check CPU: ${error.message}`, 'red'));
    return { usage: null, status: 'Unknown' };
  }
}

/**
 * Check RAM usage (Windows)
 */
function checkRAMUsage() {
  console.log(colorize('\n=== RAM Usage ===', 'bold'));

  try {
    // Windows: wmic OS get FreePhysicalMemory / TotalVisibleMemorySize
    const freeOutput = execSync('wmic OS get FreePhysicalMemory', { encoding: 'utf8' });
    const totalOutput = execSync('wmic OS get TotalVisibleMemorySize', { encoding: 'utf8' });

    const freeKB = parseInt(freeOutput.match(/\d+/)?.[0] || '0');
    const totalKB = parseInt(totalOutput.match(/\d+/)?.[0] || '0');

    const usedPercent = Math.round(((totalKB - freeKB) / totalKB) * 100);
    const freeGB = Math.round(freeKB / 1024 / 1024 * 10) / 10;
    const totalGB = Math.round(totalKB / 1024 / 1024 * 10) / 10;

    let status = 'OK';
    let color = 'green';

    if (usedPercent >= THRESHOLDS.RAM_CRITICAL) {
      status = 'CRITICAL - Stop agents immediately';
      color = 'red';
    } else if (usedPercent >= THRESHOLDS.RAM_WARNING) {
      status = 'WARNING - Prepare to stop agents';
      color = 'yellow';
    }

    const bar = '█'.repeat(Math.floor(usedPercent / 5)) + '░'.repeat(20 - Math.floor(usedPercent / 5));
    console.log(`  Usage: ${colorize(bar, color)} ${usedPercent}%`);
    console.log(`  Memory: ${freeGB}GB free / ${totalGB}GB total`);
    console.log(`  Status: ${colorize(status, color)}`);

    return { usage: usedPercent, free: freeGB, total: totalGB, status };
  } catch (error) {
    console.error(colorize(`Could not check RAM: ${error.message}`, 'red'));
    return { usage: null, status: 'Unknown' };
  }
}

/**
 * Check TypeScript build status
 */
function checkBuildStatus() {
  console.log(colorize('\n=== Build Status ===', 'bold'));

  try {
    // Quick type check
    execSync('npx tsc --noEmit', { cwd: PROJECT_DIR, stdio: 'pipe' });
    console.log(colorize('  ✅ TypeScript: PASSED', 'green'));
    return { status: 'Passed' };
  } catch (error) {
    console.log(colorize('  ❌ TypeScript: FAILED', 'red'));
    return { status: 'Failed' };
  }
}

/**
 * Generate recommendations
 */
function generateRecommendations(tasks, cpu, ram) {
  console.log(colorize('\n=== Recommendations ===', 'bold'));

  const recommendations = [];

  // Check token usage
  for (const task of tasks) {
    if (typeof task.tokens === 'number') {
      if (task.tokens > THRESHOLDS.TOKEN_CRITICAL) {
        recommendations.push({
          priority: 'CRITICAL',
          action: `STOP task ${task.id} - Exceeded token limit`
        });
      } else if (task.tokens > THRESHOLDS.TOKEN_WARNING) {
        recommendations.push({
          priority: 'WARNING',
          action: `Task ${task.id} approaching token limit - prepare to wrap up`
        });
      }
    }
  }

  // Check CPU
  if (cpu.usage >= THRESHOLDS.CPU_CRITICAL) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'CPU critical - Stop all non-urgent agents immediately'
    });
  } else if (cpu.usage >= THRESHOLDS.CPU_WARNING) {
    recommendations.push({
      priority: 'WARNING',
      action: 'CPU high - Monitor closely, pause new task launches'
    });
  }

  // Check RAM
  if (ram.usage >= THRESHOLDS.RAM_CRITICAL) {
    recommendations.push({
      priority: 'CRITICAL',
      action: 'RAM critical - Stop agents, restart when memory available'
    });
  } else if (ram.usage >= THRESHOLDS.RAM_WARNING) {
    recommendations.push({
      priority: 'WARNING',
      action: 'RAM high - Prepare to stop agents if usage increases'
    });
  }

  // Check parallel agents
  if (tasks.length >= THRESHOLDS.MAX_PARALLEL_AGENTS) {
    recommendations.push({
      priority: 'INFO',
      action: `Max parallel agents reached (${tasks.length}) - Queue new tasks`
    });
  }

  if (recommendations.length === 0) {
    console.log(colorize('  ✅ All systems normal - no actions needed', 'green'));
  } else {
    for (const rec of recommendations) {
      const color = rec.priority === 'CRITICAL' ? 'red' : rec.priority === 'WARNING' ? 'yellow' : 'blue';
      console.log(`  ${colorize(`[${rec.priority}]`, color)} ${rec.action}`);
    }
  }

  return recommendations;
}

/**
 * Update health monitor markdown file
 */
function updateHealthMonitor(tasks, cpu, ram, build, recommendations) {
  const monitorPath = path.join(PROJECT_DIR, 'docs', 'AGENT_HEALTH_MONITOR.md');
  const now = new Date().toLocaleString();

  let content = `# Agent Health Monitor

> **Maintained by:** System Administrator
> **Purpose:** Track agent status, token usage, and resource monitoring
> **Last Updated:** ${now}

---

## Current Status

### Overall System Health

| Metric | Status | Threshold |
|--------|--------|-----------|
| **CPU Usage** | ${cpu.usage !== null ? (cpu.usage >= THRESHOLDS.CPU_CRITICAL ? '🔴' : cpu.usage >= THRESHOLDS.CPU_WARNING ? '🟡' : '🟢') + ` ${cpu.usage}%` : 'Unknown'} | Warning: ${THRESHOLDS.CPU_WARNING}%, Critical: ${THRESHOLDS.CPU_CRITICAL}% |
| **RAM Usage** | ${ram.usage !== null ? (ram.usage >= THRESHOLDS.RAM_CRITICAL ? '🔴' : ram.usage >= THRESHOLDS.RAM_WARNING ? '🟡' : '🟢') + ` ${ram.usage}%` : 'Unknown'} | Warning: ${THRESHOLDS.RAM_WARNING}%, Critical: ${THRESHOLDS.RAM_CRITICAL}% |
| **Active Agents** | ${tasks.length > 0 ? '🟢 ' + tasks.length : '🟢 0'} | Max: ${THRESHOLDS.MAX_PARALLEL_AGENTS} parallel |
| **Build Status** | ${build.status === 'Passed' ? '🟢 Passed' : '🔴 Failed'} | Last checked: ${new Date().toLocaleDateString()} |

---

## Active Agent Sessions

| Session ID | Status | Tokens | Last Update |
|------------|--------|--------|-------------|
`;

  if (tasks.length === 0) {
    content += `| - | - | - | - |\n`;
  } else {
    for (const task of tasks) {
      const statusIcon = task.status.includes('CRITICAL') ? '🔴' : task.status.includes('WARNING') ? '🟡' : '🟢';
      content += `| ${task.id} | ${statusIcon} ${task.status} | ${task.tokens} | ${task.modified.toLocaleString()} |\n`;
    }
  }

  content += `
---

## Recommendations

`;

  if (recommendations.length === 0) {
    content += `*All systems normal - no actions needed*\n`;
  } else {
    for (const rec of recommendations) {
      const icon = rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'WARNING' ? '🟡' : '🔵';
      content += `${icon} **${rec.priority}:** ${rec.action}\n`;
    }
  }

  content += `
---

*Auto-generated by system-admin-monitor.js*
`;

  fs.writeFileSync(monitorPath, content);
  console.log(colorize('\n✅ Health monitor file updated', 'green'));
}

/**
 * Main execution
 */
function main() {
  console.log(colorize('\n╔════════════════════════════════════════╗', 'bold'));
  console.log(colorize('║   SYSTEM ADMINISTRATOR MONITOR        ║', 'bold'));
  console.log(colorize('╚════════════════════════════════════════╝', 'bold'));
  console.log(colorize(`   ${new Date().toLocaleString()}`, 'cyan'));

  const tasks = checkActiveTasks();
  const cpu = checkCPUUsage();
  const ram = checkRAMUsage();
  const build = checkBuildStatus();
  const recommendations = generateRecommendations(tasks, cpu, ram);

  updateHealthMonitor(tasks, cpu, ram, build, recommendations);

  console.log(colorize('\n=== Summary ===', 'bold'));
  console.log(`  Active Tasks: ${tasks.length}`);
  console.log(`  CPU: ${cpu.usage !== null ? cpu.usage + '%' : 'Unknown'}`);
  console.log(`  RAM: ${ram.usage !== null ? ram.usage + '%' : 'Unknown'}`);
  console.log(`  Build: ${build.status}`);
  console.log(colorize('\n✅ Monitor check complete', 'green'));
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  checkActiveTasks,
  checkCPUUsage,
  checkRAMUsage,
  checkBuildStatus,
  generateRecommendations
};
