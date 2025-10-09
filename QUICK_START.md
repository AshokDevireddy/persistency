# Quick Start Guide

## 🚀 Getting Started in 5 Steps

### Step 1: Set Up Supabase (10 minutes)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project (note: takes ~2 minutes to provision)
3. Go to **SQL Editor** → Copy/paste `supabase-schema.sql` → Run
4. Go to **Storage** → Create bucket `carrier-documents` (Private)
5. Add storage policies (see SETUP_INSTRUCTIONS.md)

### Step 2: Configure Environment (2 minutes)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these from Supabase: **Settings → API**

### Step 3: Install & Run (2 minutes)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4: Create Agency Owner Account (1 minute)

1. Click "Sign up as agency owner"
2. Fill in agency name, your name, email, password
3. Submit → You're in the dashboard!

### Step 5: Upload Documents & Add Agents (5 minutes)

1. Click **"Documents"** → Upload carrier CSV/Excel files
2. Click **"Hierarchy"** → Click **"Add Downline"**
3. Enter agent email, select writing agents → Send invitation
4. Share invitation URL with agent
5. Agent completes signup
6. Both can now view filtered dashboards!

---

## 📊 What You Built

A complete insurance persistency platform with:

- ✅ **Authentication**: Separate flows for agency owners and agents
- ✅ **Document Management**: Upload/store carrier policy reports
- ✅ **Hierarchy Tree**: Visual org structure with unlimited levels
- ✅ **Data Filtering**: "My Data" vs "Downline Data" toggle
- ✅ **Role-Based Access**: Owners upload, agents view filtered data
- ✅ **Writing Agent Assignment**: Link agents to specific writing agent IDs

---

## 🎯 Core Features

### For Agency Owners
- Upload carrier documents (AMAM, Combined, Aflac, Aetna)
- View entire agency's persistency data
- Add downline agents with writing agent assignments
- Manage organizational hierarchy

### For Agents
- View only their assigned writing agents' data
- Toggle between personal and team metrics
- Add their own downlines (sub-agents)
- Track lapsing policies

---

## 📁 Project Structure

```
app/
├── auth/              # Login & signup pages
├── dashboard/         # Main analytics view
├── documents/         # Upload & manage carrier files
├── hierarchy/         # Org tree & agent management
└── api/               # Backend routes

components/
├── HierarchyTree.tsx  # Recursive org tree
├── AddAgentModal.tsx  # Agent invitation modal
├── PersistencyChart.tsx
└── LapseSection.tsx

lib/
└── supabase/          # Supabase clients & middleware

supabase-schema.sql    # Complete database schema
```

---

## 🔐 Environment Variables Needed

| Variable | Where to Find | Purpose |
|----------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | API endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public | Client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role | Server operations |
| `NEXT_PUBLIC_APP_URL` | Your domain | Used for invitation links |

---

## ✨ Usage Flow

```
1. Agency Owner signs up
   ↓
2. Uploads carrier documents (CSV/Excel)
   ↓
3. System extracts writing agent names/numbers
   ↓
4. Owner adds downline agent
   ↓
5. Selects which writing agents to assign
   ↓
6. Agent receives invitation link
   ↓
7. Agent signs up with password
   ↓
8. Agent sees filtered dashboard (only their data)
   ↓
9. Agent can add their own downlines
```

---

## 🛠️ Troubleshooting

### "No writing agents found"
**Issue**: Column names in CSV/Excel don't match expected format

**Fix**: Check `/app/api/documents/upload/route.ts` and adjust column names:
- AMAM: `WritingAgent` and `AgentName`
- Aflac: `AGENTID` and `AGENTNAME`
- Aetna: `AGENTID` and `AGENTNAME`

### "Failed to upload file"
**Issue**: Storage bucket not configured

**Fix**:
1. Create bucket named exactly `carrier-documents`
2. Set to Private (not public)
3. Add storage RLS policies (see SETUP_INSTRUCTIONS.md)

### "Profile not found"
**Issue**: Auth session issue

**Fix**:
1. Sign out completely
2. Clear browser cache/cookies
3. Sign in again

### Agent can't see data
**Issue**: No writing agents assigned

**Fix**:
1. Agency owner must upload documents first
2. Owner must assign writing agents when inviting
3. Check hierarchy page to verify assignments

---

## 🎨 UI/UX Highlights

- **Clean, modern design** with Tailwind CSS
- **Responsive layout** works on mobile/tablet/desktop
- **Loading states** for better UX
- **Error handling** with clear messages
- **Intuitive navigation** between pages
- **Real-time filtering** with toggle

---

## 📦 Dependencies Added

```json
{
  "@supabase/supabase-js": "^2.x",
  "@supabase/ssr": "^0.x",
  "nanoid": "^5.x",
  "react-d3-tree": "^3.x"
}
```

Plus existing: Next.js, React, Papa Parse, XLSX, Recharts, Lucide Icons

---

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)
```bash
# Push to GitHub
git add .
git commit -m "Add auth and hierarchy features"
git push

# Deploy
vercel --prod
```

Add environment variables in Vercel dashboard.

### Option 2: Other Platforms
Works on any Node.js hosting:
- Netlify
- Railway
- Render
- AWS Amplify

---

## 📚 Documentation

- **SETUP_INSTRUCTIONS.md** - Detailed setup guide
- **IMPLEMENTATION_SUMMARY.md** - Architecture & technical details
- **supabase-schema.sql** - Database schema with comments

---

## 🎉 You're All Set!

Your persistency analyzer is now a complete multi-tenant platform with:
- ✅ Secure authentication
- ✅ Role-based access control
- ✅ Hierarchical organization management
- ✅ Filtered data views
- ✅ Document storage
- ✅ Modern UI

**Next steps**: Test the complete flow, then deploy to production!

---

## 💡 Pro Tips

1. **Test thoroughly** with different carriers before production
2. **Back up Supabase** regularly (Project Settings → Database → Backups)
3. **Monitor logs** in Supabase dashboard for issues
4. **Start with small dataset** to test filtering logic
5. **Document column name variations** for each carrier

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Review Supabase logs (Dashboard → Logs)
3. Verify environment variables are set
4. Check RLS policies are active
5. Refer to SETUP_INSTRUCTIONS.md

---

**Built with ❤️ using Next.js 14, Supabase, and TailwindCSS**

