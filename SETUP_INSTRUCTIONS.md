# Persistency Analyzer - Setup Instructions

## Overview

This application provides insurance agency owners and their agents with tools to:
- Analyze policy persistency across multiple carriers
- Manage organizational hierarchy
- Track writing agent assignments
- View personalized dashboards with filtered data

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- Git

## 1. Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to finish setting up
4. Note down your project URL and API keys from Settings > API

### Step 2: Run Database Schema

1. In your Supabase project, go to the SQL Editor
2. Open the file `supabase-schema.sql` from this repository
3. Copy and paste the entire SQL script into the SQL Editor
4. Click "Run" to execute the schema creation

This will create:
- All necessary tables (agencies, profiles, invitations, writing_agents, etc.)
- Row Level Security (RLS) policies
- Helper functions for hierarchy management
- Indexes for performance

### Step 3: Create Storage Bucket

1. In Supabase, go to Storage
2. Create a new bucket named `carrier-documents`
3. Set it to **Private** (not public)
4. Go to the Policies tab for the bucket
5. Add the following storage policies:

#### Policy 1: Users can view agency files
```sql
CREATE POLICY "Users can view agency files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'carrier-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT agency_id::text FROM profiles WHERE id = auth.uid()
  )
);
```

#### Policy 2: Agency owners can upload files
```sql
CREATE POLICY "Agency owners can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'carrier-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT agency_id::text FROM profiles
    WHERE id = auth.uid() AND role = 'agency_owner'
  )
);
```

#### Policy 3: Agency owners can update files
```sql
CREATE POLICY "Agency owners can update files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'carrier-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT agency_id::text FROM profiles
    WHERE id = auth.uid() AND role = 'agency_owner'
  )
);
```

#### Policy 4: Agency owners can delete files
```sql
CREATE POLICY "Agency owners can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'carrier-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT agency_id::text FROM profiles
    WHERE id = auth.uid() AND role = 'agency_owner'
  )
);
```

## 2. Application Setup

### Step 1: Clone and Install Dependencies

```bash
cd /Users/AshokDevireddy/Developer/persistency
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the values with:
- `NEXT_PUBLIC_SUPABASE_URL`: From Supabase Settings > API > Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From Supabase Settings > API > Project API keys > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: From Supabase Settings > API > Project API keys > service_role (keep this secret!)
- `NEXT_PUBLIC_APP_URL`: Your app URL (use `http://localhost:3000` for development)

### Step 3: Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 3. First-Time Usage

### Agency Owner Signup

1. Navigate to [http://localhost:3000/auth/agency-owner/signup](http://localhost:3000/auth/agency-owner/signup)
2. Fill in:
   - Agency Name
   - Full Name
   - Email
   - Password
3. Click "Create Agency Account"
4. You'll be redirected to the dashboard

### Upload Carrier Documents

1. From the dashboard, click "Documents"
2. Upload CSV/Excel files for each carrier:
   - American Amicable (CSV format)
   - Combined Insurance (CSV format)
   - Aflac (Excel format)
   - Aetna (Excel format)
3. The system will automatically extract writing agent information

### Add Downline Agents

1. From the dashboard, click "Hierarchy"
2. Click "Add Downline" on any agent node
3. Fill in:
   - Email address for the invitation
   - Select writing agent(s) to assign
4. An invitation will be created
5. Share the invitation URL with the agent
6. The agent can complete registration using that link

### Agent Signup (via Invitation)

1. Agent receives invitation email with signup link
2. Agent clicks the link
3. Agent creates their password
4. Account is activated and linked to their upline
5. Agent can now view their filtered dashboard

## 4. Application Features

### Dashboard
- Toggle between "My Data" (personal writing agents) and "Downline Data" (team performance)
- View persistency metrics across all carriers
- See lapsing policies that need attention
- Access navigation to Documents and Hierarchy pages

### Documents Page (Agency Owner Only)
- Upload carrier policy reports
- View upload history
- See writing agent counts per carrier
- Update existing documents (overwrites previous version)

### Hierarchy Page
- Visual tree view of organization structure
- Add downlines at any level
- View writing agent assignments for each agent
- Send invitations directly from the tree

## 5. Data Flow

1. **Agency Owner** uploads carrier documents → System extracts writing agent names/numbers
2. **Agency Owner** adds downline agents → Selects which writing agents to assign
3. **Agent** receives invitation → Completes signup → Account linked to assigned writing agents
4. **Agent** views dashboard → Sees only data for their assigned writing agents
5. **Agent** can add their own downlines → Assigns subset of their writing agents

## 6. Supported Carriers

| Carrier | File Format | Notes |
|---------|-------------|-------|
| American Amicable | CSV | Uses WritingAgent and AgentName columns |
| Combined Insurance | CSV | Standard format |
| Aflac | Excel (.xlsx) | Header on row 2 |
| Aetna | Excel (.xlsx) | Header on row 2 |

## 7. Troubleshooting

### "No writing agents found"
- Check that your CSV/Excel file has the correct column names
- For American Amicable: Ensure `WritingAgent` and `AgentName` columns exist
- For Excel files: Ensure data starts on row 2 (row 1 is skipped)

### "Failed to upload file"
- Check that the storage bucket `carrier-documents` exists
- Verify storage policies are correctly configured
- Ensure file is CSV or Excel format

### "Profile not found"
- Clear browser cache and cookies
- Sign out and sign in again
- Check Supabase logs for authentication errors

### Agent can't see data
- Verify agent has writing agents assigned in the hierarchy
- Check that documents have been uploaded for the relevant carriers
- Ensure agent's upline has assigned the correct writing agent pairs

## 8. Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel settings
5. Update `NEXT_PUBLIC_APP_URL` to your production domain
6. Deploy

### Update Supabase Settings

1. In Supabase, go to Authentication > URL Configuration
2. Add your production URL to:
   - Site URL
   - Redirect URLs

## 9. Security Notes

- Never commit `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use strong passwords for all accounts
- Regularly review Supabase logs for suspicious activity
- RLS policies ensure users can only access their own agency's data

## 10. Future Enhancements

Potential features to add:
- Email integration for invitation sending
- Real-time notifications
- Advanced analytics and reporting
- Export functionality
- Agent performance tracking
- Multi-agency support for partnerships
- Mobile app

## Support

For issues or questions:
1. Check the Supabase logs in the Dashboard
2. Review browser console for errors
3. Check Network tab in DevTools for failed API calls
4. Verify environment variables are set correctly

---

Built with Next.js 14, Supabase, and TailwindCSS

