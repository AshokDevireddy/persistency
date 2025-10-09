-- ============================================================
-- Supabase Schema for Insurance Persistency Platform
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Agencies table
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  upline_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('agency_owner', 'agent')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  upline_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- Writing agents table (extracted from uploaded documents)
CREATE TABLE writing_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  carrier_name TEXT NOT NULL,
  agent_number TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, carrier_name, agent_number)
);

-- Agent assignments table (links user accounts to writing agent data)
CREATE TABLE agent_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  writing_agent_id UUID NOT NULL REFERENCES writing_agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, writing_agent_id)
);

-- Carrier documents table (tracks uploaded files)
CREATE TABLE carrier_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  carrier_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, carrier_name)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX idx_profiles_upline_id ON profiles(upline_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_agency_id ON invitations(agency_id);
CREATE INDEX idx_writing_agents_agency_id ON writing_agents(agency_id);
CREATE INDEX idx_writing_agents_carrier ON writing_agents(carrier_name);
CREATE INDEX idx_agent_assignments_profile_id ON agent_assignments(profile_id);
CREATE INDEX idx_agent_assignments_writing_agent_id ON agent_assignments(writing_agent_id);
CREATE INDEX idx_carrier_documents_agency_id ON carrier_documents(agency_id);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to create agency and set owner
CREATE OR REPLACE FUNCTION create_agency_and_owner(
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  agency_name TEXT
)
RETURNS UUID AS $$
DECLARE
  new_agency_id UUID;
BEGIN
  -- Create agency
  INSERT INTO agencies (name, owner_id)
  VALUES (agency_name, user_id)
  RETURNING id INTO new_agency_id;

  -- Create profile as agency owner
  INSERT INTO profiles (id, email, full_name, agency_id, upline_id, role, status)
  VALUES (user_id, user_email, user_name, new_agency_id, NULL, 'agency_owner', 'active');

  RETURN new_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all downline profile IDs recursively
CREATE OR REPLACE FUNCTION get_all_downline_ids(profile_id UUID)
RETURNS TABLE(downline_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE downline_tree AS (
    -- Base case: direct downlines
    SELECT id FROM profiles WHERE upline_id = profile_id
    UNION
    -- Recursive case: downlines of downlines
    SELECT p.id
    FROM profiles p
    INNER JOIN downline_tree dt ON p.upline_id = dt.id
  )
  SELECT id FROM downline_tree;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all upline profile IDs recursively
CREATE OR REPLACE FUNCTION get_all_upline_ids(profile_id UUID)
RETURNS TABLE(upline_id UUID) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE upline_tree AS (
    -- Base case: direct upline
    SELECT upline_id FROM profiles WHERE id = profile_id AND upline_id IS NOT NULL
    UNION
    -- Recursive case: uplines of uplines
    SELECT p.upline_id
    FROM profiles p
    INNER JOIN upline_tree ut ON p.id = ut.upline_id
    WHERE p.upline_id IS NOT NULL
  )
  SELECT upline_id FROM upline_tree;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carrier_documents_updated_at BEFORE UPDATE ON carrier_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrier_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - AGENCIES
-- ============================================================

-- Users can view their own agency
CREATE POLICY "Users can view their own agency"
  ON agencies FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- Only agency owners can update their agency
CREATE POLICY "Agency owners can update their agency"
  ON agencies FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================================
-- RLS POLICIES - PROFILES
-- ============================================================

-- Users can view profiles in their agency
CREATE POLICY "Users can view profiles in their agency"
  ON profiles FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Service role can insert profiles (for signup)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES - INVITATIONS
-- ============================================================

-- Users can view invitations they sent
CREATE POLICY "Users can view invitations they sent"
  ON invitations FOR SELECT
  USING (invited_by = auth.uid());

-- Users can view invitations sent to their email
CREATE POLICY "Users can view invitations for their email"
  ON invitations FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Users can create invitations in their agency
CREATE POLICY "Users can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    invited_by = auth.uid() AND
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- Users can update invitations they sent
CREATE POLICY "Users can update their invitations"
  ON invitations FOR UPDATE
  USING (invited_by = auth.uid());

-- ============================================================
-- RLS POLICIES - WRITING AGENTS
-- ============================================================

-- Users can view writing agents in their agency
CREATE POLICY "Users can view writing agents in their agency"
  ON writing_agents FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- Agency owners can insert writing agents
CREATE POLICY "Agency owners can insert writing agents"
  ON writing_agents FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE id = auth.uid() AND role = 'agency_owner'
    )
  );

-- Agency owners can delete writing agents
CREATE POLICY "Agency owners can delete writing agents"
  ON writing_agents FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE id = auth.uid() AND role = 'agency_owner'
    )
  );

-- ============================================================
-- RLS POLICIES - AGENT ASSIGNMENTS
-- ============================================================

-- Users can view agent assignments in their agency
CREATE POLICY "Users can view agent assignments in their agency"
  ON agent_assignments FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Users with proper permissions can create agent assignments
CREATE POLICY "Users can create agent assignments"
  ON agent_assignments FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles p1
      WHERE p1.agency_id IN (SELECT agency_id FROM profiles WHERE id = profile_id)
    )
  );

-- Users can delete agent assignments for their downlines
CREATE POLICY "Users can delete agent assignments"
  ON agent_assignments FOR DELETE
  USING (
    profile_id IN (
      SELECT downline_id FROM get_all_downline_ids(auth.uid())
    ) OR
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'agency_owner' AND agency_id IN (
        SELECT agency_id FROM profiles WHERE id = profile_id
      )
    )
  );

-- ============================================================
-- RLS POLICIES - CARRIER DOCUMENTS
-- ============================================================

-- Users can view carrier documents in their agency
CREATE POLICY "Users can view carrier documents in their agency"
  ON carrier_documents FOR SELECT
  USING (
    agency_id IN (SELECT agency_id FROM profiles WHERE id = auth.uid())
  );

-- Agency owners can insert carrier documents
CREATE POLICY "Agency owners can insert carrier documents"
  ON carrier_documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE id = auth.uid() AND role = 'agency_owner'
    )
  );

-- Agency owners can update carrier documents
CREATE POLICY "Agency owners can update carrier documents"
  ON carrier_documents FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE id = auth.uid() AND role = 'agency_owner'
    )
  );

-- Agency owners can delete carrier documents
CREATE POLICY "Agency owners can delete carrier documents"
  ON carrier_documents FOR DELETE
  USING (
    agency_id IN (
      SELECT agency_id FROM profiles
      WHERE id = auth.uid() AND role = 'agency_owner'
    )
  );

-- ============================================================
-- STORAGE SETUP (Run these commands in Supabase Dashboard)
-- ============================================================

-- 1. Create a storage bucket named "carrier-documents"
-- 2. Set it to private (not public)
-- 3. Add the following storage policies:

-- Storage Policy: Users can view files from their agency
-- CREATE POLICY "Users can view agency files"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'carrier-documents' AND
--   (storage.foldername(name))[1] IN (
--     SELECT agency_id::text FROM profiles WHERE id = auth.uid()
--   )
-- );

-- Storage Policy: Agency owners can upload files
-- CREATE POLICY "Agency owners can upload files"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'carrier-documents' AND
--   (storage.foldername(name))[1] IN (
--     SELECT agency_id::text FROM profiles
--     WHERE id = auth.uid() AND role = 'agency_owner'
--   )
-- );

-- Storage Policy: Agency owners can update files
-- CREATE POLICY "Agency owners can update files"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'carrier-documents' AND
--   (storage.foldername(name))[1] IN (
--     SELECT agency_id::text FROM profiles
--     WHERE id = auth.uid() AND role = 'agency_owner'
--   )
-- );

-- Storage Policy: Agency owners can delete files
-- CREATE POLICY "Agency owners can delete files"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'carrier-documents' AND
--   (storage.foldername(name))[1] IN (
--     SELECT agency_id::text FROM profiles
--     WHERE id = auth.uid() AND role = 'agency_owner'
--   )
-- );
