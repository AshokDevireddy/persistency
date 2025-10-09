import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

interface AmericanHomeLifePolicyData {
  policy_number: string;
  status: string;
  ISSUEDATE: string;
  STATUSCATEGORY: string;
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
      percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
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
      percentage: total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
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

function extractLapsePoliciesFromAMAM(policies: AMAMPolicyData[]): any[] {
  return policies
    .filter(p => {
      const status = p.Status;
      return ['Act-Pastdue', 'IssNotPaid', 'Pending', 'NeedReqmnt'].includes(status);
    })
    .map(p => ({
      id: p.Policy || `${p.FirstName}-${p.LastName}-${Math.random()}`,
      carrier: 'American Amicable',
      insuredFirstName: p.FirstName || '',
      insuredLastName: p.LastName || '',
      phone: p.Phone || null,
      statuses: [p.Status],
      daysToLapse: null
    }));
}

function extractLapsePoliciesFromCombined(policies: CombinedPolicyData[]): any[] {
  return policies
    .filter(p => p.status === 'Lapse-Pending')
    .map(p => ({
      id: p.policy_number || `combined-${Math.random()}`,
      carrier: 'Combined',
      insuredFirstName: p.first_name || '',
      insuredLastName: p.last_name || '',
      phone: (p as any).phone || null,
      statuses: ['Lapse-Pending'],
      daysToLapse: null
    }));
}

// ============================================================
// American Home Life Analysis Functions
// ============================================================

function parseAmericanHomeLifeCSV(fileContent: string): AmericanHomeLifePolicyData[] {
  // Split content into lines
  const lines = fileContent.split('\n');
  
  // Skip the first line (header) and use the second line as the actual header
  const actualHeader = lines[1];
  const dataLines = lines.slice(2); // Skip both first and second lines
  
  // Create CSV content with the correct header
  const correctedContent = actualHeader + '\n' + dataLines.join('\n');
  
  const parsed = Papa.parse(correctedContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data as AmericanHomeLifePolicyData[];
}

function parseAmericanHomeLifeDate(dateStr: string): Date {
  // Handle undefined, null, or empty strings
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  
  // Try different date formats that might be in Excel
  const trimmedDate = dateStr.trim();
  
  // Try YYYY-MM-DD format first
  if (trimmedDate.includes('-')) {
    const parts = trimmedDate.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  // Try MM/DD/YYYY format
  if (trimmedDate.includes('/')) {
    const parts = trimmedDate.split('/');
    if (parts.length === 3) {
      const [month, day, year] = parts.map(Number);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day);
      }
    }
  }
  
  // Try to parse as a date directly
  const parsedDate = new Date(trimmedDate);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  
  throw new Error(`Unable to parse date: ${dateStr}`);
}

function analyzeAmericanHomeLifePolicies(policies: AmericanHomeLifePolicyData[]) {
  console.log('📊 Starting American Home Life policy analysis...');
  console.log(`📈 Total AHL policies loaded: ${policies.length}`);
  
  // Debug: Log the first policy to see what fields are available
  if (policies.length > 0) {
    console.log('🔍 First policy fields:', Object.keys(policies[0]));
    console.log('🔍 First policy sample:', policies[0]);
  }
  
  const timeRanges = {
    '3': { positiveCount: 0, negativeCount: 0, positivePercentage: 0, negativePercentage: 0 },
    '6': { positiveCount: 0, negativeCount: 0, positivePercentage: 0, negativePercentage: 0 },
    '9': { positiveCount: 0, negativeCount: 0, positivePercentage: 0, negativePercentage: 0 },
    'All': { positiveCount: 0, negativeCount: 0, positivePercentage: 0, negativePercentage: 0 }
  };

  const statusBreakdowns = {
    '3': {} as StatusBreakdown,
    '6': {} as StatusBreakdown,
    '9': {} as StatusBreakdown,
    'All': {} as StatusBreakdown
  };

  const currentDate = new Date();
  let processedCount = 0;
  let skippedCount = 0;
  
  policies.forEach((policy, index) => {
    try {
      // Determine persistency impact based on STATUSCATEGORY first
      const statusCategory = policy.STATUSCATEGORY?.trim();
      let persistencyImpact: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      switch (statusCategory) {
        case 'Active':
          persistencyImpact = 'positive';
          break;
        case 'Withdrawn':
        case 'Lapsed':
        case 'Terminated':
        case 'Closed':
          persistencyImpact = 'negative';
          break;
        case 'Decline':
        case 'Issued Not In Force':
        case 'Pending':
        case 'Not Taken':
        case 'LM App Decline':
          persistencyImpact = 'neutral';
          break;
        default:
          persistencyImpact = 'neutral';
      }
      
      // Log cases where policy impacts persistency but ISSUEDATE is blank/invalid
      if (persistencyImpact !== 'neutral' && (!policy.ISSUEDATE || policy.ISSUEDATE.trim() === '')) {
        console.log(`🚨 DATA QUALITY ISSUE - Policy ${index}: STATUSCATEGORY="${statusCategory}" impacts persistency but ISSUEDATE is blank/invalid:`, {
          policyIndex: index,
          statusCategory: statusCategory,
          issueDate: policy.ISSUEDATE,
          persistencyImpact: persistencyImpact,
          policyData: policy
        });
      }
      
      // Check if ISSUEDATE exists and is valid
      if (!policy.ISSUEDATE || typeof policy.ISSUEDATE !== 'string') {
        console.log(`⚠️ Skipping policy ${index}: missing or invalid ISSUEDATE`);
        skippedCount++;
        return;
      }
      
      const issueDate = parseAmericanHomeLifeDate(policy.ISSUEDATE);
      const monthsSinceIssue = Math.floor(
        (currentDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
    
      const isPositive = persistencyImpact === 'positive';
      const isNegative = persistencyImpact === 'negative';

    // Update time ranges - only count policies with persistency impact
    Object.keys(timeRanges).forEach(range => {
      const rangeMonths = range === 'All' ? Infinity : parseInt(range);
      if (monthsSinceIssue <= rangeMonths) {
        // Count persistency impact for time ranges
        if (persistencyImpact !== 'neutral') {
          if (isPositive) {
            timeRanges[range as keyof typeof timeRanges].positiveCount++;
          } else if (isNegative) {
            timeRanges[range as keyof typeof timeRanges].negativeCount++;
          }
        }

        // Update status breakdown using STATUSCATEGORY - include ALL statuses
        const status = statusCategory;
        if (!statusBreakdowns[range as keyof typeof statusBreakdowns][status]) {
          statusBreakdowns[range as keyof typeof statusBreakdowns][status] = { count: 0, percentage: 0 };
        }
        statusBreakdowns[range as keyof typeof statusBreakdowns][status].count++;
      }
    });
    
    processedCount++;
    } catch (error) {
      console.log(`⚠️ Error processing policy ${index}:`, error);
      skippedCount++;
    }
  });
  
  console.log(`✅ Processed ${processedCount} policies, skipped ${skippedCount} policies`);

  // Calculate percentages
  Object.keys(timeRanges).forEach(range => {
    const rangeData = timeRanges[range as keyof typeof timeRanges];
    const persistencyTotal = rangeData.positiveCount + rangeData.negativeCount;
    
    if (persistencyTotal > 0) {
      rangeData.positivePercentage = Math.round((rangeData.positiveCount / persistencyTotal) * 100 * 100) / 100;
      rangeData.negativePercentage = Math.round((rangeData.negativeCount / persistencyTotal) * 100 * 100) / 100;
    } else {
      // Set to 0 if no policies with persistency impact
      rangeData.positivePercentage = 0;
      rangeData.negativePercentage = 0;
    }

    // Calculate status percentages - use total count of ALL policies in this time range
    const statusData = statusBreakdowns[range as keyof typeof statusBreakdowns];
    const totalStatusCount = Object.values(statusData).reduce((sum, status) => sum + status.count, 0);
    Object.keys(statusData).forEach(status => {
      statusData[status].percentage = totalStatusCount > 0 ? Math.round((statusData[status].count / totalStatusCount) * 100 * 100) / 100 : 0;
    });
  });

  const results = {
    '3': timeRanges['3'] as AnalysisResult,
    '6': timeRanges['6'] as AnalysisResult,
    '9': timeRanges['9'] as AnalysisResult,
    'All': timeRanges['All'] as AnalysisResult
  };

  return {
    carrier: 'American Home Life',
    timeRanges: results,
    statusBreakdowns,
    totalPolicies: policies.length,
    persistencyRate: results['All'].positivePercentage
  };
}

async function analyzeAmericanHomeLife(fileContent: string) {
  const policies = parseAmericanHomeLifeCSV(fileContent);
  return analyzeAmericanHomeLifePolicies(policies);
}

function parseAmericanHomeLifeFromExcelBuffer(buffer: ArrayBuffer): AmericanHomeLifePolicyData[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Get raw rows
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  if (!rows || rows.length < 2) return [];
  const headerRow = rows[1]; // second row contains actual headers
  const dataRows = rows.slice(2);
  
  console.log('🔍 Excel header row:', headerRow);
  
  const policies: AmericanHomeLifePolicyData[] = dataRows
    .filter(r => Array.isArray(r) && r.length > 0 && r.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== ''))
    .map((row, index) => {
      const obj: any = {};
      headerRow.forEach((h: any, idx: number) => {
        if (h !== undefined && h !== null && String(h).trim() !== '') {
          const key = String(h).trim();
          const value = row[idx];
          obj[key] = value !== undefined && value !== null ? String(value) : '';
        }
      });
      
      // Debug first few rows
      if (index < 3) {
        console.log(`🔍 Excel row ${index}:`, obj);
      }
      
      return obj as AmericanHomeLifePolicyData;
    });
    
  console.log(`📊 Parsed ${policies.length} policies from Excel`);
  return policies;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const results = [];
    const lapsePolicies: any[] = [];

    // Process American Amicable
    const americanAmicableFile = formData.get('american-amicable') as File | null;
    if (americanAmicableFile) {
      const content = await americanAmicableFile.text();
      const policies = parseAMAMCSV(content);
      const result = await analyzeAmericanAmicable(content);
      results.push(result);

      // Extract lapse policies
      const amamLapsePolicies = extractLapsePoliciesFromAMAM(policies);
      lapsePolicies.push(...amamLapsePolicies);
    }

    // Process Combined
    const combinedFile = formData.get('combined') as File | null;
    if (combinedFile) {
      const content = await combinedFile.text();
      const policies = parseCombinedCSV(content);
      const result = await analyzeCombined(content);
      results.push(result);

      // Extract lapse policies
      const combinedLapsePolicies = extractLapsePoliciesFromCombined(policies);
      lapsePolicies.push(...combinedLapsePolicies);
    }

    // Process American Home Life
    const americanHomeLifeFile = formData.get('american-home-life') as File | null;
    if (americanHomeLifeFile) {
      const fileName = americanHomeLifeFile.name?.toLowerCase() || '';
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const arrayBuffer = await americanHomeLifeFile.arrayBuffer();
        const policies = parseAmericanHomeLifeFromExcelBuffer(arrayBuffer);
        const result = analyzeAmericanHomeLifePolicies(policies);
        results.push(result);
      } else {
        const content = await americanHomeLifeFile.text();
        const policies = parseAmericanHomeLifeCSV(content);
        const result = analyzeAmericanHomeLife(content);
        results.push(result);
      }

      // Note: No lapse policy extraction for American Home Life as per requirements
    }

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log('✅ Analysis complete:', results);
    console.log('📋 Lapse policies found:', lapsePolicies.length);

    return NextResponse.json({ results, lapsePolicies });
  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json(
      { error: `Failed to analyze files: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

