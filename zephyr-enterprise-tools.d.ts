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

export interface TestPlanOptions {
  /** Optional Zephyr ZQL expression, e.g. `priority = "P1"`. */
  query?: string;
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
  report: {
    projectName: string;
    releaseName: string;
    generatedAt: string;
    fileName: string;
  };
  overallStatus: GateStatus;
  summary: { passed: number; failed: number; conditional: number };
  details: Record<string, unknown>;
  recommendation: string;
  gates: {
    requirementCoverage: RequirementCoverageResult;
    testPlanAnalysis: TestPlanResult;
    testExecution: TestExecutionResult;
    defectQuality: DefectQualityResult;
  };
}

export interface GateComparison {
  metric: string;
  releaseA: { status: GateStatus; value: number };
  releaseB: { status: GateStatus; value: number };
  delta: number;
  statusChanged: boolean;
  trend: 'improved' | 'regressed' | 'unchanged';
}

export interface CompareReleasesResult {
  projectId: number;
  timestamp: string;
  query?: string;
  releaseA: { releaseId: number; projectName: string; releaseName: string; generatedAt: string; fileName: string; overallStatus: GateStatus };
  releaseB: { releaseId: number; projectName: string; releaseName: string; generatedAt: string; fileName: string; overallStatus: GateStatus };
  overallStatusChanged: boolean;
  gates: {
    requirementCoverage: GateComparison;
    testPlanAnalysis: GateComparison;
    testExecution: GateComparison;
    defectQuality: GateComparison;
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
  /** Zephyr ZQL expression, e.g. `priority = "P1"`. */
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

export interface UserActivityTrendSummary {
  mostActiveUser: { userId: number; name: string; executed: number } | null;
  leastActiveUser: { userId: number; name: string; executed: number } | null;
  avgCompletionRate: number;
  teamVelocityTrend: 'increasing' | 'decreasing' | 'steady' | 'insufficient data';
  velocity: { firstHalfAvgPerDay: number; secondHalfAvgPerDay: number; changePct: number } | null;
}

export interface UserActivityResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  period: { days: number };
  teamSummary: Record<string, unknown>;
  trendSummary: UserActivityTrendSummary;
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

export interface ListUsersOptions {
  pageSize?: number;
}

export interface ExecutionChartOptions {
  startDate?: string | null;
  endDate?: string | null;
}

export interface ExecutionBurnupDay {
  date: string;
  executedToday: number;
  cumulativeExecuted: number;
  remaining: number;
  completionPct: number;
  ideal: number;
  scope: number;
}

export interface ExecutionBurnupResult {
  tool: string;
  projectId: number;
  releaseId: number;
  timestamp: string;
  dateRange?: { from: string; to: string };
  total: number;
  totalPlanned: number;
  summary?: Record<string, unknown>;
  message?: string;
  dailyBurnup: ExecutionBurnupDay[];
}

export interface ZephyrUser {
  id: number;
  fullName: string;
  userName: string;
  email: string;
  title?: string;
  location?: string;
  accountEnabled: boolean;
  roles: number[];
}

export interface ListUsersResult {
  tool: string;
  projectId: number;
  timestamp: string;
  total: number;
  returned: number;
  note?: string;
  users: ZephyrUser[];
}

export interface ExecutionStatusBreakdown {
  statusCode: number;
  label: string;
  count: number;
}

export interface ExecutionStatusCounts {
  total: number;
  breakdown: ExecutionStatusBreakdown[];
}

export interface CyclePhase {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  executionStatusCounts: ExecutionStatusCounts | null;
}

export interface ZephyrCycle {
  id: number;
  name: string;
  environment?: string;
  build?: string;
  startDate: string;
  endDate: string;
  status: number;
  executionStatusCounts: ExecutionStatusCounts | null;
  phases: CyclePhase[];
}

export interface ListCyclesResult {
  tool: string;
  releaseId: number;
  timestamp: string;
  total: number;
  cycles: ZephyrCycle[];
}

export interface CyclePhaseDetail extends CyclePhase {
  freeForm?: boolean;
  resetExecution?: boolean;
  hasChild?: boolean;
}

export interface GetCycleResult {
  tool: string;
  cycleId: number;
  timestamp: string;
  id: number;
  name: string;
  environment?: string;
  build?: string;
  startDate: string;
  endDate: string;
  status: number;
  releaseId: number;
  hasChild?: boolean;
  executionStatusCounts: ExecutionStatusCounts | null;
  phases: CyclePhaseDetail[];
}

export declare class QualityGates {
  constructor(config: ZephyrConfig);

  // Quality Gates (Release Readiness)
  requirementCoverageGate(projectId: number, releaseId: number): Promise<RequirementCoverageResult>;
  testPlanAnalysisGate(projectId: number, releaseId: number, options?: TestPlanOptions): Promise<TestPlanResult>;
  testExecutionGate(projectId: number, releaseId: number): Promise<TestExecutionResult>;
  defectQualityGate(projectId: number, releaseId: number): Promise<DefectQualityResult>;
  runAllGates(projectId: number, releaseId: number, options?: TestPlanOptions): Promise<ReleaseReadinessResult>;
  compareReleases(projectId: number, releaseId1: number, releaseId2: number, options?: TestPlanOptions): Promise<CompareReleasesResult>;

  // Analytics & Insights
  getProjectHealth(projectId: number, releaseId: number): Promise<ProjectHealthResult>;
  getTestCoverage(projectId: number, releaseId: number): Promise<TestCoverageResult>;
  getFailedTests(projectId: number, releaseId: number, options?: FailedTestsOptions): Promise<FailedTestsResult>;
  getRequirementCoverage(projectId: number, releaseId: number): Promise<RequirementCoverageDetailResult>;
  getTestCaseTrends(projectId: number, releaseId: number, options?: TrendsOptions): Promise<TestTrendsResult>;
  searchTestCases(projectId: number, releaseId: number, options?: SearchTestCasesOptions): Promise<SearchTestCasesResult>;
  getUserActivity(projectId: number, releaseId: number, options?: UserActivityOptions): Promise<UserActivityResult>;
  getExecutionBurndown(projectId: number, releaseId: number, options?: ExecutionChartOptions): Promise<Record<string, unknown>>;
  getExecutionBurnup(projectId: number, releaseId: number, options?: ExecutionChartOptions): Promise<ExecutionBurnupResult>;
  listUsers(projectId: number, options?: ListUsersOptions): Promise<ListUsersResult>;
  listCycles(releaseId: number): Promise<ListCyclesResult>;
  getCycle(cycleId: number): Promise<GetCycleResult>;
}

export declare const THRESHOLDS: ThresholdConfig;
export declare const RESOLVED_STATUSES: string[];
export declare const BLOCKER_PRIORITIES: string[];
export declare const HIGH_RISK_PRIORITIES: string[];
export declare const LOW_RISK_PRIORITIES: string[];

/** Alias for QualityGates — kept for backward compatibility */
export { QualityGates as ZephyrTools };
export default QualityGates;
