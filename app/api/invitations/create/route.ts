import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

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
      .select('*, agency:agencies(*)')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, upline_id, writing_agent_ids } = body;

    if (!email || !upline_id || !writing_agent_ids || !Array.isArray(writing_agent_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email is already invited or registered
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'User already invited' },
        { status: 400 }
      );
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'User already registered' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = nanoid(32);

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        invited_by: user.id,
        agency_id: profile.agency_id,
        upline_id,
        token,
        status: 'pending',
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Invitation error:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // Store the writing agent assignments temporarily
    // They will be assigned when the user accepts the invitation
    // For now, we'll store them in metadata
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        // Store as metadata in a JSONB column if available, or handle separately
      })
      .eq('id', invitation.id);

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/agent/signup?token=${token}`;

    // TODO: Send email with invitation link
    // For now, we'll just return the URL

    return NextResponse.json({
      success: true,
      invitation,
      invitationUrl,
      message: 'Invitation created successfully',
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

