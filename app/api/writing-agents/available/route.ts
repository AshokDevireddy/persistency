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

    // Get all writing agents for the agency
    const { data: allWritingAgents, error: agentsError } = await supabase
      .from('writing_agents')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .order('agent_name');

    if (agentsError) {
      console.error('Writing agents error:', agentsError);
      return NextResponse.json(
        { error: 'Failed to fetch writing agents' },
        { status: 500 }
      );
    }

    // Get all assigned writing agents
    const { data: assignments, error: assignmentsError } = await supabase
      .from('agent_assignments')
      .select('writing_agent_id, profile:profiles(full_name, email)')
      .in('profile_id', (await supabase
        .from('profiles')
        .select('id')
        .eq('agency_id', profile.agency_id)
      ).data?.map(p => p.id) || []);

    if (assignmentsError) {
      console.error('Assignments error:', assignmentsError);
    }

    // Create a map of assigned writing agents
    const assignedMap = new Map();
    assignments?.forEach((a: any) => {
      assignedMap.set(a.writing_agent_id, a.profile);
    });

    // Mark which agents are available vs assigned
    const writingAgentsWithStatus = allWritingAgents?.map(agent => ({
      ...agent,
      is_assigned: assignedMap.has(agent.id),
      assigned_to: assignedMap.get(agent.id) || null,
    })) || [];

    return NextResponse.json({
      success: true,
      writing_agents: writingAgentsWithStatus,
    });
  } catch (error) {
    console.error('Available writing agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

