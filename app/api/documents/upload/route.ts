import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Helper to parse AMAM CSV
function parseAMAMCSV(fileContent: string) {
  const processedContent = fileContent
    .split('\n')
    .map(line => line.replace(/=\(/g, '').replace(/\)/g, ''))
    .join('\n');

  const parsed = Papa.parse(processedContent, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data as any[];
}

// Helper to parse Excel files (Aflac/Aetna)
async function parseExcel(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
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
  const out: any[] = [];

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

// Extract unique writing agents from parsed data
function extractWritingAgents(data: any[], carrier: string) {
  const uniqueAgents = new Map<string, { number: string; name: string }>();

  for (const row of data) {
    let agentNumber: string | null = null;
    let agentName: string | null = null;

    // Determine fields based on carrier
    if (carrier === 'American Amicable' || carrier === 'AMAM') {
      agentNumber = row.WritingAgent?.replace(/[="()]/g, '').trim();
      agentName = row.AgentName?.trim();
    } else if (carrier === 'Aflac') {
      // Aflac might have different column names - adjust as needed
      agentNumber = row.AGENTID?.trim() || row.AGENTNUMBER?.trim();
      agentName = row.AGENTNAME?.trim();
    } else if (carrier === 'Aetna') {
      // Aetna might have different column names - adjust as needed
      agentNumber = row.AGENTID?.trim() || row.AGENTNUMBER?.trim();
      agentName = row.AGENTNAME?.trim();
    } else if (carrier === 'Combined') {
      agentNumber = row.agent_number?.trim();
      agentName = row.agent_name?.trim();
    }

    if (agentNumber && agentName) {
      const key = `${agentNumber}-${agentName}`;
      if (!uniqueAgents.has(key)) {
        uniqueAgents.set(key, { number: agentNumber, name: agentName });
      }
    }
  }

  return Array.from(uniqueAgents.values());
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Only agency owners can upload
    if (profile.role !== 'agency_owner') {
      return NextResponse.json(
        { error: 'Only agency owners can upload documents' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const carrierName = formData.get('carrier') as string;

    if (!file || !carrierName) {
      return NextResponse.json(
        { error: 'Missing file or carrier name' },
        { status: 400 }
      );
    }

    // Parse the file to extract writing agents
    let parsedData: any[] = [];
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const content = await file.text();
      parsedData = parseAMAMCSV(content);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const buffer = await file.arrayBuffer();
      parsedData = await parseExcel(buffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload CSV or Excel files.' },
        { status: 400 }
      );
    }

    // Extract unique writing agents
    const writingAgents = extractWritingAgents(parsedData, carrierName);

    if (writingAgents.length === 0) {
      return NextResponse.json(
        { error: 'No writing agents found in the document. Please check the file format.' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const filePath = `${profile.agency_id}/${carrierName}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('carrier-documents')
      .upload(filePath, file, {
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // Save document metadata
    const { error: docError } = await supabase
      .from('carrier_documents')
      .upsert({
        agency_id: profile.agency_id,
        carrier_name: carrierName,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        uploaded_by: user.id,
      }, {
        onConflict: 'agency_id,carrier_name',
      });

    if (docError) {
      console.error('Document metadata error:', docError);
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      );
    }

    // Delete existing writing agents for this carrier (to handle updates)
    await supabase
      .from('writing_agents')
      .delete()
      .eq('agency_id', profile.agency_id)
      .eq('carrier_name', carrierName);

    // Insert new writing agents
    const writingAgentRecords = writingAgents.map(agent => ({
      agency_id: profile.agency_id,
      carrier_name: carrierName,
      agent_number: agent.number,
      agent_name: agent.name,
    }));

    const { error: agentsError } = await supabase
      .from('writing_agents')
      .insert(writingAgentRecords);

    if (agentsError) {
      console.error('Writing agents error:', agentsError);
      return NextResponse.json(
        { error: 'Failed to save writing agents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      writingAgentsCount: writingAgents.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

