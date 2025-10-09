import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get all documents for the agency
    const { data: documents, error: docsError } = await supabase
      .from('carrier_documents')
      .select('*, uploader:profiles!carrier_documents_uploaded_by_fkey(full_name, email)')
      .eq('agency_id', profile.agency_id)
      .order('updated_at', { ascending: false });

    if (docsError) {
      console.error('Documents error:', docsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Get writing agents count for each carrier
    const documentsWithCounts = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count } = await supabase
          .from('writing_agents')
          .select('*', { count: 'exact', head: true })
          .eq('agency_id', profile.agency_id)
          .eq('carrier_name', doc.carrier_name);

        return {
          ...doc,
          writing_agents_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      documents: documentsWithCounts,
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

