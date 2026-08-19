#!/usr/bin/env node

/**
 * Zephyr Enterprise MCP Server
 * 
 * Model Context Protocol server for Zephyr Enterprise Tools.
 * Exposes all tools with projectId and releaseId as runtime parameters.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import QualityGates from './zephyr-enterprise-tools.js';

// ─── Tool Definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'release_readiness',
    description: 'Run all 4 quality gates to assess release readiness. Returns GO, CONDITIONAL GO, or NO GO status.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'requirement_coverage',
    description: 'Check if requirements are covered by test cases. Threshold: ≥70% = GO.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'test_plan_analysis',
    description: 'Analyze test planning status. Threshold: <80% = NO GO, 80-90% = CONDITIONAL, ≥90% = GO.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'test_execution',
    description: 'Check test execution progress. Threshold: <90% = NO GO, 90-97% = CONDITIONAL, ≥97% = GO.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'defect_quality',
    description: 'Analyze defect status. Threshold: Blocker >0 = NO GO, High-risk >10 = NO GO.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'project_health',
    description: 'Get overall project health score (0-100) with metrics, team info, releases, and recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'test_coverage',
    description: 'Get detailed test coverage analysis including requirements and test case coverage.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'failed_tests',
    description: 'List and analyze failed test cases with details.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
        limit: { type: 'number', description: 'Maximum number of failed tests to return (default: 50)' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'requirement_coverage_details',
    description: 'Get requirements with and without test coverage.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'test_trends',
    description: 'Get test execution trends over time (daily breakdown).',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
        days: { type: 'number', description: 'Number of days to analyze (default: 30)' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'search_test_cases',
    description: 'Search test cases by query string.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
        query: { type: 'string', description: 'Search query string' },
        limit: { type: 'number', description: 'Maximum results (default: 50)' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'user_activity',
    description: 'Get user activity and productivity metrics showing who is assigned and who executed tests.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
        days: { type: 'number', description: 'Number of days to analyze (default: 30)' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'execution_burndown',
    description: 'Generate a day-by-day execution burndown chart for a release. Returns daily remaining vs ideal counts so an AI or chart tool can visualise test execution progress over time.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
        releaseId: { type: 'number', description: 'Zephyr release ID' },
        startDate: { type: 'string', description: 'Burndown start date YYYY-MM-DD (default: earliest execution date)' },
        endDate:   { type: 'string', description: 'Burndown end date YYYY-MM-DD (default: today)' },
      },
      required: ['projectId', 'releaseId'],
    },
  },
  {
    name: 'user_trend',
    description: 'Get full audit log activity for a user — every action they performed across the system. Filter by date range and optionally by entity type (project or release).',
    inputSchema: {
      type: 'object',
      properties: {
        userName:  { type: 'string', description: 'Username to look up (e.g. "dylan.garcia")' },
        fromDate:  { type: 'string', description: 'Start date YYYY-MM-DD (e.g. "2026-08-01")' },
        toDate:    { type: 'string', description: 'End date YYYY-MM-DD (e.g. "2026-08-18")' },
        entity:    { type: 'string', description: 'Filter by entity type: "project", "release", or "" for all', enum: ['project', 'release', ''] },
        operation: { type: 'string', description: 'Filter by operation (e.g. "CREATE", "UPDATE"). Omit for all.' },
        offset:    { type: 'number', description: 'Pagination offset (default 0)' },
        pageSize:  { type: 'number', description: 'Records per page (default 25)' },
      },
      required: ['userName'],
    },
  },
  {
    name: 'list_projects',
    description: 'List all available Zephyr projects.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_releases',
    description: 'List all releases for a project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'number', description: 'Zephyr project ID' },
      },
      required: ['projectId'],
    },
  },
];

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'zephyr-enterprise-tools',
    version: '1.0.6',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create QualityGates instance
let tools;
try {
  tools = new QualityGates({
    baseUrl: process.env.ZEPHYR_BASE_URL,
    token: process.env.ZEPHYR_TOKEN,
  });
} catch (err) {
  console.error(`Configuration error: ${err.message}`);
  process.exit(1);
}

// ─── List Tools Handler ───────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// ─── Call Tool Handler ────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    const projectId = args.projectId;
    const releaseId = args.releaseId;
    
    switch (name) {
      case 'release_readiness':
        result = await tools.runAllGates(projectId, releaseId);
        break;
        
      case 'requirement_coverage':
        result = await tools.requirementCoverageGate(projectId, releaseId);
        break;
        
      case 'test_plan_analysis':
        result = await tools.testPlanAnalysisGate(projectId, releaseId);
        break;
        
      case 'test_execution':
        result = await tools.testExecutionGate(projectId, releaseId);
        break;
        
      case 'defect_quality':
        result = await tools.defectQualityGate(projectId, releaseId);
        break;
        
      case 'project_health':
        result = await tools.getProjectHealth(projectId, releaseId);
        break;
        
      case 'test_coverage':
        result = await tools.getTestCoverage(projectId, releaseId);
        break;
        
      case 'failed_tests':
        result = await tools.getFailedTests(projectId, releaseId, { limit: args.limit || 50 });
        break;
        
      case 'requirement_coverage_details':
        result = await tools.getRequirementCoverage(projectId, releaseId);
        break;
        
      case 'test_trends':
        result = await tools.getTestCaseTrends(projectId, releaseId, { days: args.days || 30 });
        break;
        
      case 'search_test_cases':
        result = await tools.searchTestCases(projectId, releaseId, { 
          query: args.query || '', 
          limit: args.limit || 50 
        });
        break;
        
      case 'user_activity':
        result = await tools.getUserActivity(projectId, releaseId, { days: args.days || 30 });
        break;

      case 'execution_burndown':
        result = await tools.getExecutionBurndown(projectId, releaseId, {
          startDate: args.startDate || null,
          endDate:   args.endDate   || null,
        });
        break;

      case 'user_trend':
        result = await tools.getUserTrend({
          userName:  args.userName,
          fromDate:  args.fromDate  || null,
          toDate:    args.toDate    || null,
          entity:    args.entity    || '',
          operation: args.operation || null,
          offset:    args.offset    || 0,
          pageSize:  args.pageSize  || 25,
        });
        break;
        
      case 'list_projects':
        const projects = await tools.GET('/project');
        result = {
          total: projects.length,
          projects: projects.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            startDate: p.projectStartDate,
            endDate: p.projectEndDate,
          })),
        };
        break;
        
      case 'list_releases':
        const releases = await tools.GET('/release', { projectid: projectId, isaliasallowed: false });
        const filtered = releases.filter(r => !r.projectRelease);
        result = {
          projectId,
          total: filtered.length,
          releases: filtered.map(r => ({
            id: r.id,
            name: r.name,
            startDate: r.releaseStartDate,
            endDate: r.releaseEndDate,
          })),
        };
        break;
        
      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
    
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
    
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Zephyr Enterprise MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
