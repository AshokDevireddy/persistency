import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const body = await request.json();
    const { profile_id, writing_agent_ids } = body;

    if (!profile_id || !writing_agent_ids || !Array.isArray(writing_agent_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's profile to verify they have permission
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get target profile
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json(
        { error: 'Target profile not found' },
        { status: 404 }
      );
    }

    // Verify they're in the same agency
    if (currentProfile.agency_id !== targetProfile.agency_id) {
      return NextResponse.json(
        { error: 'Not authorized to assign agents across agencies' },
        { status: 403 }
      );
    }

    // Delete existing assignments
    await supabase
      .from('agent_assignments')
      .delete()
      .eq('profile_id', profile_id);

    // Create new assignments
    const assignments = writing_agent_ids.map(wa_id => ({
      profile_id,
      writing_agent_id: wa_id,
    }));

    const { error: insertError } = await supabase
      .from('agent_assignments')
      .insert(assignments);

    if (insertError) {
      console.error('Assignment error:', insertError);
      return NextResponse.json(
        { error: 'Failed to assign writing agents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Writing agents assigned successfully',
    });
  } catch (error) {
    console.error('Assign agents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

