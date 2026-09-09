# Zephyr Enterprise Tools

Comprehensive tools for Zephyr Enterprise — Release Readiness, Project Health, Test Analytics & More.

---

## 🛠️ Available Tools

### 🚦 Release Readiness (Quality Gates)

| Tool | Description | Thresholds |
|------|-------------|------------|
| `release-readiness` | Run all 4 quality gates | Combined assessment |
| `compare-releases` | Compare readiness across two releases | MCP/programmatic API |
| `requirement-coverage` | Are requirements covered by tests? | ≥70% = GO |
| `test-plan` | Are tests planned and assigned? | <80% = NO GO, 80–90% = CONDITIONAL, ≥90% = GO |
| `test-execution` | Have tests been executed? | <90% = NO GO, 90–97% = CONDITIONAL, ≥97% = GO |
| `defect-quality` | Are critical defects resolved? | Blocker > 0 = NO GO, High-risk > 10 = NO GO |

### 📊 Analytics & Insights

| Tool | Description |
|------|-------------|
| `project-health` | Overall project health score (0–100) with status |
| `test-coverage` | Detailed test coverage analysis |
| `failed-tests` | List and analyze failed tests |
| `req-coverage` | Requirements with/without test coverage |
| `test-trends` | Test execution trends over time |
| `search-tests` | Search test cases by keyword query |
| `user-activity` | User activity and productivity metrics |
| `user-trend` | Full audit log history for a user — every action across the system, filterable by date range, entity type, and operation |
| `execution-burnup` | Day-by-day execution burnup (cumulative executed vs ideal and total scope), supports optional date range filtering |
| `execution-burndown` | Day-by-day execution burndown (remaining vs ideal), supports optional date range filtering |
| `list-cycles` | List all test cycles for a release, including phases and execution status counts |
| `get-cycle` | Get full details for a single test cycle |

---

## 📦 Installation

```bash
# Install globally
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

Use `zephyr-enterprise-tools` as an MCP (Model Context Protocol) server with your AI assistant. The server only requires `ZEPHYR_BASE_URL` and `ZEPHYR_TOKEN` at startup — **Project ID and Release ID are passed as parameters when calling each tool**.

### Available MCP Tools

| Tool | Parameters | Description |
|------|-----------|-------------|
| `list_projects` | _(none)_ | List all Zephyr projects |
| `list_releases` | `projectId` | List releases for a project |
| `release_readiness` | `projectId`, `releaseId` | Run all 4 quality gates |
| `compare_releases` | `projectId`, `releaseId1`, `releaseId2`, `query?` _(ZQL)_ | Compare readiness between two releases in the same project |
| `requirement_coverage` | `projectId`, `releaseId` | Check requirement coverage |
| `test_plan_analysis` | `projectId`, `releaseId`, `query?` _(ZQL)_ | Analyze test planning status — supports ZQL filter e.g. `priority = "P1"` |
| `test_execution` | `projectId`, `releaseId` | Check test execution progress |
| `defect_quality` | `projectId`, `releaseId` | Analyze defect status |
| `project_health` | `projectId`, `releaseId` | Get project health score |
| `test_coverage` | `projectId`, `releaseId` | Get test coverage details |
| `failed_tests` | `projectId`, `releaseId`, `limit?` | List failed tests |
| `test_trends` | `projectId`, `releaseId`, `days?` | Get execution trends over time |
| `search_test_cases` | `projectId`, `releaseId`, `query?`, `limit?` | Search test cases by keyword |
| `user_activity` | `projectId`, `releaseId`, `days?` | Get user activity metrics |
| `user_trend` | `userName`*, `fromDate?`, `toDate?`, `entity?`, `operation?`, `pageSize?`, `offset?` | Full audit log history for a user |
| `execution_burnup` | `projectId`, `releaseId`, `startDate?`, `endDate?` | Day-by-day burnup chart data with cumulative executed, ideal, and scope counts |
| `execution_burndown` | `projectId`, `releaseId`, `startDate?`, `endDate?` | Day-by-day burndown chart data |
| `list_cycles` | `releaseId` | List all test cycles for a release, including phases and execution status counts |
| `get_cycle` | `cycleId` | Get full details for a single test cycle, including phases |

> **\* `user_trend` — `userName` must be the user's full email address** (e.g. `jane.doe@yourcompany.com`). Short names or display names will return 0 results. `pageSize` supports up to 1000 records per request.

> **`test_plan_analysis` ZQL filter** — Use the `query` parameter to scope results to a specific priority, e.g. `priority = "P1"`. This is the recommended way to filter test plan metrics by priority. Note: `search_test_cases` accepts keyword queries but does not support ZQL priority filtering.

> **Execution chart date range** — Use `startDate` and `endDate` (format: `YYYY-MM-DD`) to scope `execution_burnup` and `execution_burndown` to a specific period within the release window.

> **Execution status IDs** — Test execution, failed tests, trends, user activity, burnup, burndown, and cycle status counts resolve status IDs from Zephyr v4 system preferences using `testresult.testresultStatus.LOV` from `/admin/preference/all/system`. Built-in IDs are used only as a fallback when the preference cannot be loaded or parsed.

---

### Claude Desktop

Edit your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "zephyr": {
      "command": "npx",
      "args": [
        "-y",
        "--package",
        "zephyr-enterprise-tools@latest",
        "zephyr-mcp"
      ],
      "env": {
        "ZEPHYR_BASE_URL": "https://your-zephyr.com/flex/services/rest/latest",
        "ZEPHYR_TOKEN": "your-api-token"
      }
    }
  }
}
```

### VS Code with GitHub Copilot

Create or edit `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "zephyr": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "--package",
        "zephyr-enterprise-tools",
        "zephyr-mcp"
      ],
      "env": {
        "ZEPHYR_BASE_URL": "https://your-zephyr.com/flex/services/rest/latest",
        "ZEPHYR_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Cursor

Add to your `mcp.json` configuration:

```json
{
  "mcpServers": {
    "zephyr-enterprise": {
      "command": "npx",
      "args": ["-y", "zephyr-enterprise-tools@latest", "mcp"],
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

The CLI binary is `zephyr-enterprise-tools`:

```bash
# Run all quality gates (release readiness)
zephyr-enterprise-tools -p <projectId> -r <releaseId>

# Run a specific tool
zephyr-enterprise-tools -p 364 -r 4312 -t project-health
zephyr-enterprise-tools -p 364 -r 4312 -t failed-tests
zephyr-enterprise-tools -p 364 -r 4312 -t user-activity

# Search test cases by keyword
zephyr-enterprise-tools -p 364 -r 4312 -t search-tests -q "login"

# Test plan analysis filtered to P1 priority (ZQL)
zephyr-enterprise-tools -p 364 -r 4312 -t test-plan -q 'priority = "P1"'

# Get trends for last 14 days
zephyr-enterprise-tools -p 364 -r 4312 -t test-trends -d 14

# Get execution burnup chart data
zephyr-enterprise-tools -p 364 -r 4312 -t execution-burnup --start-date 2026-07-22 --end-date 2026-08-27

# List all cycles and phase details for a release
zephyr-enterprise-tools -p 364 -r 4312 -t list-cycles

# Get one cycle by ID
zephyr-enterprise-tools -p 364 -r 4312 -t get-cycle -c 98765

# Get user audit log (full email required)
zephyr-enterprise-tools -t user-trend --user jane.doe@yourcompany.com --page-size 1000

# JSON output (for CI/CD)
zephyr-enterprise-tools -p 364 -r 4312 --json

# Help
zephyr-enterprise-tools --help
```

### CLI Options

| Option | Description |
|--------|-------------|
| `-p, --project <id>` | Project ID (required for most tools) |
| `-r, --release <id>` | Release ID (required for most tools) |
| `-t, --tool <name>` | Tool to run (default: `release-readiness`) |
| `-q, --query <text>` | Keyword query (for `search-tests`) or ZQL expression (for `test-plan`) |
| `-d, --days <n>` | Days for trends/activity (default: 30) |
| `-l, --limit <n>` | Max results (default: 50) |
| `-c, --cycle <id>` | Cycle ID for `get-cycle` |
| `--user <email>` | Full email address for `user-trend` |
| `--page-size <n>` | Records per page for `user-trend` (max: 1000) |
| `--start-date <YYYY-MM-DD>` | Start date for `execution-burndown` |
| `--end-date <YYYY-MM-DD>` | End date for `execution-burndown` |
| `--json` | Output as JSON |
| `-h, --help` | Show help |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | GO / Healthy |
| `1` | CONDITIONAL GO / At Risk |
| `2` | NO GO / Critical |

---

## 📚 Programmatic Usage

```javascript
import ZephyrEnterpriseTools from 'zephyr-enterprise-tools';

const tools = new ZephyrEnterpriseTools({
  baseUrl: 'https://your-zephyr.com/flex/services/rest/latest',
  token: 'your-api-token',
});

// ── Release Readiness ──────────────────────────────────────
const report = await tools.runAllGates(364, 4312);
console.log(report.overallStatus); // "GO" | "CONDITIONAL GO" | "NO GO"

const comparison = await tools.compareReleases(364, 4312, 4313, { query: 'priority = "P1"' });
console.log(comparison.overallStatusChanged); // true when release readiness status changed

// Individual gates
const coverage  = await tools.requirementCoverageGate(364, 4312);
const planning  = await tools.testPlanAnalysisGate(364, 4312);
const planningP1 = await tools.testPlanAnalysisGate(364, 4312, { query: 'priority = "P1"' });
const execution = await tools.testExecutionGate(364, 4312);
const defects   = await tools.defectQualityGate(364, 4312);

// ── Analytics & Insights ───────────────────────────────────
const health      = await tools.getProjectHealth(364, 4312);
console.log(health.healthScore); // 0–100

const coverage    = await tools.getTestCoverage(364, 4312);
const failed      = await tools.getFailedTests(364, 4312, { limit: 20 });
const reqCoverage = await tools.getRequirementCoverage(364, 4312);
const trends      = await tools.getTestCaseTrends(364, 4312, { days: 14 });
const results     = await tools.searchTestCases(364, 4312, { query: 'login' });
const activity    = await tools.getUserActivity(364, 4312, { days: 30 });
const cycles      = await tools.listCycles(4312);
const cycle       = await tools.getCycle(98765);

// Burnup with optional date range
const burnup      = await tools.getExecutionBurnup(364, 4312, {
  startDate: '2026-07-22',
  endDate:   '2026-08-27',
});

// User audit log — full email address required; pageSize up to 1000
const auditLog    = await tools.getUserTrend({
  userName: 'jane.doe@yourcompany.com',
  fromDate: '2026-07-01',
  toDate:   '2026-08-01',
  pageSize: 1000,
});

// Burndown with optional date range
const burndown    = await tools.getExecutionBurndown(364, 4312, {
  startDate: '2026-07-22',
  endDate:   '2026-08-27',
});
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

┌─────────────────────────┬──────────┬──────────────────┬─────────────────────────┐
│ Gate                    │ Score    │ Status           │ Threshold               │
├─────────────────────────┼──────────┼──────────────────┼─────────────────────────┤
│ Requirement Coverage    │ 37.04%   │ 🔴 NO GO         │ ≥70% coverage           │
│ Test Plan Analysis      │ 19.53%   │ 🔴 NO GO         │ ≥90% planned & assigned │
│ Test Execution          │ 80%      │ 🔴 NO GO         │ ≥97% executed           │
│ Defect Quality          │ 0B / 0H  │ 🟢 GO            │ 0 blockers, ≤10 high    │
└─────────────────────────┴──────────┴──────────────────┴─────────────────────────┘

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
    ZEPHYR_BASE_URL: ${{ secrets.ZEPHYR_BASE_URL }}
    ZEPHYR_TOKEN: ${{ secrets.ZEPHYR_TOKEN }}
  run: |
    npx zephyr-enterprise-tools -p ${{ vars.PROJECT_ID }} -r ${{ vars.RELEASE_ID }} --json > report.json
    cat report.json
```

### Jenkins

```groovy
stage('Quality Gates') {
  environment {
    ZEPHYR_BASE_URL = credentials('zephyr-base-url')
    ZEPHYR_TOKEN    = credentials('zephyr-token')
  }
  steps {
    sh 'npx zephyr-enterprise-tools -p ${PROJECT_ID} -r ${RELEASE_ID}'
  }
}
```

---

## 📝 Customizing Thresholds

Edit `quality-gates.js`:

```javascript
export const THRESHOLDS = {
  requirementCoverage: {
    go: 70,           // Raise to 80 for stricter coverage requirements
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
    highRiskLimit: 10, // Lower to 5 for a stricter defect policy
  }
};
```

---

## 🐛 Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `user_trend` returns 0 results | `userName` is not the full email address | Use full email e.g. `jane.doe@company.com` |
| `search_test_cases` returns no results for `priority = "P1"` | `search_test_cases` does not support ZQL priority filters | Use `test_plan_analysis` with `query: 'priority = "P1"'` instead |
| Auth failure in CI/CD | Using old `ZEPHYR_USERNAME` / `ZEPHYR_PASSWORD` env vars | Replace with `ZEPHYR_TOKEN` |
| Burndown shows wrong date range | No date range specified — defaults to full release window | Pass `startDate` and `endDate` to scope the burndown |

---

## 📄 License

MIT
