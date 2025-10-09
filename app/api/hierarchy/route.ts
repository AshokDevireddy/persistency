import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HierarchyNode } from '@/lib/types/database';

async function buildHierarchyTree(
  supabase: any,
  rootId: string,
  allProfiles: any[]
): Promise<HierarchyNode> {
  const profile = allProfiles.find(p => p.id === rootId);

  if (!profile) {
    throw new Error('Profile not found');
  }

  // Get children
  const children = allProfiles.filter(p => p.upline_id === rootId);

  // Get writing agents for this profile
  const { data: assignments } = await supabase
    .from('agent_assignments')
    .select('writing_agent:writing_agents(*)')
    .eq('profile_id', rootId);

  const writingAgents = assignments?.map((a: any) => a.writing_agent) || [];

  const node: HierarchyNode = {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    writing_agents: writingAgents,
    children: await Promise.all(
      children.map(child => buildHierarchyTree(supabase, child.id, allProfiles))
    ),
  };

  return node;
}

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

    // Get all profiles in the agency
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('agency_id', profile.agency_id)
      .order('created_at', { ascending: true });

    if (profilesError) {
      console.error('Profiles error:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }

    // Find the root (agency owner)
    const root = allProfiles.find(p => p.role === 'agency_owner');

    if (!root) {
      return NextResponse.json(
        { error: 'Agency owner not found' },
        { status: 404 }
      );
    }

    // Build hierarchy tree
    const hierarchyTree = await buildHierarchyTree(supabase, root.id, allProfiles);

    // Get current user's position in tree (for highlighting)
    const findNodePath = (node: HierarchyNode, targetId: string, path: string[] = []): string[] | null => {
      if (node.id === targetId) {
        return [...path, node.id];
      }

      for (const child of node.children || []) {
        const result = findNodePath(child, targetId, [...path, node.id]);
        if (result) return result;
      }

      return null;
    };

    const currentUserPath = findNodePath(hierarchyTree, user.id);

    return NextResponse.json({
      success: true,
      hierarchy: hierarchyTree,
      currentUserId: user.id,
      currentUserPath,
    });
  } catch (error) {
    console.error('Hierarchy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

