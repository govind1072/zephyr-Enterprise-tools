/**
 * Zephyr Enterprise Tools Module
 * 
 * Provides comprehensive tools for Zephyr Enterprise:
 * 
 * RELEASE READINESS (Quality Gates):
 *   1. Requirement Coverage Gate - Are requirements covered by tests?
 *   2. Test Plan Analysis Gate - Are tests planned and assigned?
 *   3. Test Execution Gate - Have tests been executed?
 *   4. Defect Quality Gate - Are critical defects resolved?
 * 
 * ANALYTICS & INSIGHTS:
 *   5. Project Health - Overall project health metrics
 *   6. Test Coverage - Detailed test coverage analysis
 *   7. Failed Tests - Analyze and list failed tests
 *   8. Requirement Coverage - Requirements without test coverage
 *   9. Test Case Trends - Test case creation/execution trends
 *   10. Search Test Cases - Search test cases by criteria
 *   11. User Activity - User activity and productivity metrics
 * 
 * Usage:
 *   import { ZephyrTools } from './quality-gates.js';
 *   const tools = new ZephyrTools({ baseUrl, username, password });
 *   const report = await tools.runAllGates(projectId, releaseId);
 *   const health = await tools.getProjectHealth(projectId, releaseId);
 */

// ─── Configuration & Thresholds ───────────────────────────────────────────────

export const THRESHOLDS = {
  requirementCoverage: {
    go: 70,
    description: "≥70% coverage = GO, <70% = NO GO"
  },
  testPlanAnalysis: {
    noGo: 80,
    conditionalGo: 90,
    description: "<80% = NO GO, 80-90% = CONDITIONAL GO, ≥90% = GO"
  },
  testExecution: {
    noGo: 90,
    conditionalGo: 97,
    description: "<90% = NO GO, 90-97% = CONDITIONAL GO, ≥97% = GO"
  },
  defectQuality: {
    blockerLimit: 0,
    highRiskLimit: 10,
    description: "Blocker >0 = NO GO, High-risk >10 = NO GO, 1-10 = CONDITIONAL, 0 = GO"
  }
};

export const RESOLVED_STATUSES = ['done', 'closed', 'ready for release', 'verified', 'resolved', 'fixed'];
export const BLOCKER_PRIORITIES = ['blocker', 'critical', 'p1', '1', 'highest'];
export const HIGH_RISK_PRIORITIES = ['high', 'medium', 'p2', 'p3', '2', '3'];
export const LOW_RISK_PRIORITIES = ['low', 'trivial', 'p4', 'p5', '4', '5', 'lowest', 'minor'];

// ─── Quality Gates Class ──────────────────────────────────────────────────────

export class QualityGates {
  constructor(config) {
    this.baseUrl = (config.baseUrl || process.env.ZEPHYR_BASE_URL || "").replace(/\/$/, "");
    this.username = config.username || process.env.ZEPHYR_USERNAME || "";
    this.password = config.password || process.env.ZEPHYR_PASSWORD || "";
    this.token = config.token || process.env.ZEPHYR_TOKEN || "";
    
    if (!this.baseUrl) {
      throw new Error("ZEPHYR_BASE_URL is required");
    }
  }

  // ─── HTTP Helper ────────────────────────────────────────────────────────────

  authHeader() {
    if (this.token) return { Authorization: `Bearer ${this.token}` };
    return { Authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}` };
  }

  async request(method, path, params = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString(), {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...this.authHeader() },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Zephyr API ${res.status}: ${text}`);
    }
    return res.json();
  }

  async GET(path, params) {
    return this.request("GET", path, params);
  }

  async PUT(path, params, body) {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString(), {
      method: "PUT",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...this.authHeader() },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Zephyr API ${res.status}: ${text}`);
    }
    return res.json();
  }

  // ─── Gate 1: Requirement Coverage ───────────────────────────────────────────

  async requirementCoverageGate(projectId, releaseId) {
    const summary = await this.GET(`/summary/release/${releaseId}`, { isHideCycleEnabled: true });
    
    const reqSummary = summary.requirement || {};
    const total = reqSummary.totalRequirementCount || 0;
    const covered = reqSummary.mappedRequirementCount || 0;
    const notCovered = reqSummary.unmappedRequirementCount || 0;
    const coveragePercentage = total > 0 ? Math.round((covered / total) * 100 * 100) / 100 : 0;
    
    const threshold = THRESHOLDS.requirementCoverage.go;
    const status = coveragePercentage >= threshold ? "GO" : "NO GO";
    const statusMessage = coveragePercentage >= threshold 
      ? `Coverage is ${coveragePercentage}% (≥${threshold}%) - Ready for release`
      : `Coverage is ${coveragePercentage}% (<${threshold}%) - Not ready. ${notCovered} requirements need test coverage.`;
    
    return {
      gate: "Requirement Coverage",
      projectId,
      releaseId,
      totalRequirements: total,
      coveredRequirements: covered,
      notCoveredRequirements: notCovered,
      coveragePercentage,
      threshold,
      status,
      statusMessage,
    };
  }

  // ─── Gate 2: Test Plan Analysis ─────────────────────────────────────────────

  async testPlanAnalysisGate(projectId, releaseId) {
    const summary = await this.GET(`/summary/release/${releaseId}`, { isHideCycleEnabled: false });
    
    const totalTestcases = summary.testcase?.totalTestcaseCount || 0;
    const mappedRequirements = summary.requirement?.mappedRequirementCount || 0;
    const totalRequirements = summary.requirement?.totalRequirementCount || 0;
    
    // Get all executions for the release
    const executionData = await this.GET("/execution", {
      releaseid: releaseId,
      offset: 0,
      pagesize: 10000,
      includeanyoneuser: true,
    });
    
    const executions = executionData.results || executionData || [];
    const totalExecutions = Array.isArray(executions) ? executions.length : 0;
    
    // Count assigned executions
    const assignedExecutions = Array.isArray(executions) 
      ? executions.filter(e => e.testerId && e.testerId > 0).length 
      : 0;
    
    // Count unique planned test cases
    const uniquePlannedTestcases = new Set(
      Array.isArray(executions) 
        ? executions.map(e => e.tcrTreeTestcase?.testcase?.id || e.testcaseId).filter(Boolean)
        : []
    ).size;
    
    // Calculate metrics
    const testcasePlanningPct = totalTestcases > 0 
      ? Math.min(100, Math.round((uniquePlannedTestcases / totalTestcases) * 100 * 100) / 100)
      : 0;
    
    const executionAssignmentPct = totalExecutions > 0 
      ? Math.round((assignedExecutions / totalExecutions) * 100 * 100) / 100 
      : 0;
    
    const overallPlanningPct = Math.round(((testcasePlanningPct + executionAssignmentPct) / 2) * 100) / 100;
    
    // Determine status
    const { noGo, conditionalGo } = THRESHOLDS.testPlanAnalysis;
    let status, statusMessage;
    
    if (overallPlanningPct < noGo) {
      status = "NO GO";
      statusMessage = `Overall planning is ${overallPlanningPct}% (<${noGo}%) - Not ready.`;
    } else if (overallPlanningPct < conditionalGo) {
      status = "CONDITIONAL GO";
      statusMessage = `Overall planning is ${overallPlanningPct}% (${noGo}-${conditionalGo}%) - Proceed with caution.`;
    } else {
      status = "GO";
      statusMessage = `Overall planning is ${overallPlanningPct}% (≥${conditionalGo}%) - Ready for execution.`;
    }
    
    return {
      gate: "Test Plan Analysis",
      projectId,
      releaseId,
      analysis: {
        testcasePlanning: {
          totalTestcases,
          plannedTestcases: uniquePlannedTestcases,
          percentage: testcasePlanningPct,
        },
        executionAssignment: {
          totalExecutions,
          assignedExecutions,
          percentage: executionAssignmentPct,
        },
        requirementCoverage: {
          totalRequirements,
          mappedRequirements,
          percentage: totalRequirements > 0 ? Math.round((mappedRequirements / totalRequirements) * 100 * 100) / 100 : 0,
        },
      },
      overallPlanningPercentage: overallPlanningPct,
      thresholds: { noGo, conditionalGo },
      status,
      statusMessage,
    };
  }

  // ─── Gate 3: Test Execution Gate ────────────────────────────────────────────

  async testExecutionGate(projectId, releaseId) {
    const executionData = await this.GET("/execution", {
      releaseid: releaseId,
      offset: 0,
      pagesize: 10000,
      includeanyoneuser: true,
    });
    
    const executions = executionData.results || executionData || [];
    const totalExecutions = Array.isArray(executions) ? executions.length : 0;
    
    if (totalExecutions === 0) {
      return {
        gate: "Test Execution",
        projectId,
        releaseId,
        totalPlannedTests: 0,
        completedTests: 0,
        executionPercentage: 0,
        status: "NO GO",
        statusMessage: "No test executions found for this release.",
        breakdown: { passed: 0, failed: 0, notApplicable: 0, wip: 0, blocked: 0, notExecuted: 0 },
      };
    }
    
    // Count by status (from lastTestResult.executionStatus)
    let passed = 0, failed = 0, notApplicable = 0, wip = 0, blocked = 0, notExecuted = 0;
    
    for (const exec of executions) {
      const status = exec.lastTestResult?.executionStatus || exec.status || exec.executionStatus || 0;
      switch (Number(status)) {
        case 1: passed++; break;
        case 2: failed++; break;
        case 3: wip++; break;
        case 4: blocked++; break;
        case 5: notApplicable++; break;
        default: notExecuted++; break;
      }
    }
    
    const completedTests = passed + failed + notApplicable;
    const incompleteTests = wip + blocked + notExecuted;
    const executionPct = Math.round((completedTests / totalExecutions) * 100 * 100) / 100;
    
    // Determine status
    const { noGo, conditionalGo } = THRESHOLDS.testExecution;
    let status, statusMessage;
    
    if (executionPct < noGo) {
      status = "NO GO";
      statusMessage = `Execution is ${executionPct}% (<${noGo}%) - ${incompleteTests} tests need resolution.`;
    } else if (executionPct < conditionalGo) {
      status = "CONDITIONAL GO";
      statusMessage = `Execution is ${executionPct}% (${noGo}-${conditionalGo}%) - ${incompleteTests} tests incomplete.`;
    } else {
      status = "GO";
      statusMessage = `Execution is ${executionPct}% (≥${conditionalGo}%) - Gate passed.`;
    }
    
    return {
      gate: "Test Execution",
      projectId,
      releaseId,
      totalPlannedTests: totalExecutions,
      completedTests,
      incompleteTests,
      executionPercentage: executionPct,
      thresholds: { noGo, conditionalGo },
      status,
      statusMessage,
      breakdown: { passed, failed, notApplicable, wip, blocked, notExecuted },
    };
  }

  // ─── Gate 4: Defect Quality Gate ────────────────────────────────────────────

  async defectQualityGate(projectId, releaseId) {
    // Step 1: Get defect IDs from release summary
    let defectIds = [];
    try {
      const summary = await this.GET(`/summary/release/${releaseId}`, {});
      const defectSummary = summary.defect || {};
      defectIds = defectSummary.totalDefectIds || [];
      
      if (defectIds.length === 0) {
        return {
          gate: "Defect Quality",
          projectId,
          releaseId,
          totalDefectsAnalyzed: 0,
          unresolvedDefects: 0,
          status: "GO",
          statusMessage: "No defects found. Quality gate passed.",
        };
      }
    } catch (e) {
      return {
        gate: "Defect Quality",
        projectId,
        releaseId,
        status: "UNKNOWN",
        statusMessage: "Unable to retrieve defect data from release summary.",
        error: e.message,
      };
    }
    
    // Step 2: Get full defect details using PUT /v3/defect with JQL search
    // Note: Defect API uses v3, not latest - we need to adjust the path
    let defects = [];
    try {
      const searchString = `issuekey in (${defectIds.join(',')})`;
      // Build v3 URL by replacing /latest/ with /v3/ in baseUrl
      const v3BaseUrl = this.baseUrl.replace('/latest', '/v3');
      const url = new URL(`${v3BaseUrl}/defect`);
      url.searchParams.set('offset', '0');
      url.searchParams.set('maxresult', '100');
      url.searchParams.set('searchtype', '1');
      url.searchParams.set('maptc', 'true');
      url.searchParams.set('projectId', String(projectId));
      url.searchParams.set('order', 'id');
      url.searchParams.set('isascorder', 'true');
      
      const res = await fetch(url.toString(), {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...this.authHeader() },
        body: JSON.stringify({ searchString }),
      });
      
      if (!res.ok) {
        throw new Error(`Defect API ${res.status}`);
      }
      
      const defectData = await res.json();
      // Response format: { bugsList: [...], maxResult: N }
      defects = defectData?.bugsList || [];
      if (!Array.isArray(defects)) defects = [];
    } catch (e) {
      // Fallback: return with IDs only (treat all as high-risk)
      return {
        gate: "Defect Quality",
        projectId,
        releaseId,
        totalDefectsAnalyzed: defectIds.length,
        unresolvedDefects: defectIds.length,
        status: "CONDITIONAL GO",
        statusMessage: `${defectIds.length} defect(s) found but details unavailable. Review manually.`,
        defectIds,
        note: "Could not fetch defect details. Treat as high-risk.",
        error: e.message,
      };
    }
    
    // Step 3: Classify defects by status and priority
    let blockerCount = 0, highRiskCount = 0, lowRiskCount = 0, resolvedCount = 0;
    const blockerDefects = [], highRiskDefects = [], lowRiskDefects = [], resolvedDefects = [];
    
    for (const defect of defects) {
      const status = (defect.status || '').toString().toLowerCase();
      const priority = (defect.priority || '').toString().toLowerCase();
      const isResolved = RESOLVED_STATUSES.some(rs => status.includes(rs));
      
      const defectInfo = {
        id: defect.alternateId || defect.id,
        summary: defect.shortDesc || defect.name || defect.summary,
        priority: defect.priority,
        status: defect.status,
        resolution: defect.resolution,
      };
      
      if (isResolved) {
        resolvedCount++;
        resolvedDefects.push(defectInfo);
      } else if (BLOCKER_PRIORITIES.some(p => priority.includes(p))) {
        blockerCount++;
        blockerDefects.push(defectInfo);
      } else if (HIGH_RISK_PRIORITIES.some(p => priority.includes(p))) {
        highRiskCount++;
        highRiskDefects.push(defectInfo);
      } else if (LOW_RISK_PRIORITIES.some(p => priority.includes(p))) {
        lowRiskCount++;
        lowRiskDefects.push(defectInfo);
      } else {
        // Unknown priority - treat as high risk
        highRiskCount++;
        highRiskDefects.push({ ...defectInfo, note: 'Unknown priority - treated as high-risk' });
      }
    }
    
    const unresolvedCount = blockerCount + highRiskCount + lowRiskCount;
    
    // Step 4: Determine GO status
    const { highRiskLimit } = THRESHOLDS.defectQuality;
    let status, statusMessage;
    
    if (blockerCount > 0) {
      status = "NO GO";
      statusMessage = `${blockerCount} blocker defect(s) found (${blockerDefects.map(d => d.id).join(', ')}). All must be resolved before release.`;
    } else if (highRiskCount > highRiskLimit) {
      status = "NO GO";
      statusMessage = `${highRiskCount} high-risk defects (>${highRiskLimit} limit). Reduce before release.`;
    } else if (highRiskCount > 0) {
      status = "CONDITIONAL GO";
      statusMessage = `${highRiskCount} high-risk defect(s) found (1-${highRiskLimit} allowed). Plan fixes.`;
    } else if (lowRiskCount > 0) {
      status = "GO";
      statusMessage = `No blocker or high-risk defects. ${lowRiskCount} low-risk defect(s) are acceptable.`;
    } else {
      status = "GO";
      statusMessage = `All ${resolvedCount} defect(s) are resolved. Quality gate passed.`;
    }
    
    return {
      gate: "Defect Quality",
      projectId,
      releaseId,
      totalDefectsAnalyzed: defects.length,
      unresolvedDefects: unresolvedCount,
      resolvedDefects: resolvedCount,
      status,
      statusMessage,
      breakdown: {
        blocker: { count: blockerCount, defects: blockerDefects },
        highRisk: { count: highRiskCount, defects: highRiskDefects },
        lowRisk: { count: lowRiskCount, defects: lowRiskDefects },
        resolved: { count: resolvedCount, defects: resolvedDefects },
      },
      defectIds,
    };
  }

  // ─── Run All Gates ──────────────────────────────────────────────────────────

  async runAllGates(projectId, releaseId) {
    const results = await Promise.all([
      this.requirementCoverageGate(projectId, releaseId),
      this.testPlanAnalysisGate(projectId, releaseId),
      this.testExecutionGate(projectId, releaseId),
      this.defectQualityGate(projectId, releaseId),
    ]);
    
    const gates = {
      requirementCoverage: results[0],
      testPlanAnalysis: results[1],
      testExecution: results[2],
      defectQuality: results[3],
    };
    
    // Calculate overall status
    const statuses = results.map(r => r.status);
    let overallStatus;
    
    if (statuses.includes("NO GO")) {
      overallStatus = "NO GO";
    } else if (statuses.includes("CONDITIONAL GO")) {
      overallStatus = "CONDITIONAL GO";
    } else if (statuses.includes("UNKNOWN")) {
      overallStatus = "CONDITIONAL GO";
    } else {
      overallStatus = "GO";
    }
    
    const passedGates = statuses.filter(s => s === "GO").length;
    const failedGates = statuses.filter(s => s === "NO GO").length;
    const conditionalGates = statuses.filter(s => s === "CONDITIONAL GO" || s === "UNKNOWN").length;
    
    return {
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      overallStatus,
      summary: {
        passed: passedGates,
        failed: failedGates,
        conditional: conditionalGates,
        total: 4,
      },
      gates,
      recommendation: this.getRecommendation(overallStatus, gates),
    };
  }

  getRecommendation(status, gates) {
    const issues = [];
    
    if (gates.requirementCoverage.status === "NO GO") {
      issues.push(`• Map tests to ${gates.requirementCoverage.notCoveredRequirements} uncovered requirements`);
    }
    if (gates.testPlanAnalysis.status === "NO GO") {
      issues.push(`• Plan and assign test executions (current: ${gates.testPlanAnalysis.overallPlanningPercentage}%)`);
    }
    if (gates.testExecution.status === "NO GO") {
      issues.push(`• Execute ${gates.testExecution.incompleteTests} incomplete tests`);
    }
    if (gates.defectQuality.status === "NO GO") {
      const blocker = gates.defectQuality.breakdown?.blocker?.count || 0;
      const highRisk = gates.defectQuality.breakdown?.highRisk?.count || 0;
      if (blocker > 0) issues.push(`• Resolve ${blocker} blocker defect(s)`);
      if (highRisk > 10) issues.push(`• Reduce high-risk defects from ${highRisk} to ≤10`);
    }
    
    if (status === "GO") {
      return "✅ All quality gates passed. Release is ready.";
    } else if (status === "CONDITIONAL GO") {
      return "⚠️ Proceed with caution. Minor issues exist but release is possible.";
    } else {
      return `🚨 Release blocked. Action items:\n${issues.join('\n')}`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 5: PROJECT HEALTH
  // ═══════════════════════════════════════════════════════════════════════════

  async getProjectHealth(projectId, releaseId) {
    const summary = await this.GET(`/summary/release/${releaseId}`, { isHideCycleEnabled: false });
    
    // Requirements metrics
    const reqData = summary.requirement || {};
    const totalReqs = reqData.totalRequirementCount || 0;
    const mappedReqs = reqData.mappedRequirementCount || 0;
    const reqCoverage = totalReqs > 0 ? Math.round((mappedReqs / totalReqs) * 100 * 100) / 100 : 0;
    
    // Test case metrics
    const tcData = summary.testcase || {};
    const totalTestcases = tcData.totalTestcaseCount || 0;
    
    // Execution metrics
    const execData = summary.execution || {};
    const totalExecutions = execData.totalExecutionCount || 0;
    const passedCount = execData.passedExecutionCount || 0;
    const failedCount = execData.failedExecutionCount || 0;
    const blockedCount = execData.blockedExecutionCount || 0;
    const wipCount = execData.wipExecutionCount || 0;
    const notExecutedCount = execData.unexecutedCount || 0;
    
    const completedExecutions = passedCount + failedCount;
    const executionRate = totalExecutions > 0 ? Math.round((completedExecutions / totalExecutions) * 100 * 100) / 100 : 0;
    const passRate = completedExecutions > 0 ? Math.round((passedCount / completedExecutions) * 100 * 100) / 100 : 0;
    
    // Defect metrics
    const defectData = summary.defect || {};
    const totalDefects = defectData.totalDefectCount || 0;
    const openDefects = defectData.openDefectCount || totalDefects;
    
    // Calculate health score (0-100)
    const reqScore = reqCoverage;
    const execScore = executionRate;
    const passScore = passRate;
    const defectPenalty = Math.min(30, openDefects * 3); // Penalty for open defects
    
    const healthScore = Math.max(0, Math.round(
      (reqScore * 0.25 + execScore * 0.35 + passScore * 0.40) - defectPenalty
    ));
    
    let healthStatus;
    if (healthScore >= 80) healthStatus = "HEALTHY";
    else if (healthScore >= 60) healthStatus = "MODERATE";
    else if (healthScore >= 40) healthStatus = "AT RISK";
    else healthStatus = "CRITICAL";
    
    return {
      tool: "Project Health",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      healthScore,
      healthStatus,
      metrics: {
        requirements: {
          total: totalReqs,
          covered: mappedReqs,
          uncovered: totalReqs - mappedReqs,
          coveragePercentage: reqCoverage,
        },
        testCases: {
          total: totalTestcases,
        },
        executions: {
          total: totalExecutions,
          passed: passedCount,
          failed: failedCount,
          blocked: blockedCount,
          wip: wipCount,
          notExecuted: notExecutedCount,
          executionRate,
          passRate,
        },
        defects: {
          total: totalDefects,
          open: openDefects,
        },
      },
      recommendations: this.getHealthRecommendations(healthScore, reqCoverage, executionRate, passRate, openDefects),
    };
  }

  getHealthRecommendations(score, reqCoverage, execRate, passRate, openDefects) {
    const recs = [];
    if (reqCoverage < 70) recs.push(`Improve requirement coverage from ${reqCoverage}% to ≥70%`);
    if (execRate < 90) recs.push(`Execute more tests - current rate is ${execRate}%`);
    if (passRate < 80) recs.push(`Investigate failing tests - pass rate is ${passRate}%`);
    if (openDefects > 5) recs.push(`Resolve ${openDefects} open defects`);
    if (recs.length === 0) recs.push("Project is in good health!");
    return recs;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 6: TEST COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════

  async getTestCoverage(projectId, releaseId) {
    const summary = await this.GET(`/summary/release/${releaseId}`, { isHideCycleEnabled: false });
    
    const reqData = summary.requirement || {};
    const tcData = summary.testcase || {};
    const execData = summary.execution || {};
    
    const totalRequirements = reqData.totalRequirementCount || 0;
    const coveredRequirements = reqData.mappedRequirementCount || 0;
    const uncoveredRequirements = reqData.unmappedRequirementCount || 0;
    
    const totalTestcases = tcData.totalTestcaseCount || 0;
    const totalExecutions = execData.totalExecutionCount || 0;
    
    // Calculate coverage metrics
    const requirementCoverage = totalRequirements > 0 
      ? Math.round((coveredRequirements / totalRequirements) * 100 * 100) / 100 
      : 0;
    
    const testcaseToReqRatio = totalRequirements > 0 
      ? Math.round((totalTestcases / totalRequirements) * 100) / 100 
      : 0;
    
    const executionCoverage = totalTestcases > 0 
      ? Math.round((totalExecutions / totalTestcases) * 100 * 100) / 100 
      : 0;
    
    return {
      tool: "Test Coverage",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      summary: {
        requirementCoveragePercentage: requirementCoverage,
        executionCoveragePercentage: executionCoverage,
        testcaseToRequirementRatio: testcaseToReqRatio,
      },
      details: {
        requirements: {
          total: totalRequirements,
          covered: coveredRequirements,
          uncovered: uncoveredRequirements,
        },
        testCases: {
          total: totalTestcases,
          avgPerRequirement: testcaseToReqRatio,
        },
        executions: {
          total: totalExecutions,
        },
      },
      status: requirementCoverage >= 70 ? "ADEQUATE" : requirementCoverage >= 50 ? "PARTIAL" : "INSUFFICIENT",
      message: requirementCoverage >= 70 
        ? `Good coverage at ${requirementCoverage}%` 
        : `Coverage is ${requirementCoverage}%. ${uncoveredRequirements} requirements need test cases.`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 7: FAILED TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  async getFailedTests(projectId, releaseId, options = {}) {
    const { limit = 50, includeSteps = false } = options;
    
    // Get all executions
    const executionData = await this.GET("/execution", {
      releaseid: releaseId,
      offset: 0,
      pagesize: 10000,
      includeanyoneuser: true,
    });
    
    const executions = executionData.results || executionData || [];
    
    // Filter to failed tests (status = 2)
    const failedExecutions = executions.filter(exec => {
      const status = exec.lastTestResult?.executionStatus || exec.status || exec.executionStatus || 0;
      return Number(status) === 2;
    });
    
    // Build failed test list
    const failedTests = failedExecutions.slice(0, limit).map(exec => {
      const tc = exec.tcrTreeTestcase?.testcase || {};
      return {
        executionId: exec.id,
        testcaseId: tc.id || exec.testcaseId,
        testcaseName: tc.name || exec.name || "Unknown",
        testcaseKey: tc.testcaseKey || tc.alternateId,
        lastExecutedOn: exec.lastTestResult?.executedOn || exec.executedOn,
        executedBy: exec.lastTestResult?.testerName || exec.testerName,
        cycleName: exec.tcrTreeTestcase?.tcrCatalogTreeId?.name || exec.cycleName,
        cyclePhase: exec.cyclePhase?.name,
        defects: exec.lastTestResult?.defects || [],
      };
    });
    
    // Summary stats
    const totalExecutions = executions.length;
    const failedCount = failedExecutions.length;
    const passedCount = executions.filter(e => Number(e.lastTestResult?.executionStatus || e.status || 0) === 1).length;
    
    return {
      tool: "Failed Tests",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      summary: {
        totalExecutions,
        failedCount,
        passedCount,
        failureRate: totalExecutions > 0 ? Math.round((failedCount / totalExecutions) * 100 * 100) / 100 : 0,
      },
      failedTests,
      message: failedCount === 0 
        ? "No failed tests found!" 
        : `${failedCount} test(s) failed out of ${totalExecutions} (${Math.round((failedCount / totalExecutions) * 100)}%)`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 8: REQUIREMENT COVERAGE (Detailed)
  // ═══════════════════════════════════════════════════════════════════════════

  async getRequirementCoverage(projectId, releaseId) {
    // Get release summary
    const summary = await this.GET(`/summary/release/${releaseId}`, {});
    
    const reqData = summary.requirement || {};
    const totalRequirements = reqData.totalRequirementCount || 0;
    const coveredRequirements = reqData.mappedRequirementCount || 0;
    const uncoveredRequirements = reqData.unmappedRequirementCount || 0;
    
    // Try to get requirements list
    let requirements = [];
    try {
      const reqList = await this.GET("/requirement", {
        projectId: projectId,
        releaseId: releaseId,
        offset: 0,
        maxRecords: 500,
      });
      requirements = reqList.results || reqList || [];
    } catch (e) {
      // Requirement list may not be available
    }
    
    // Categorize requirements
    const covered = [];
    const uncovered = [];
    
    for (const req of requirements) {
      const reqInfo = {
        id: req.id,
        key: req.externalId || req.alternateId || req.requirementKey,
        name: req.name,
        priority: req.priority,
        testcaseCount: req.testcaseCount || 0,
      };
      
      if (req.testcaseCount > 0) {
        covered.push(reqInfo);
      } else {
        uncovered.push(reqInfo);
      }
    }
    
    const coveragePercentage = totalRequirements > 0 
      ? Math.round((coveredRequirements / totalRequirements) * 100 * 100) / 100 
      : 0;
    
    return {
      tool: "Requirement Coverage",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalRequirements,
        covered: coveredRequirements,
        uncovered: uncoveredRequirements,
        coveragePercentage,
      },
      status: coveragePercentage >= 70 ? "GO" : "NO GO",
      message: coveragePercentage >= 70 
        ? `Coverage is ${coveragePercentage}% - meets threshold`
        : `Coverage is ${coveragePercentage}% - ${uncoveredRequirements} requirements need test coverage`,
      details: {
        coveredRequirements: covered.slice(0, 20),
        uncoveredRequirements: uncovered.slice(0, 20),
        note: requirements.length > 40 ? "Showing first 20 of each category" : undefined,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 9: TEST CASE TRENDS
  // ═══════════════════════════════════════════════════════════════════════════

  async getTestCaseTrends(projectId, releaseId, options = {}) {
    const { days = 30 } = options;
    
    // Get executions
    const executionData = await this.GET("/execution", {
      releaseid: releaseId,
      offset: 0,
      pagesize: 10000,
      includeanyoneuser: true,
    });
    
    const executions = executionData.results || executionData || [];
    
    // Group executions by date
    const trendsByDate = {};
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    for (const exec of executions) {
      const executedOn = exec.lastTestResult?.executedOn || exec.executedOn;
      if (!executedOn) continue;
      
      const execDate = new Date(executedOn);
      if (execDate < startDate) continue;
      
      const dateKey = execDate.toISOString().split('T')[0];
      
      if (!trendsByDate[dateKey]) {
        trendsByDate[dateKey] = { passed: 0, failed: 0, blocked: 0, wip: 0, total: 0 };
      }
      
      const status = exec.lastTestResult?.executionStatus || exec.status || 0;
      trendsByDate[dateKey].total++;
      
      switch (Number(status)) {
        case 1: trendsByDate[dateKey].passed++; break;
        case 2: trendsByDate[dateKey].failed++; break;
        case 3: trendsByDate[dateKey].wip++; break;
        case 4: trendsByDate[dateKey].blocked++; break;
      }
    }
    
    // Convert to sorted array
    const trends = Object.entries(trendsByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
    
    // Calculate totals
    const totals = trends.reduce((acc, day) => ({
      passed: acc.passed + day.passed,
      failed: acc.failed + day.failed,
      blocked: acc.blocked + day.blocked,
      wip: acc.wip + day.wip,
      total: acc.total + day.total,
    }), { passed: 0, failed: 0, blocked: 0, wip: 0, total: 0 });
    
    return {
      tool: "Test Case Trends",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      period: {
        days,
        from: startDate.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      },
      summary: {
        totalExecutionsInPeriod: totals.total,
        passed: totals.passed,
        failed: totals.failed,
        blocked: totals.blocked,
        wip: totals.wip,
        avgExecutionsPerDay: trends.length > 0 ? Math.round(totals.total / trends.length) : 0,
      },
      dailyTrends: trends,
      insight: totals.failed > totals.passed 
        ? "⚠️ More failures than passes - investigate test stability"
        : totals.total === 0 
          ? "No test activity in this period"
          : `✅ ${Math.round((totals.passed / totals.total) * 100)}% pass rate over ${trends.length} active days`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 10: SEARCH TEST CASES
  // ═══════════════════════════════════════════════════════════════════════════

  async searchTestCases(projectId, releaseId, options = {}) {
    const { query = '', status, priority, limit = 50 } = options;
    
    // Get test cases
    const params = {
      projectId: projectId,
      releaseId: releaseId,
      offset: 0,
      maxRecords: 500,
    };
    
    if (query) params.word = query;
    
    let testcases = [];
    try {
      const tcData = await this.GET("/testcase/tree", params);
      testcases = tcData.results || tcData || [];
      
      // Flatten tree structure if needed
      if (!Array.isArray(testcases)) {
        testcases = this.flattenTestcaseTree(tcData);
      }
    } catch (e) {
      // Try alternative endpoint
      try {
        const tcData = await this.GET("/testcase", params);
        testcases = tcData.results || tcData || [];
      } catch (e2) {
        return {
          tool: "Search Test Cases",
          projectId,
          releaseId,
          error: "Unable to fetch test cases",
          results: [],
        };
      }
    }
    
    // Filter results
    let filtered = testcases;
    
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(tc => 
        (tc.name || '').toLowerCase().includes(q) ||
        (tc.testcaseKey || tc.alternateId || '').toLowerCase().includes(q) ||
        (tc.description || '').toLowerCase().includes(q)
      );
    }
    
    if (status) {
      filtered = filtered.filter(tc => 
        (tc.status || '').toLowerCase() === status.toLowerCase()
      );
    }
    
    if (priority) {
      filtered = filtered.filter(tc => 
        (tc.priority || '').toLowerCase() === priority.toLowerCase()
      );
    }
    
    // Map to clean output
    const results = filtered.slice(0, limit).map(tc => ({
      id: tc.id,
      key: tc.testcaseKey || tc.alternateId,
      name: tc.name,
      status: tc.status,
      priority: tc.priority,
      automated: tc.automated || tc.isAutomated || false,
      folder: tc.folderPath || tc.tcrCatalogTreeId?.name,
      estimatedTime: tc.estimatedTime,
      tags: tc.tags || [],
    }));
    
    return {
      tool: "Search Test Cases",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      query: { text: query, status, priority },
      totalMatches: filtered.length,
      returned: results.length,
      results,
    };
  }

  flattenTestcaseTree(node, results = []) {
    if (node.testcase) results.push(node.testcase);
    if (node.testcases) results.push(...node.testcases);
    if (node.children) {
      for (const child of node.children) {
        this.flattenTestcaseTree(child, results);
      }
    }
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOOL 11: USER ACTIVITY
  // ═══════════════════════════════════════════════════════════════════════════

  async getUserActivity(projectId, releaseId, options = {}) {
    const { days = 30 } = options;
    
    // Get executions to analyze user activity
    const executionData = await this.GET("/execution", {
      releaseid: releaseId,
      offset: 0,
      pagesize: 10000,
      includeanyoneuser: true,
    });
    
    const executions = executionData.results || executionData || [];
    
    // Aggregate by user
    const userStats = {};
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    for (const exec of executions) {
      const testerName = exec.lastTestResult?.testerName || exec.testerName || "Unassigned";
      const testerId = exec.testerId || exec.lastTestResult?.testerId;
      const executedOn = exec.lastTestResult?.executedOn || exec.executedOn;
      
      if (!userStats[testerName]) {
        userStats[testerName] = {
          userId: testerId,
          name: testerName,
          assigned: 0,
          executed: 0,
          passed: 0,
          failed: 0,
          blocked: 0,
          lastActivity: null,
        };
      }
      
      userStats[testerName].assigned++;
      
      const status = exec.lastTestResult?.executionStatus || exec.status || 0;
      if (Number(status) > 0) {
        userStats[testerName].executed++;
        
        switch (Number(status)) {
          case 1: userStats[testerName].passed++; break;
          case 2: userStats[testerName].failed++; break;
          case 4: userStats[testerName].blocked++; break;
        }
        
        if (executedOn) {
          const execDate = new Date(executedOn);
          if (!userStats[testerName].lastActivity || execDate > new Date(userStats[testerName].lastActivity)) {
            userStats[testerName].lastActivity = executedOn;
          }
        }
      }
    }
    
    // Convert to array and calculate metrics
    const users = Object.values(userStats)
      .map(user => ({
        ...user,
        completionRate: user.assigned > 0 ? Math.round((user.executed / user.assigned) * 100) : 0,
        passRate: user.executed > 0 ? Math.round((user.passed / user.executed) * 100) : 0,
      }))
      .sort((a, b) => b.executed - a.executed);
    
    // Team summary
    const teamSummary = users.reduce((acc, user) => ({
      totalAssigned: acc.totalAssigned + user.assigned,
      totalExecuted: acc.totalExecuted + user.executed,
      totalPassed: acc.totalPassed + user.passed,
      totalFailed: acc.totalFailed + user.failed,
    }), { totalAssigned: 0, totalExecuted: 0, totalPassed: 0, totalFailed: 0 });
    
    return {
      tool: "User Activity",
      projectId,
      releaseId,
      timestamp: new Date().toISOString(),
      period: { days },
      teamSummary: {
        ...teamSummary,
        activeUsers: users.filter(u => u.executed > 0).length,
        totalUsers: users.length,
        teamCompletionRate: teamSummary.totalAssigned > 0 
          ? Math.round((teamSummary.totalExecuted / teamSummary.totalAssigned) * 100) 
          : 0,
        teamPassRate: teamSummary.totalExecuted > 0 
          ? Math.round((teamSummary.totalPassed / teamSummary.totalExecuted) * 100) 
          : 0,
      },
      users,
      topPerformers: users.filter(u => u.executed > 0).slice(0, 5),
    };
  }
}

// Export with both names for backward compatibility
export { QualityGates as ZephyrTools };
export default QualityGates;
