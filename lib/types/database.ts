export interface Profile {
  id: string;
  email: string;
  full_name: string;
  agency_id: string;
  upline_id: string | null;
  role: 'agency_owner' | 'agent';
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  invited_by: string;
  agency_id: string;
  upline_id: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface WritingAgent {
  id: string;
  agency_id: string;
  carrier_name: string;
  agent_number: string;
  agent_name: string;
  created_at: string;
}

export interface AgentAssignment {
  id: string;
  profile_id: string;
  writing_agent_id: string;
  created_at: string;
}

export interface CarrierDocument {
  id: string;
  agency_id: string;
  carrier_name: string;
  file_name: string;
  file_path: string;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
}

export interface WritingAgentWithAssignment extends WritingAgent {
  is_assigned: boolean;
}

export interface ProfileWithAgency extends Profile {
  agency?: Agency;
  upline?: Profile;
}

export interface HierarchyNode {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  children?: HierarchyNode[];
  writing_agents?: WritingAgent[];
}

