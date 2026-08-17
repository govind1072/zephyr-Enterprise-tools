/**
 * Zephyr Enterprise Tools - TypeScript Declarations
 */

export interface ZephyrConfig {
  baseUrl?: string;
  token?: string;
}

export interface ThresholdConfig {
  requirementCoverage: { go: number; description: string };
  testPlanAnalysis: { noGo: number; conditionalGo: number; description: string };
  testExecution: { noGo: number; conditionalGo: number; description: string };
  defectQuality: { blockerLimit: number; highRiskLimit: number; description: string };
}

export type GateStatus = "GO" | "CONDITIONAL GO" | "NO GO";
export type HealthStatus = "HEALTHY" | "MODERATE" | "AT RISK" | "CRITICAL";

export interface GateResult {
  gate: string;
  status: GateStatus;
  statusMessage: string;
  [key: string]: unknown;
}

export interface RequirementCoverageResult extends GateResult {
  coveragePercentage: number;
  coveredRequirements: number;
  notCoveredRequirements: number;
  totalRequirements: number;
}

export interface TestPlanResult extends GateResult {
  overallPlanningPercentage: number;
  totalTests: number;
  plannedTests: number;
  assignedTests: number;
}

export interface TestExecutionResult extends GateResult {
  executionPercentage: number;
  completedTests: number;
  totalPlannedTests: number;
  breakdown: {
    passed: number;
    failed: number;
    blocked: number;
    wip: number;
    notExecuted: number;
  };
}

export interface DefectQualityResult extends GateResult {
  totalDefects: number;
  breakdown: {
    blocker: { count: number; defects: unknown[] };
    highRisk: { count: number; defects: unknown[] };
    lowRisk: { count: number; defects: unknown[] };
    resolved: { count: number };
  };
}

export interface ReleaseReadinessResult {
  projectId: number;
  releaseId: number;
  timestamp: string;
  overallStatus: GateStatus;
  summary: { passed: number; failed: number; conditional: number };
  recommendation: string;
  gates: {
    requirementCoverage: RequirementCoverageResult;
    testPlanAnalysis: TestPlanResult;
    testExecution: TestExecutionResult;
    defectQuality: DefectQualityResult;
  };
}

export interface ProjectHealthResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  healthScore: number;
  healthStatus: HealthStatus;
  summary: Record<string, unknown>;
  metrics: Record<string, Record<string, unknown>>;
  recommendations: string[];
}

export interface TestCoverageResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  summary: Record<string, unknown>;
  [key: string]: unknown;
}

export interface FailedTest {
  testcaseId: number;
  testcaseKey: string;
  testcaseName: string;
  executedBy?: string;
  [key: string]: unknown;
}

export interface FailedTestsResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  failedTests: FailedTest[];
  total: number;
}

export interface RequirementCoverageDetailResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  results: unknown[];
  [key: string]: unknown;
}

export interface TestTrendsResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  dailyTrends: Array<{ date: string; total: number; passed: number; failed: number; blocked: number }>;
  [key: string]: unknown;
}

export interface SearchTestCasesOptions {
  query?: string;
  limit?: number;
}

export interface SearchTestCasesResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  results: Array<{ id: number; key: string; name: string; status?: string }>;
  totalMatches: number;
  returned: number;
}

export interface UserActivityOptions {
  days?: number;
}

export interface UserActivityResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  period: { days: number };
  teamSummary: Record<string, unknown>;
  assignedTo: unknown[];
  executedBy: unknown[];
  topExecutors: unknown[];
}

export interface FailedTestsOptions {
  limit?: number;
}

export interface TrendsOptions {
  days?: number;
}

export declare class QualityGates {
  constructor(config: ZephyrConfig);

  // Quality Gates (Release Readiness)
  requirementCoverageGate(projectId: number, releaseId: number): Promise<RequirementCoverageResult>;
  testPlanAnalysisGate(projectId: number, releaseId: number): Promise<TestPlanResult>;
  testExecutionGate(projectId: number, releaseId: number): Promise<TestExecutionResult>;
  defectQualityGate(projectId: number, releaseId: number): Promise<DefectQualityResult>;
  runAllGates(projectId: number, releaseId: number): Promise<ReleaseReadinessResult>;

  // Analytics & Insights
  getProjectHealth(projectId: number, releaseId: number): Promise<ProjectHealthResult>;
  getTestCoverage(projectId: number, releaseId: number): Promise<TestCoverageResult>;
  getFailedTests(projectId: number, releaseId: number, options?: FailedTestsOptions): Promise<FailedTestsResult>;
  getRequirementCoverage(projectId: number, releaseId: number): Promise<RequirementCoverageDetailResult>;
  getTestCaseTrends(projectId: number, releaseId: number, options?: TrendsOptions): Promise<TestTrendsResult>;
  searchTestCases(projectId: number, releaseId: number, options?: SearchTestCasesOptions): Promise<SearchTestCasesResult>;
  getUserActivity(projectId: number, releaseId: number, options?: UserActivityOptions): Promise<UserActivityResult>;
}

export declare const THRESHOLDS: ThresholdConfig;
export declare const RESOLVED_STATUSES: string[];
export declare const BLOCKER_PRIORITIES: string[];
export declare const HIGH_RISK_PRIORITIES: string[];
export declare const LOW_RISK_PRIORITIES: string[];

/** Alias for QualityGates — kept for backward compatibility */
export { QualityGates as ZephyrTools };
export default QualityGates;
