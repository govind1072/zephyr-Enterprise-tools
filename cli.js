#!/usr/bin/env node

/**
 * Zephyr Enterprise Tools CLI
 * 
 * Run release readiness checks and analytics from the command line.
 * 
 * Usage:
 *   export ZEPHYR_BASE_URL="https://your-zephyr.com/flex/services/rest/latest"
 *   export ZEPHYR_USERNAME="your-username"
 *   export ZEPHYR_PASSWORD="your-password"
 *   
 *   zephyr-tools --project 364 --release 4312
 *   zephyr-tools -p 364 -r 4312 -t project-health
 *   zephyr-tools -p 364 -r 4312 -t search-tests -q "login"
 */

import QualityGates from './zephyr-enterprise-tools.js';

// ─── Parse Arguments ──────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    projectId: null,
    releaseId: null,
    tool: 'release-readiness',
    gate: null, // Legacy support
    format: 'table',
    help: false,
    query: '',
    days: 30,
    limit: 50,
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '-p':
      case '--project':
        options.projectId = Number(args[++i]);
        break;
      case '-r':
      case '--release':
        options.releaseId = Number(args[++i]);
        break;
      case '-t':
      case '--tool':
        options.tool = args[++i];
        break;
      case '-g':
      case '--gate':
        // Legacy support - map to tool
        options.gate = args[++i];
        break;
      case '-q':
      case '--query':
        options.query = args[++i] || '';
        break;
      case '-d':
      case '--days':
        options.days = parseInt(args[++i], 10) || 30;
        break;
      case '-l':
      case '--limit':
        options.limit = parseInt(args[++i], 10) || 50;
        break;
      case '--json':
        options.format = 'json';
        break;
      case '--table':
        options.format = 'table';
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
    }
  }
  
  // Legacy gate support
  if (options.gate) {
    options.tool = options.gate === 'all' ? 'release-readiness' : options.gate;
  }
  
  return options;
}

// ─── Help ─────────────────────────────────────────────────────────────────────

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                     ZEPHYR ENTERPRISE TOOLS CLI v1.0.0                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

USAGE:
  zephyr-tools -p <projectId> -r <releaseId> [options]

REQUIRED:
  -p, --project <id>    Project ID
  -r, --release <id>    Release ID

OPTIONS:
  -t, --tool <name>     Tool to run (default: release-readiness)
  -q, --query <text>    Search query (for search-tests)
  -d, --days <n>        Number of days for trends/activity (default: 30)
  -l, --limit <n>       Max results to return (default: 50)
      --json            Output as JSON
      --table           Output as table (default)
  -h, --help            Show this help

AVAILABLE TOOLS:
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ RELEASE READINESS (Quality Gates)                                           │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │  release-readiness     Run all 4 quality gates (default)                   │
  │  requirement-coverage  Requirement coverage gate only                       │
  │  test-plan             Test plan analysis gate only                         │
  │  test-execution        Test execution gate only                             │
  │  defect-quality        Defect quality gate only                             │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ ANALYTICS & INSIGHTS                                                        │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │  project-health        Overall project health score and metrics             │
  │  test-coverage         Detailed test coverage analysis                      │
  │  failed-tests          List and analyze failed tests                        │
  │  req-coverage          Requirements with/without test coverage              │
  │  test-trends           Test execution trends over time                      │
  │  search-tests          Search test cases by query                           │
  │  user-activity         User activity and productivity metrics               │
  └─────────────────────────────────────────────────────────────────────────────┘

ENVIRONMENT VARIABLES:
  ZEPHYR_BASE_URL       Zephyr API base URL (required)
  ZEPHYR_USERNAME       Username for Basic auth
  ZEPHYR_PASSWORD       Password for Basic auth
  ZEPHYR_TOKEN          Bearer token (alternative to username/password)

EXAMPLES:
  # Run all quality gates (release readiness)
  zephyr-tools -p 364 -r 4312

  # Check project health
  zephyr-tools -p 364 -r 4312 -t project-health

  # Get failed tests as JSON
  zephyr-tools -p 364 -r 4312 -t failed-tests --json

  # Search for test cases containing "login"
  zephyr-tools -p 364 -r 4312 -t search-tests -q "login"

  # Get test trends for last 14 days
  zephyr-tools -p 364 -r 4312 -t test-trends -d 14

  # Get user activity report
  zephyr-tools -p 364 -r 4312 -t user-activity

QUALITY GATE THRESHOLDS:
  Requirement Coverage:  ≥70% = GO
  Test Plan Analysis:    <80% = NO GO, 80-90% = CONDITIONAL, ≥90% = GO
  Test Execution:        <90% = NO GO, 90-97% = CONDITIONAL, ≥97% = GO
  Defect Quality:        Blocker >0 = NO GO, High-risk >10 = NO GO
`);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTable(report) {
  const { gates, overallStatus, summary, recommendation } = report;
  
  const statusIcon = (s) => s === 'GO' ? '🟢' : s === 'CONDITIONAL GO' ? '🟡' : s === 'NO GO' ? '🔴' : '⚪';
  
  console.log('\n' + '═'.repeat(80));
  console.log('                    RELEASE READINESS REPORT');
  console.log('═'.repeat(80));
  console.log(`Project: ${report.projectId}  |  Release: ${report.releaseId}  |  ${report.timestamp}`);
  console.log('─'.repeat(80));
  
  console.log('\n┌─────────────────────────┬──────────┬───────────┬─────────────────────────┐');
  console.log('│ Gate                    │ Score    │ Status    │ Threshold               │');
  console.log('├─────────────────────────┼──────────┼───────────┼─────────────────────────┤');
  
  // Gate 1
  const g1 = gates.requirementCoverage;
  console.log(`│ Requirement Coverage    │ ${String(g1.coveragePercentage + '%').padEnd(8)} │ ${statusIcon(g1.status)} ${g1.status.padEnd(7)} │ ≥70% coverage           │`);
  
  // Gate 2
  const g2 = gates.testPlanAnalysis;
  console.log(`│ Test Plan Analysis      │ ${String(g2.overallPlanningPercentage + '%').padEnd(8)} │ ${statusIcon(g2.status)} ${g2.status.padEnd(7)} │ ≥90% planned & assigned │`);
  
  // Gate 3
  const g3 = gates.testExecution;
  console.log(`│ Test Execution          │ ${String(g3.executionPercentage + '%').padEnd(8)} │ ${statusIcon(g3.status)} ${g3.status.padEnd(7)} │ ≥97% executed           │`);
  
  // Gate 4
  const g4 = gates.defectQuality;
  const defectScore = `${g4.breakdown?.blocker?.count || 0}B/${g4.breakdown?.highRisk?.count || 0}H`;
  console.log(`│ Defect Quality          │ ${defectScore.padEnd(8)} │ ${statusIcon(g4.status)} ${g4.status.padEnd(7)} │ 0 blocker, ≤10 high     │`);
  
  console.log('└─────────────────────────┴──────────┴───────────┴─────────────────────────┘');
  
  console.log('\n' + '─'.repeat(80));
  console.log(`OVERALL: ${statusIcon(overallStatus)} ${overallStatus}  (${summary.passed}/4 passed, ${summary.failed} failed, ${summary.conditional} conditional)`);
  console.log('─'.repeat(80));
  console.log('\n' + recommendation);
  console.log('\n' + '═'.repeat(80) + '\n');
}

function formatSingleGate(result) {
  const statusIcon = (s) => s === 'GO' ? '🟢' : s === 'CONDITIONAL GO' ? '🟡' : s === 'NO GO' ? '🔴' : '⚪';
  
  console.log('\n' + '─'.repeat(60));
  console.log(`${result.gate.toUpperCase()} GATE`);
  console.log('─'.repeat(60));
  console.log(`Status: ${statusIcon(result.status)} ${result.status}`);
  console.log(`Message: ${result.statusMessage}`);
  
  if (result.coveragePercentage !== undefined) {
    console.log(`Coverage: ${result.coveragePercentage}% (${result.coveredRequirements}/${result.totalRequirements})`);
  }
  if (result.overallPlanningPercentage !== undefined) {
    console.log(`Planning: ${result.overallPlanningPercentage}%`);
  }
  if (result.executionPercentage !== undefined) {
    console.log(`Execution: ${result.executionPercentage}% (${result.completedTests}/${result.totalPlannedTests})`);
    const b = result.breakdown;
    console.log(`Breakdown: ✅${b.passed} ❌${b.failed} ⏸️${b.blocked} 🔄${b.wip} ⏳${b.notExecuted}`);
  }
  if (result.breakdown?.blocker !== undefined) {
    console.log(`Defects: ${result.breakdown.blocker.count} blocker, ${result.breakdown.highRisk.count} high-risk, ${result.breakdown.lowRisk.count} low-risk`);
  }
  console.log('─'.repeat(60) + '\n');
}

// ─── Generic Result Formatter ─────────────────────────────────────────────────

function formatGenericResult(result) {
  const tool = result.tool || 'Result';
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${tool.toUpperCase()}`);
  console.log('═'.repeat(70));
  console.log(`Project: ${result.projectId}  |  Release: ${result.releaseId}  |  ${result.timestamp}`);
  console.log('─'.repeat(70));
  
  // Health score display
  if (result.healthScore !== undefined) {
    const icon = result.healthStatus === 'HEALTHY' ? '🟢' : 
                 result.healthStatus === 'MODERATE' ? '🟡' :
                 result.healthStatus === 'AT RISK' ? '🟠' : '🔴';
    console.log(`\nHealth Score: ${icon} ${result.healthScore}/100 (${result.healthStatus})`);
  }
  
  // Summary section
  if (result.summary) {
    console.log('\n📊 SUMMARY:');
    for (const [key, value] of Object.entries(result.summary)) {
      if (typeof value === 'object') continue;
      console.log(`   ${formatKey(key)}: ${value}`);
    }
  }
  
  // Metrics section
  if (result.metrics) {
    console.log('\n📈 METRICS:');
    for (const [category, metrics] of Object.entries(result.metrics)) {
      console.log(`   ${formatKey(category)}:`);
      for (const [key, value] of Object.entries(metrics)) {
        console.log(`     ${formatKey(key)}: ${value}`);
      }
    }
  }
  
  // Project info section
  if (result.project) {
    const p = result.project;
    console.log(`\n🏢 PROJECT INFO:`);
    console.log(`   Name: ${p.name}`);
    if (p.description) console.log(`   Description: ${p.description}`);
    if (p.startDate) console.log(`   Start Date: ${p.startDate}`);
    
    // Members
    console.log(`\n👥 PROJECT MEMBERS (${p.totalMembers}):`);
    if (p.members && p.members.length > 0) {
      for (const member of p.members.slice(0, 10)) {
        console.log(`   • ${member.name} (${member.role})`);
      }
      if (p.totalMembers > 10) console.log(`   ... and ${p.totalMembers - 10} more`);
    } else {
      console.log(`   No members assigned to this project`);
    }
    
    // Releases
    console.log(`\n📦 RELEASES (${p.totalReleases}):`);
    if (p.releases && p.releases.length > 0) {
      for (const rel of p.releases) {
        const current = rel.isCurrent ? ' ⬅ CURRENT' : '';
        const dates = rel.startDate && rel.endDate ? ` (${rel.startDate} - ${rel.endDate})` : '';
        console.log(`   • ${rel.name} [ID: ${rel.id}]${dates}${current}`);
      }
    } else {
      console.log(`   No releases found`);
    }
  }
  
  // Team summary
  if (result.teamSummary) {
    console.log('\n👥 TEAM SUMMARY:');
    for (const [key, value] of Object.entries(result.teamSummary)) {
      console.log(`   ${formatKey(key)}: ${value}`);
    }
  }
  
  // Assigned To list (for User Activity)
  if (result.assignedTo && result.assignedTo.length > 0) {
    console.log('\n📋 ASSIGNED TO:');
    console.log('   ┌─────────────────────────┬────────┬────────┬────────┬────────┐');
    console.log('   │ User                    │ Assign │ Exec   │ Pass%  │ Comp%  │');
    console.log('   ├─────────────────────────┼────────┼────────┼────────┼────────┤');
    for (const user of result.assignedTo.slice(0, 10)) {
      const name = (user.name || 'Unknown').substring(0, 21).padEnd(23);
      console.log(`   │ ${name} │ ${String(user.assigned).padEnd(6)} │ ${String(user.executed).padEnd(6)} │ ${String(user.passRate + '%').padEnd(6)} │ ${String(user.completionRate + '%').padEnd(6)} │`);
    }
    console.log('   └─────────────────────────┴────────┴────────┴────────┴────────┘');
    if (result.assignedTo.length > 10) console.log(`   ... and ${result.assignedTo.length - 10} more`);
  }
  
  // Executed By list (for User Activity)
  if (result.executedBy && result.executedBy.length > 0) {
    console.log('\n🏃 EXECUTED BY:');
    console.log('   ┌─────────────────────────┬────────┬────────┬────────┬─────────┐');
    console.log('   │ User                    │ Exec   │ Passed │ Failed │ Pass%   │');
    console.log('   ├─────────────────────────┼────────┼────────┼────────┼─────────┤');
    for (const user of result.executedBy.slice(0, 10)) {
      const name = (user.name || 'Unknown').substring(0, 21).padEnd(23);
      console.log(`   │ ${name} │ ${String(user.executed).padEnd(6)} │ ${String(user.passed).padEnd(6)} │ ${String(user.failed).padEnd(6)} │ ${String(user.passRate + '%').padEnd(7)} │`);
    }
    console.log('   └─────────────────────────┴────────┴────────┴────────┴─────────┘');
    if (result.executedBy.length > 10) console.log(`   ... and ${result.executedBy.length - 10} more`);
  }
  
  // Users list (legacy/other tools)
  if (result.users && result.users.length > 0) {
    console.log('\n👤 USERS:');
    console.log('   ┌─────────────────────────┬────────┬────────┬────────┬────────┐');
    console.log('   │ User                    │ Assign │ Exec   │ Pass%  │ Comp%  │');
    console.log('   ├─────────────────────────┼────────┼────────┼────────┼────────┤');
    for (const user of result.users.slice(0, 10)) {
      const name = (user.name || 'Unknown').substring(0, 21).padEnd(23);
      console.log(`   │ ${name} │ ${String(user.assigned).padEnd(6)} │ ${String(user.executed).padEnd(6)} │ ${String(user.passRate + '%').padEnd(6)} │ ${String(user.completionRate + '%').padEnd(6)} │`);
    }
    console.log('   └─────────────────────────┴────────┴────────┴────────┴────────┘');
    if (result.users.length > 10) console.log(`   ... and ${result.users.length - 10} more users`);
  }
  
  // Failed tests list
  if (result.failedTests && result.failedTests.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    for (const test of result.failedTests.slice(0, 15)) {
      console.log(`   • [${test.testcaseKey || test.testcaseId}] ${test.testcaseName}`);
      if (test.executedBy) console.log(`     Tester: ${test.executedBy}`);
    }
    if (result.failedTests.length > 15) console.log(`   ... and ${result.failedTests.length - 15} more failed tests`);
  }
  
  // Search results
  if (result.results && Array.isArray(result.results)) {
    console.log(`\n🔍 RESULTS (${result.returned || result.results.length} of ${result.totalMatches || result.results.length}):`);
    for (const item of result.results.slice(0, 15)) {
      console.log(`   • [${item.key || item.id}] ${item.name}`);
      if (item.status) console.log(`     Status: ${item.status}`);
    }
    if (result.results.length > 15) console.log(`   ... and ${result.results.length - 15} more results`);
  }
  
  // Daily trends
  if (result.dailyTrends && result.dailyTrends.length > 0) {
    console.log('\n📅 DAILY TRENDS (last 10 days):');
    console.log('   ┌────────────┬───────┬────────┬────────┬─────────┐');
    console.log('   │ Date       │ Total │ Passed │ Failed │ Blocked │');
    console.log('   ├────────────┼───────┼────────┼────────┼─────────┤');
    for (const day of result.dailyTrends.slice(-10)) {
      console.log(`   │ ${day.date} │ ${String(day.total).padEnd(5)} │ ${String(day.passed).padEnd(6)} │ ${String(day.failed).padEnd(6)} │ ${String(day.blocked).padEnd(7)} │`);
    }
    console.log('   └────────────┴───────┴────────┴────────┴─────────┘');
  }
  
  // Recommendations
  if (result.recommendations) {
    console.log('\n💡 RECOMMENDATIONS:');
    for (const rec of result.recommendations) {
      console.log(`   • ${rec}`);
    }
  }
  
  // Insight
  if (result.insight) {
    console.log(`\n💡 INSIGHT: ${result.insight}`);
  }
  
  // Message
  if (result.message) {
    console.log(`\n📝 ${result.message}`);
  }
  
  // Status
  if (result.status && !result.healthStatus) {
    const icon = result.status === 'GO' || result.status === 'ADEQUATE' ? '🟢' : 
                 result.status === 'CONDITIONAL GO' || result.status === 'PARTIAL' ? '🟡' : '🔴';
    console.log(`\nStatus: ${icon} ${result.status}`);
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }
  
  if (!options.projectId || !options.releaseId) {
    console.error('Error: --project and --release are required.\n');
    showHelp();
    process.exit(1);
  }
  
  try {
    const tools = new QualityGates({
      baseUrl: process.env.ZEPHYR_BASE_URL,
      username: process.env.ZEPHYR_USERNAME,
      password: process.env.ZEPHYR_PASSWORD,
      token: process.env.ZEPHYR_TOKEN,
    });
    
    let result;
    const { projectId, releaseId, tool, query, days, limit } = options;
    
    switch (tool) {
      // Quality Gates (Release Readiness)
      case 'release-readiness':
      case 'all':
        result = await tools.runAllGates(projectId, releaseId);
        break;
      case 'requirement-coverage':
        result = await tools.requirementCoverageGate(projectId, releaseId);
        break;
      case 'test-plan':
        result = await tools.testPlanAnalysisGate(projectId, releaseId);
        break;
      case 'test-execution':
        result = await tools.testExecutionGate(projectId, releaseId);
        break;
      case 'defect-quality':
        result = await tools.defectQualityGate(projectId, releaseId);
        break;
      
      // Analytics & Insights
      case 'project-health':
        result = await tools.getProjectHealth(projectId, releaseId);
        break;
      case 'test-coverage':
        result = await tools.getTestCoverage(projectId, releaseId);
        break;
      case 'failed-tests':
        result = await tools.getFailedTests(projectId, releaseId, { limit });
        break;
      case 'req-coverage':
        result = await tools.getRequirementCoverage(projectId, releaseId);
        break;
      case 'test-trends':
        result = await tools.getTestCaseTrends(projectId, releaseId, { days });
        break;
      case 'search-tests':
        result = await tools.searchTestCases(projectId, releaseId, { query, limit });
        break;
      case 'user-activity':
        result = await tools.getUserActivity(projectId, releaseId, { days });
        break;
        
      default:
        console.error(`Unknown tool: ${tool}`);
        console.error('Use --help to see available tools.');
        process.exit(1);
    }
    
    if (options.format === 'json') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      // Use appropriate formatter
      if (tool === 'release-readiness' || tool === 'all') {
        formatTable(result);
      } else if (['requirement-coverage', 'test-plan', 'test-execution', 'defect-quality'].includes(tool)) {
        formatSingleGate(result);
      } else {
        formatGenericResult(result);
      }
    }
    
    // Exit code based on status
    const status = result.overallStatus || result.status || result.healthStatus;
    if (status === 'NO GO' || status === 'CRITICAL') process.exit(2);
    if (status === 'CONDITIONAL GO' || status === 'AT RISK') process.exit(1);
    process.exit(0);
    
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
