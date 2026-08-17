# Zephyr Enterprise Tools

Comprehensive tools for Zephyr Enterprise - Release Readiness, Project Health, Test Analytics & More.

## 🛠️ Available Tools

### 🚦 Release Readiness (Quality Gates)

| Tool | Description | Thresholds |
|------|-------------|------------|
| `release-readiness` | Run all 4 quality gates | Combined assessment |
| `requirement-coverage` | Are requirements covered by tests? | ≥70% = GO |
| `test-plan` | Are tests planned and assigned? | <80% = NO GO, 80-90% = CONDITIONAL, ≥90% = GO |
| `test-execution` | Have tests been executed? | <90% = NO GO, 90-97% = CONDITIONAL, ≥97% = GO |
| `defect-quality` | Are critical defects resolved? | Blocker >0 = NO GO, High-risk >10 = NO GO |

### 📊 Analytics & Insights

| Tool | Description |
|------|-------------|
| `project-health` | Overall project health score (0-100) with status |
| `test-coverage` | Detailed test coverage analysis |
| `failed-tests` | List and analyze failed tests |
| `req-coverage` | Requirements with/without test coverage |
| `test-trends` | Test execution trends over time |
| `search-tests` | Search test cases by query |
| `user-activity` | User activity and productivity metrics |

---

## 📦 Installation

```bash
# Install from npm
npm install -g zephyr-enterprise-tools

# Or install locally
npm install zephyr-enterprise-tools
```

---

## ⚙️ Configuration

Set environment variables:

```bash
export ZEPHYR_BASE_URL="https://your-zephyr.com/flex/services/rest/latest"
export ZEPHYR_TOKEN="your-api-token"
```

---

## 🤖 MCP Integration

Use zephyr-enterprise-tools as an MCP (Model Context Protocol) server with your AI assistant.

### VS Code with GitHub Copilot

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "zephyr-enterprise": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "zephyr-enterprise-tools@latest"
      ],
      "env": {
        "ZEPHYR_BASE_URL": "${input:zephyr_base_url}",
        "ZEPHYR_TOKEN": "${input:zephyr_token}"
      }
    }
  },
  "inputs": [
    {
      "id": "zephyr_base_url",
      "type": "promptString",
      "description": "Zephyr Enterprise API Base URL (e.g. https://your-zephyr.com/flex/services/rest/latest)",
      "password": false
    },
    {
      "id": "zephyr_token",
      "type": "promptString",
      "description": "Zephyr Enterprise API Token",
      "password": true
    }
  ]
}
```

### Cursor

Add to your `mcp.json` configuration:

```json
{
  "mcpServers": {
    "zephyr-enterprise": {
      "command": "npx",
      "args": [
        "-y",
        "zephyr-enterprise-tools@latest"
      ],
      "env": {
        "ZEPHYR_BASE_URL": "https://your-zephyr.com/flex/services/rest/latest",
        "ZEPHYR_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Claude Desktop

Edit your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "zephyr-enterprise": {
      "command": "npx",
      "args": [
        "-y",
        "zephyr-enterprise-tools@latest"
      ],
      "env": {
        "ZEPHYR_BASE_URL": "https://your-zephyr.com/flex/services/rest/latest",
        "ZEPHYR_TOKEN": "your-api-token"
      }
    }
  }
}
```

---

## 🖥️ CLI Usage

```bash
# Run all quality gates (release readiness)
zephyr-tools -p <projectId> -r <releaseId>

# Run specific tool
zephyr-tools -p 364 -r 4312 -t project-health
zephyr-tools -p 364 -r 4312 -t failed-tests
zephyr-tools -p 364 -r 4312 -t user-activity

# Search test cases
zephyr-tools -p 364 -r 4312 -t search-tests -q "login"

# Get trends for last 14 days
zephyr-tools -p 364 -r 4312 -t test-trends -d 14

# JSON output (for CI/CD)
zephyr-tools -p 364 -r 4312 --json

# Help
zephyr-tools --help
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-p, --project <id>` | Project ID (required) |
| `-r, --release <id>` | Release ID (required) |
| `-t, --tool <name>` | Tool to run (default: release-readiness) |
| `-q, --query <text>` | Search query (for search-tests) |
| `-d, --days <n>` | Days for trends/activity (default: 30) |
| `-l, --limit <n>` | Max results (default: 50) |
| `--json` | Output as JSON |
| `-h, --help` | Show help |

### Exit Codes
- `0` = GO / Healthy
- `1` = CONDITIONAL GO / At Risk
- `2` = NO GO / Critical

---

## 📚 Programmatic Usage

```javascript
import QualityGates from 'zephyr-quality-gates';
// Or with the new filename:
// import ZephyrTools from './zephyr-enterprise-tools.js';

const tools = new QualityGates({
  baseUrl: 'https://your-zephyr.com/flex/services/rest/latest',
  token: 'your-api-token',
});

// ── Release Readiness ──────────────────────────────────────
const report = await tools.runAllGates(364, 4312);
console.log(report.overallStatus); // "GO" | "CONDITIONAL GO" | "NO GO"

// Individual gates
const coverage = await tools.requirementCoverageGate(364, 4312);
const planning = await tools.testPlanAnalysisGate(364, 4312);
const execution = await tools.testExecutionGate(364, 4312);
const defects = await tools.defectQualityGate(364, 4312);

// ── Analytics & Insights ───────────────────────────────────
const health = await tools.getProjectHealth(364, 4312);
console.log(health.healthScore); // 0-100

const coverage = await tools.getTestCoverage(364, 4312);
const failed = await tools.getFailedTests(364, 4312, { limit: 20 });
const reqCoverage = await tools.getRequirementCoverage(364, 4312);
const trends = await tools.getTestCaseTrends(364, 4312, { days: 14 });
const results = await tools.searchTestCases(364, 4312, { query: 'login' });
const activity = await tools.getUserActivity(364, 4312, { days: 30 });
```

---

## 📊 Sample Outputs

### Release Readiness Report
```
════════════════════════════════════════════════════════════════════════════════
                    RELEASE READINESS REPORT
════════════════════════════════════════════════════════════════════════════════
Project: 364  |  Release: 4312  |  2026-08-12T10:30:00.000Z
────────────────────────────────────────────────────────────────────────────────

┌─────────────────────────┬──────────┬───────────┬─────────────────────────┐
│ Gate                    │ Score    │ Status    │ Threshold               │
├─────────────────────────┼──────────┼───────────┼─────────────────────────┤
│ Requirement Coverage    │ 37.04%   │ 🔴 NO GO  │ ≥70% coverage           │
│ Test Plan Analysis      │ 19.53%   │ 🔴 NO GO  │ ≥90% planned & assigned │
│ Test Execution          │ 80%      │ 🔴 NO GO  │ ≥97% executed           │
│ Defect Quality          │ 0B/0H    │ 🟢 GO     │ 0 blocker, ≤10 high     │
└─────────────────────────┴──────────┴───────────┴─────────────────────────┘

OVERALL: 🔴 NO GO  (1/4 passed, 3 failed, 0 conditional)
```

### Project Health
```
══════════════════════════════════════════════════════════════════════
  PROJECT HEALTH
══════════════════════════════════════════════════════════════════════
Health Score: 🟡 65/100 (MODERATE)

📈 METRICS:
   Requirements:
     Total: 135, Covered: 50, Coverage: 37.04%
   Executions:
     Total: 100, Passed: 80, Failed: 10
     Execution Rate: 90%, Pass Rate: 89%

💡 RECOMMENDATIONS:
   • Improve requirement coverage from 37.04% to ≥70%
```

### User Activity
```
══════════════════════════════════════════════════════════════════════
  USER ACTIVITY
══════════════════════════════════════════════════════════════════════
👥 TEAM SUMMARY:
   Active Users: 5
   Team Completion Rate: 85%
   Team Pass Rate: 78%

👤 USERS:
   ┌─────────────────────────┬────────┬────────┬────────┬────────┐
   │ User                    │ Assign │ Exec   │ Pass%  │ Comp%  │
   ├─────────────────────────┼────────┼────────┼────────┼────────┤
   │ John Smith              │ 50     │ 45     │ 82%    │ 90%    │
   │ Jane Doe                │ 30     │ 28     │ 75%    │ 93%    │
   └─────────────────────────┴────────┴────────┴────────┴────────┘
```

---

## 🔧 CI/CD Integration

### GitHub Actions

```yaml
- name: Check Release Readiness
  env:
    ZEPHYR_BASE_URL: ${{ secrets.ZEPHYR_URL }}
    ZEPHYR_USERNAME: ${{ secrets.ZEPHYR_USER }}
    ZEPHYR_PASSWORD: ${{ secrets.ZEPHYR_PASS }}
  run: |
    npx zephyr-quality-gates -p ${{ vars.PROJECT_ID }} -r ${{ vars.RELEASE_ID }} --json > report.json
    cat report.json
```

### Jenkins

```groovy
stage('Quality Gates') {
  environment {
    ZEPHYR_BASE_URL = credentials('zephyr-url')
    ZEPHYR_USERNAME = credentials('zephyr-user')
    ZEPHYR_PASSWORD = credentials('zephyr-pass')
  }
  steps {
    sh 'node quality-gates/cli.js -p ${PROJECT_ID} -r ${RELEASE_ID}'
  }
}
```

---

## 📝 Customizing Thresholds

Edit `quality-gates.js`:

```javascript
export const THRESHOLDS = {
  requirementCoverage: {
    go: 70,  // Change to 80 for stricter requirements
  },
  testPlanAnalysis: {
    noGo: 80,
    conditionalGo: 90,
  },
  testExecution: {
    noGo: 90,
    conditionalGo: 97,
  },
  defectQuality: {
    blockerLimit: 0,
    highRiskLimit: 10,  // Change to 5 for stricter defect policy
  }
};
```

---

## 📄 License

MIT
