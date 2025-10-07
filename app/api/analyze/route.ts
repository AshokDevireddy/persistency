import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

// ============================================================
// PLACEHOLDER: Replace these functions with your actual analysis code
// ============================================================

interface PolicyData {
  policyNumber: string;
  holderName: string;
  premium: number;
  status: string;
  lastPaymentDate?: string;
  daysUntilLapse?: number;
  // Add more fields as needed
}

async function analyzeAmericanAmicable(fileContent: string) {
  // TODO: Replace with your American Amicable analysis logic
  const parsed = Papa.parse(fileContent, { header: true });
  const data = parsed.data as any[];

  const totalPolicies = data.length;
  const activePolicies = data.filter((row: any) => row.status?.toLowerCase() === 'active').length;
  const lapsedPolicies = totalPolicies - activePolicies;

  // Example: Find policies about to lapse (customize based on your data structure)
  const lapsingPolicies = data
    .filter((row: any) => {
      const daysUntilLapse = parseInt(row.daysUntilLapse || '999');
      return daysUntilLapse <= 30 && daysUntilLapse > 0;
    })
    .map((row: any) => ({
      policyNumber: row.policyNumber || row.PolicyNumber || 'N/A',
      holderName: row.holderName || row.PolicyHolder || 'Unknown',
      premium: parseFloat(row.premium || row.Premium || '0'),
      daysUntilLapse: parseInt(row.daysUntilLapse || '0'),
    }))
    .sort((a, b) => a.daysUntilLapse - b.daysUntilLapse);

  return {
    carrier: 'American Amicable',
    persistencyRate: (activePolicies / totalPolicies) * 100,
    totalPolicies,
    activePolicies,
    lapsedPolicies,
    lapsingPolicies,
  };
}

async function analyzeGuaranteeTrustLife(fileContent: string) {
  // TODO: Replace with your Guarantee Trust Life analysis logic
  const parsed = Papa.parse(fileContent, { header: true });
  const data = parsed.data as any[];

  const totalPolicies = data.length;
  const activePolicies = data.filter((row: any) => row.status?.toLowerCase() === 'active').length;
  const lapsedPolicies = totalPolicies - activePolicies;

  // Example: Find policies about to lapse (customize based on your data structure)
  const lapsingPolicies = data
    .filter((row: any) => {
      const daysUntilLapse = parseInt(row.daysUntilLapse || '999');
      return daysUntilLapse <= 30 && daysUntilLapse > 0;
    })
    .map((row: any) => ({
      policyNumber: row.policyNumber || row.PolicyNumber || 'N/A',
      holderName: row.holderName || row.PolicyHolder || 'Unknown',
      premium: parseFloat(row.premium || row.Premium || '0'),
      daysUntilLapse: parseInt(row.daysUntilLapse || '0'),
    }))
    .sort((a, b) => a.daysUntilLapse - b.daysUntilLapse);

  return {
    carrier: 'Guarantee Trust Life',
    persistencyRate: (activePolicies / totalPolicies) * 100,
    totalPolicies,
    activePolicies,
    lapsedPolicies,
    lapsingPolicies,
  };
}

async function analyzeCombined(fileContent: string) {
  // TODO: Replace with your Combined analysis logic
  const parsed = Papa.parse(fileContent, { header: true });
  const data = parsed.data as any[];

  const totalPolicies = data.length;
  const activePolicies = data.filter((row: any) => row.status?.toLowerCase() === 'active').length;
  const lapsedPolicies = totalPolicies - activePolicies;

  // Example: Find policies about to lapse (customize based on your data structure)
  const lapsingPolicies = data
    .filter((row: any) => {
      const daysUntilLapse = parseInt(row.daysUntilLapse || '999');
      return daysUntilLapse <= 30 && daysUntilLapse > 0;
    })
    .map((row: any) => ({
      policyNumber: row.policyNumber || row.PolicyNumber || 'N/A',
      holderName: row.holderName || row.PolicyHolder || 'Unknown',
      premium: parseFloat(row.premium || row.Premium || '0'),
      daysUntilLapse: parseInt(row.daysUntilLapse || '0'),
    }))
    .sort((a, b) => a.daysUntilLapse - b.daysUntilLapse);

  return {
    carrier: 'Combined',
    persistencyRate: (activePolicies / totalPolicies) * 100,
    totalPolicies,
    activePolicies,
    lapsedPolicies,
    lapsingPolicies,
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

    // Process Guarantee Trust Life
    const guaranteeTrustFile = formData.get('guarantee-trust-life') as File | null;
    if (guaranteeTrustFile) {
      const content = await guaranteeTrustFile.text();
      const result = await analyzeGuaranteeTrustLife(content);
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

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze files. Please check file format.' },
      { status: 500 }
    );
  }
}

