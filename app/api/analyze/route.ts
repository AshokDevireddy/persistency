import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

// ============================================================
// Type Definitions
// ============================================================

interface AMAMPolicyData {
  WritingAgent: string;
  AgentName: string;
  Company: string;
  Policy: string;
  Status: string;
  DOB: string;
  PolicyDate: string;
  PaidtoDate: string;
  RecvDate: string;
  LastName: string;
  FirstName: string;
  MI: string;
  Plan: string;
  Face: string;
  Form: string;
  Mode: string;
  ModePrem: string;
  [key: string]: string;
}

interface CombinedPolicyData {
  policy_number: string;
  status: string;
  effective_date: string;
  [key: string]: string;
}

interface AnalysisResult {
  positivePercentage: number;
  positiveCount: number;
  negativePercentage: number;
  negativeCount: number;
}

interface StatusBreakdown {
  [status: string]: {
    count: number;
    percentage: number;
  };
}

interface TimeRangeAnalysis {
  [key: string]: AnalysisResult;
}

// ============================================================
// American Amicable Analysis Functions
// ============================================================

function parseAMAMCSV(fileContent: string): AMAMPolicyData[] {
  // Pre-process the CSV content to handle the =("value") format
  const processedContent = fileContent
    .split('\n')
    .map(line => line.replace(/=\(/g, '').replace(/\)/g, ''))
    .join('\n');

  const parsed = Papa.parse(processedContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data as AMAMPolicyData[];
}

function parseAMAMDate(dateStr: string): Date {
  const [month, day, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

function monthsDifference(date1: Date, date2: Date): number {
  const yearDiff = date2.getFullYear() - date1.getFullYear();
  const monthDiff = date2.getMonth() - date1.getMonth();
  return yearDiff * 12 + monthDiff;
}

function classifyAMAMPolicy(status: string, policyDate: string, paidToDate: string): 'positive' | 'negative' {
  const positiveStatuses = ['Active', 'DeathClaim'];
  const negativeStatuses = ['Declined', 'Withdrawn', 'Incomplete', 'InfNotTaken', 'Terminated', 'NotTaken', 'RPU', 'Act-Ret Item', 'Pending', 'IssNotPaid', 'NeedReqmnt'];

  if (status === 'DeathClaim') {
    try {
      const policyDateObj = parseAMAMDate(policyDate);
      const paidToDateObj = parseAMAMDate(paidToDate);
      const monthsDiff = monthsDifference(policyDateObj, paidToDateObj);
      return monthsDiff <= 24 ? 'negative' : 'positive';
    } catch {
      return 'negative';
    }
  }

  if (positiveStatuses.includes(status)) return 'positive';
  if (negativeStatuses.includes(status)) return 'negative';
  return 'negative';
}

function filterAMAMPoliciesByTimeRange(policies: AMAMPolicyData[], monthsBack: number): AMAMPolicyData[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());

  return policies.filter(policy => {
    try {
      const policyDate = parseAMAMDate(policy.PolicyDate);
      return policyDate >= cutoffDate;
    } catch {
      return false;
    }
  });
}

function analyzeAMAMTimeRange(policies: AMAMPolicyData[]): AnalysisResult {
  let positiveCount = 0;
  let negativeCount = 0;

  policies.forEach(policy => {
    const classification = classifyAMAMPolicy(policy.Status, policy.PolicyDate, policy.PaidtoDate);
    if (classification === 'positive') {
      positiveCount++;
    } else {
      negativeCount++;
    }
  });

  const total = positiveCount + negativeCount;
  const positivePercentage = total > 0 ? (positiveCount / total) * 100 : 0;
  const negativePercentage = total > 0 ? (negativeCount / total) * 100 : 0;

  return {
    positivePercentage: Math.round(positivePercentage * 100) / 100,
    positiveCount,
    negativePercentage: Math.round(negativePercentage * 100) / 100,
    negativeCount
  };
}

function getAMAMStatusBreakdown(policies: AMAMPolicyData[]): StatusBreakdown {
  const statusCounts: { [key: string]: number } = {};
  const total = policies.length;

  policies.forEach(policy => {
    const status = policy.Status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const breakdown: StatusBreakdown = {};
  Object.entries(statusCounts).forEach(([status, count]) => {
    breakdown[status] = {
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    };
  });

  return breakdown;
}

async function analyzeAmericanAmicable(fileContent: string) {
  console.log('📊 Starting AMAM policy analysis...');

  const policies = parseAMAMCSV(fileContent);
  console.log(`📈 Total AMAM policies loaded: ${policies.length}`);

  const results: TimeRangeAnalysis = {};
  const statusBreakdowns: { [key: string]: StatusBreakdown } = {};

  const policies3Months = filterAMAMPoliciesByTimeRange(policies, 3);
  results['3'] = analyzeAMAMTimeRange(policies3Months);
  statusBreakdowns['3'] = getAMAMStatusBreakdown(policies3Months);

  const policies6Months = filterAMAMPoliciesByTimeRange(policies, 6);
  results['6'] = analyzeAMAMTimeRange(policies6Months);
  statusBreakdowns['6'] = getAMAMStatusBreakdown(policies6Months);

  const policies9Months = filterAMAMPoliciesByTimeRange(policies, 9);
  results['9'] = analyzeAMAMTimeRange(policies9Months);
  statusBreakdowns['9'] = getAMAMStatusBreakdown(policies9Months);

  results['All'] = analyzeAMAMTimeRange(policies);
  statusBreakdowns['All'] = getAMAMStatusBreakdown(policies);

  console.log('AMAM Analysis Results:', results);
  console.log('AMAM Status Breakdowns:', statusBreakdowns);

  return {
    carrier: 'American Amicable',
    timeRanges: results,
    statusBreakdowns,
    totalPolicies: policies.length,
    persistencyRate: results['All'].positivePercentage
  };
}

// ============================================================
// Combined Insurance Analysis Functions
// ============================================================

function parseCombinedCSV(fileContent: string): CombinedPolicyData[] {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data as CombinedPolicyData[];
}

function parseCombinedDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function classifyCombinedPolicy(status: string): 'positive' | 'negative' {
  const positiveStatuses = ['In-Force', 'Issued'];
  const negativeStatuses = ['Terminated', 'Lapse-Pending'];

  if (positiveStatuses.includes(status)) return 'positive';
  if (negativeStatuses.includes(status)) return 'negative';
  return 'negative';
}

function filterCombinedPoliciesByTimeRange(policies: CombinedPolicyData[], monthsBack: number): CombinedPolicyData[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());

  return policies.filter(policy => {
    try {
      const effectiveDate = parseCombinedDate(policy.effective_date);
      return effectiveDate >= cutoffDate;
    } catch {
      return false;
    }
  });
}

function analyzeCombinedTimeRange(policies: CombinedPolicyData[]): AnalysisResult {
  let positiveCount = 0;
  let negativeCount = 0;

  policies.forEach(policy => {
    const classification = classifyCombinedPolicy(policy.status);
    if (classification === 'positive') {
      positiveCount++;
    } else {
      negativeCount++;
    }
  });

  const total = positiveCount + negativeCount;
  const positivePercentage = total > 0 ? (positiveCount / total) * 100 : 0;
  const negativePercentage = total > 0 ? (negativeCount / total) * 100 : 0;

  return {
    positivePercentage: Math.round(positivePercentage * 100) / 100,
    positiveCount,
    negativePercentage: Math.round(negativePercentage * 100) / 100,
    negativeCount
  };
}

function getCombinedStatusBreakdown(policies: CombinedPolicyData[]): StatusBreakdown {
  const statusCounts: { [key: string]: number } = {};
  const total = policies.length;

  policies.forEach(policy => {
    const status = policy.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const breakdown: StatusBreakdown = {};
  Object.entries(statusCounts).forEach(([status, count]) => {
    breakdown[status] = {
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    };
  });

  return breakdown;
}

async function analyzeCombined(fileContent: string) {
  console.log('📊 Starting Combined Insurance policy analysis...');

  const policies = parseCombinedCSV(fileContent);
  console.log(`📈 Total Combined policies loaded: ${policies.length}`);

  const results: TimeRangeAnalysis = {};
  const statusBreakdowns: { [key: string]: StatusBreakdown } = {};

  const policies3Months = filterCombinedPoliciesByTimeRange(policies, 3);
  results['3'] = analyzeCombinedTimeRange(policies3Months);
  statusBreakdowns['3'] = getCombinedStatusBreakdown(policies3Months);

  const policies6Months = filterCombinedPoliciesByTimeRange(policies, 6);
  results['6'] = analyzeCombinedTimeRange(policies6Months);
  statusBreakdowns['6'] = getCombinedStatusBreakdown(policies6Months);

  const policies9Months = filterCombinedPoliciesByTimeRange(policies, 9);
  results['9'] = analyzeCombinedTimeRange(policies9Months);
  statusBreakdowns['9'] = getCombinedStatusBreakdown(policies9Months);

  results['All'] = analyzeCombinedTimeRange(policies);
  statusBreakdowns['All'] = getCombinedStatusBreakdown(policies);

  console.log('Combined Analysis Results:', results);
  console.log('Combined Status Breakdowns:', statusBreakdowns);

  return {
    carrier: 'Combined Insurance',
    timeRanges: results,
    statusBreakdowns,
    totalPolicies: policies.length,
    persistencyRate: results['All'].positivePercentage
  };
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const results = [];

    // Process American Amicable
    const americanAmicableFile = formData.get('american-amicable') as File | null;
    if (americanAmicableFile) {
      const content = await americanAmicableFile.text();
      const result = await analyzeAmericanAmicable(content);
      results.push(result);
    }

    // Process Combined
    const combinedFile = formData.get('combined') as File | null;
    if (combinedFile) {
      const content = await combinedFile.text();
      const result = await analyzeCombined(content);
      results.push(result);
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log('✅ Analysis complete:', results);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json(
      { error: `Failed to analyze files: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

