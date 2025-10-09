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

interface AflacPolicy {
  COMPANYCODE?: string;
  POLICYNUMBER: string;
  STATUSCATEGORY?: string;
  STATUSDISPLAYTEXT?: string;
  PRODUCT?: string;
  APPRECDDATE?: string;
  APPSIGNATUREDATE?: string;
  ORIGEFFDATE?: string;
  PAIDTODATE?: string;
  ISSUEDATE?: string;
  TERMDATE?: string;
  FIRSTNAME?: string;
  LASTNAME?: string;
  PHONE1?: string;
  [key: string]: any;
}

interface AetnaPolicy {
  COMPANYCODE?: string;
  POLICYNUMBER: string;
  STATUSCATEGORY?: string;
  STATUSDISPLAYTEXT?: string;
  PRODUCT?: string;
  APPRECDDATE?: string;
  APPSIGNATUREDATE?: string;
  ORIGEFFDATE?: string;
  PAIDTODATE?: string;
  ISSUEDATE?: string;
  TERMDATE?: string;
  FIRSTNAME?: string;
  LASTNAME?: string;
  PHONE1?: string;
  [key: string]: any;
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
// Aflac Analysis Functions
// ============================================================

async function parseAflacXLSX(file: File): Promise<AflacPolicy[]> {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('policy')) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      defval: null,
    });

    if (!rows.length) return [];
    const headerRowIdx = 1; // header is on row 2 (0-indexed row 1)
    const headers = rows[headerRowIdx].map((h: any) => String(h ?? '').trim());
    const dataRows = rows.slice(headerRowIdx + 1);
    const out: AflacPolicy[] = [];

    for (const r of dataRows) {
      if (!r || r.every((x: any) => x == null || x === '')) continue;
      const obj: any = {};
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i] || `COL_${i}`;
        obj[key] = r[i];
      }
      if (Object.values(obj).some((v) => v != null && String(v).trim() !== ''))
        out.push(obj);
    }
    return out;
  }

  // Fallback for CSV
  const txt = await file.text();
  const parsed = Papa.parse(txt, { header: true, skipEmptyLines: true });
  return (parsed.data as any[]).map((r) => {
    const obj: any = {};
    Object.keys(r).forEach((k) => (obj[String(k).trim()] = r[k]));
    return obj as AflacPolicy;
  });
}

function parseAflacDate(d?: string | number | null): Date | null {
  if (!d && d !== 0) return null;
  const s = String(d).trim();
  if (!s) return null;

  // Excel serial number
  if (!isNaN(Number(s)) && Number(s) > 59) {
    const base = new Date(Date.UTC(1899, 11, 30));
    const millis = Number(s) * 86400000;
    return new Date(base.getTime() + millis);
  }

  const t = Date.parse(s);
  return isFinite(t) ? new Date(t) : null;
}

function aflacMonthsDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function classifyAflacPolicy(policy: AflacPolicy): 'positive' | 'negative' {
  const cat = (policy.STATUSCATEGORY || '').trim();
  const disp = (policy.STATUSDISPLAYTEXT || '').toLowerCase();

  // Death exception
  if (disp.includes('death')) {
    const orig = parseAflacDate(policy.ORIGEFFDATE);
    const term = parseAflacDate(policy.TERMDATE);
    if (orig && term && aflacMonthsDiff(orig, term) > 24) return 'positive';
    return 'negative';
  }

  if (cat === 'Active') return 'positive';
  return 'negative';
}

function filterAflacPoliciesByTimeRange(policies: AflacPolicy[], monthsBack: number): AflacPolicy[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());

  return policies.filter((p) => {
    const eff = parseAflacDate(p.ORIGEFFDATE);
    return eff != null && eff >= cutoffDate;
  });
}

function analyzeAflacTimeRange(policies: AflacPolicy[]): AnalysisResult {
  let positiveCount = 0;
  let negativeCount = 0;

  policies.forEach(policy => {
    const classification = classifyAflacPolicy(policy);
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

function getAflacStatusBreakdown(policies: AflacPolicy[]): StatusBreakdown {
  const statusCounts: { [key: string]: number } = {};
  const total = policies.length;

  policies.forEach(policy => {
    const status = (policy.STATUSCATEGORY || 'UNKNOWN').trim();
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

async function analyzeAflac(file: File) {
  console.log('📊 Starting Aflac policy analysis...');

  const policies = await parseAflacXLSX(file);
  console.log(`📈 Total Aflac policies loaded: ${policies.length}`);

  const results: TimeRangeAnalysis = {};
  const statusBreakdowns: { [key: string]: StatusBreakdown } = {};

  const policies3Months = filterAflacPoliciesByTimeRange(policies, 3);
  results['3'] = analyzeAflacTimeRange(policies3Months);
  statusBreakdowns['3'] = getAflacStatusBreakdown(policies3Months);

  const policies6Months = filterAflacPoliciesByTimeRange(policies, 6);
  results['6'] = analyzeAflacTimeRange(policies6Months);
  statusBreakdowns['6'] = getAflacStatusBreakdown(policies6Months);

  const policies9Months = filterAflacPoliciesByTimeRange(policies, 9);
  results['9'] = analyzeAflacTimeRange(policies9Months);
  statusBreakdowns['9'] = getAflacStatusBreakdown(policies9Months);

  results['All'] = analyzeAflacTimeRange(policies);
  statusBreakdowns['All'] = getAflacStatusBreakdown(policies);

  console.log('Aflac Analysis Results:', results);
  console.log('Aflac Status Breakdowns:', statusBreakdowns);

  return {
    carrier: 'Aflac',
    timeRanges: results,
    statusBreakdowns,
    totalPolicies: policies.length,
    persistencyRate: results['All'].positivePercentage,
    policies // Return policies for lapse extraction
  };
}

function extractLapsePoliciesFromAflac(policies: AflacPolicy[]): any[] {
  return policies
    .filter((p) => {
      const cat = (p.STATUSCATEGORY || '').trim();
      const disp = (p.STATUSDISPLAYTEXT || '').toLowerCase();
      return cat === 'Lapsed' || disp.includes('lapse') || disp.includes('requested termination');
    })
    .map((p) => ({
      id: p.POLICYNUMBER,
      carrier: 'Aflac',
      insuredFirstName: p.FIRSTNAME || '',
      insuredLastName: p.LASTNAME || '',
      phone: p.PHONE1 || null,
      statuses: [p.STATUSCATEGORY, p.STATUSDISPLAYTEXT].filter(Boolean),
      daysToLapse: null,
    }));
}

// ============================================================
// Aetna Analysis Functions
// ============================================================

async function parseAetnaXLSX(file: File): Promise<AetnaPolicy[]> {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('policy')) || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      defval: null,
    });

    if (!rows.length) return [];
    const headerRowIdx = 1; // header is on row 2 (0-indexed row 1)
    const headers = rows[headerRowIdx].map((h: any) => String(h ?? '').trim());
    const dataRows = rows.slice(headerRowIdx + 1);
    const out: AetnaPolicy[] = [];

    for (const r of dataRows) {
      if (!r || r.every((x: any) => x == null || x === '')) continue;
      const obj: any = {};
      for (let i = 0; i < headers.length; i++) {
        const key = headers[i] || `COL_${i}`;
        obj[key] = r[i];
      }
      if (Object.values(obj).some((v) => v != null && String(v).trim() !== ''))
        out.push(obj);
    }
    return out;
  }

  // Fallback for CSV
  const txt = await file.text();
  const parsed = Papa.parse(txt, { header: true, skipEmptyLines: true });
  return (parsed.data as any[]).map((r) => {
    const obj: any = {};
    Object.keys(r).forEach((k) => (obj[String(k).trim()] = r[k]));
    return obj as AetnaPolicy;
  });
}

function parseAetnaDate(d?: string | number | null): Date | null {
  if (!d && d !== 0) return null;
  const s = String(d).trim();
  if (!s) return null;

  // Excel serial number
  if (!isNaN(Number(s)) && Number(s) > 59) {
    const base = new Date(Date.UTC(1899, 11, 30));
    const millis = Number(s) * 86400000;
    return new Date(base.getTime() + millis);
  }

  const t = Date.parse(s);
  return isFinite(t) ? new Date(t) : null;
}

function aetnaMonthsDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function classifyAetnaPolicy(policy: AetnaPolicy): 'positive' | 'negative' {
  const cat = (policy.STATUSCATEGORY || '').trim();
  const disp = (policy.STATUSDISPLAYTEXT || '').toLowerCase();

  // Death exception
  if (disp.includes('death')) {
    const orig = parseAetnaDate(policy.ORIGEFFDATE);
    const term = parseAetnaDate(policy.TERMDATE);
    if (orig && term && aetnaMonthsDiff(orig, term) > 24) return 'positive';
    return 'negative';
  }

  if (cat === 'Active') return 'positive';
  return 'negative';
}

function filterAetnaPoliciesByTimeRange(policies: AetnaPolicy[], monthsBack: number): AetnaPolicy[] {
  const now = new Date();
  const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());

  return policies.filter((p) => {
    const eff = parseAetnaDate(p.ORIGEFFDATE);
    return eff != null && eff >= cutoffDate;
  });
}

function analyzeAetnaTimeRange(policies: AetnaPolicy[]): AnalysisResult {
  let positiveCount = 0;
  let negativeCount = 0;

  policies.forEach(policy => {
    const classification = classifyAetnaPolicy(policy);
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

function getAetnaStatusBreakdown(policies: AetnaPolicy[]): StatusBreakdown {
  const statusCounts: { [key: string]: number } = {};
  const total = policies.length;

  policies.forEach(policy => {
    const status = (policy.STATUSCATEGORY || 'UNKNOWN').trim();
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

async function analyzeAetna(file: File) {
  console.log('📊 Starting Aetna policy analysis...');

  const policies = await parseAetnaXLSX(file);
  console.log(`📈 Total Aetna policies loaded: ${policies.length}`);

  const results: TimeRangeAnalysis = {};
  const statusBreakdowns: { [key: string]: StatusBreakdown } = {};

  const policies3Months = filterAetnaPoliciesByTimeRange(policies, 3);
  results['3'] = analyzeAetnaTimeRange(policies3Months);
  statusBreakdowns['3'] = getAetnaStatusBreakdown(policies3Months);

  const policies6Months = filterAetnaPoliciesByTimeRange(policies, 6);
  results['6'] = analyzeAetnaTimeRange(policies6Months);
  statusBreakdowns['6'] = getAetnaStatusBreakdown(policies6Months);

  const policies9Months = filterAetnaPoliciesByTimeRange(policies, 9);
  results['9'] = analyzeAetnaTimeRange(policies9Months);
  statusBreakdowns['9'] = getAetnaStatusBreakdown(policies9Months);

  results['All'] = analyzeAetnaTimeRange(policies);
  statusBreakdowns['All'] = getAetnaStatusBreakdown(policies);

  console.log('Aetna Analysis Results:', results);
  console.log('Aetna Status Breakdowns:', statusBreakdowns);

  return {
    carrier: 'Aetna',
    timeRanges: results,
    statusBreakdowns,
    totalPolicies: policies.length,
    persistencyRate: results['All'].positivePercentage,
    policies // Return policies for lapse extraction
  };
}

function extractLapsePoliciesFromAetna(policies: AetnaPolicy[]): any[] {
  return policies
    .filter((p) => {
      const cat = (p.STATUSCATEGORY || '').trim();
      const disp = (p.STATUSDISPLAYTEXT || '').toLowerCase();
      return cat === 'Lapsed' || disp.includes('lapse') || disp.includes('requested termination');
    })
    .map((p) => ({
      id: p.POLICYNUMBER,
      carrier: 'Aetna',
      insuredFirstName: p.FIRSTNAME || '',
      insuredLastName: p.LASTNAME || '',
      phone: p.PHONE1 || null,
      statuses: [p.STATUSCATEGORY, p.STATUSDISPLAYTEXT].filter(Boolean),
      daysToLapse: null,
    }));
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const results = [];
    const lapsePolicies: any[] = [];

    // Get filtering parameters
    const filterMode = formData.get('filter_mode') as string | null;
    const writingAgentNumbersStr = formData.get('writing_agent_numbers') as string | null;
    let writingAgentNumbers: string[] = [];

    if (writingAgentNumbersStr) {
      try {
        writingAgentNumbers = JSON.parse(writingAgentNumbersStr);
      } catch (e) {
        console.error('Failed to parse writing agent numbers:', e);
      }
    }

    // Helper function to check if a policy should be included
    const shouldIncludePolicy = (agentNumber: string): boolean => {
      if (!filterMode || writingAgentNumbers.length === 0) {
        return true; // No filtering, include all
      }
      // Clean the agent number and check if it's in the filter list
      const cleanNumber = agentNumber?.replace(/[="()]/g, '').trim();
      return writingAgentNumbers.includes(cleanNumber);
    };

    // Process American Amicable
    const americanAmicableFile = formData.get('american-amicable') as File | null;
    if (americanAmicableFile) {
      const content = await americanAmicableFile.text();
      let policies = parseAMAMCSV(content);

      // Filter policies by writing agent if needed
      if (filterMode && writingAgentNumbers.length > 0) {
        policies = policies.filter(p => shouldIncludePolicy(p.WritingAgent));
      }

      const result = await analyzeAmericanAmicable(content);

      // Re-analyze with filtered data
      if (filterMode && writingAgentNumbers.length > 0) {
        const filteredResults: any = {};
        const filteredStatusBreakdowns: any = {};

        const policies3Months = filterAMAMPoliciesByTimeRange(policies, 3);
        filteredResults['3'] = analyzeAMAMTimeRange(policies3Months);
        filteredStatusBreakdowns['3'] = getAMAMStatusBreakdown(policies3Months);

        const policies6Months = filterAMAMPoliciesByTimeRange(policies, 6);
        filteredResults['6'] = analyzeAMAMTimeRange(policies6Months);
        filteredStatusBreakdowns['6'] = getAMAMStatusBreakdown(policies6Months);

        const policies9Months = filterAMAMPoliciesByTimeRange(policies, 9);
        filteredResults['9'] = analyzeAMAMTimeRange(policies9Months);
        filteredStatusBreakdowns['9'] = getAMAMStatusBreakdown(policies9Months);

        filteredResults['All'] = analyzeAMAMTimeRange(policies);
        filteredStatusBreakdowns['All'] = getAMAMStatusBreakdown(policies);

        results.push({
          carrier: 'American Amicable',
          timeRanges: filteredResults,
          statusBreakdowns: filteredStatusBreakdowns,
          totalPolicies: policies.length,
          persistencyRate: filteredResults['All'].positivePercentage
        });
      } else {
        results.push(result);
      }

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

    // Process Aflac
    const aflacFile = formData.get('aflac') as File | null;
    if (aflacFile) {
      const result = await analyzeAflac(aflacFile);
      results.push({
        carrier: result.carrier,
        timeRanges: result.timeRanges,
        statusBreakdowns: result.statusBreakdowns,
        totalPolicies: result.totalPolicies,
        persistencyRate: result.persistencyRate,
      });

      // Extract lapse policies
      const aflacLapsePolicies = extractLapsePoliciesFromAflac(result.policies);
      lapsePolicies.push(...aflacLapsePolicies);
    }

    // Process Aetna
    const aetnaFile = formData.get('aetna') as File | null;
    if (aetnaFile) {
      const result = await analyzeAetna(aetnaFile);
      results.push({
        carrier: result.carrier,
        timeRanges: result.timeRanges,
        statusBreakdowns: result.statusBreakdowns,
        totalPolicies: result.totalPolicies,
        persistencyRate: result.persistencyRate,
      });

      // Extract lapse policies
      const aetnaLapsePolicies = extractLapsePoliciesFromAetna(result.policies);
      lapsePolicies.push(...aetnaLapsePolicies);
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

