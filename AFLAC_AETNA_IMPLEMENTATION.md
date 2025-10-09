# Aflac & Aetna Implementation Summary

## Overview
Successfully added Aflac and Aetna carrier support to the Persistency Analyzer application. Both carriers now support XLSX (Excel) file uploads in addition to CSV.

## Changes Made

### 1. Backend API (`app/api/analyze/route.ts`)

#### Dependencies Added
- `xlsx` package for parsing Excel files
- `@types/xlsx` for TypeScript support

#### New Interfaces
- `AflacPolicy` - Type definition for Aflac policy data
- `AetnaPolicy` - Type definition for Aetna policy data

#### Aflac Implementation
- **parseAflacXLSX()** - Parses XLSX/XLS files with header on row 2 (index 1)
- **parseAflacDate()** - Handles Excel serial dates and standard date formats
- **classifyAflacPolicy()** - Classifies policies as positive/negative
  - Active policies = positive
  - Death claims with >24 months persistence = positive
  - All other statuses = negative
- **filterAflacPoliciesByTimeRange()** - Filters by ORIGEFFDATE
- **analyzeAflacTimeRange()** - Calculates persistency metrics
- **getAflacStatusBreakdown()** - Groups by STATUSCATEGORY
- **analyzeAflac()** - Main analysis function for 3, 6, 9 months and all-time
- **extractLapsePoliciesFromAflac()** - Extracts lapsed/at-risk policies

#### Aetna Implementation
- **parseAetnaXLSX()** - Parses XLSX/XLS files with header on row 2 (index 1)
- **parseAetnaDate()** - Handles Excel serial dates and standard date formats
- **classifyAetnaPolicy()** - Classifies policies as positive/negative
  - Active policies = positive
  - Death claims with >24 months persistence = positive
  - All other statuses = negative
- **filterAetnaPoliciesByTimeRange()** - Filters by ORIGEFFDATE
- **analyzeAetnaTimeRange()** - Calculates persistency metrics
- **getAetnaStatusBreakdown()** - Groups by STATUSCATEGORY
- **analyzeAetna()** - Main analysis function for 3, 6, 9 months and all-time
- **extractLapsePoliciesFromAetna()** - Extracts lapsed/at-risk policies

#### POST Handler Updates
- Added processing for 'aflac' form field
- Added processing for 'aetna' form field
- Both carriers extract lapse policies and include them in the response

### 2. Frontend UI (`app/page.tsx`)

#### Type Updates
- Extended `CarrierType` to include `'aflac'` and `'aetna'`
- Updated files state to include aflac and aetna entries

#### UI Updates
- Changed grid from 2 columns to 4 columns (responsive)
- Added FileUpload component for Aflac
- Added FileUpload component for Aetna
- Updated description to mention "CSV or Excel files"

### 3. File Upload Component (`components/FileUpload.tsx`)
- Already supported `.xlsx` and `.xls` files (no changes needed)

## Data Schema

Both Aflac and Aetna use the same schema from the "Policy Summary" sheet:

### Key Fields
- **POLICYNUMBER** - Unique policy identifier
- **STATUSCATEGORY** - Coarse status (Active, Lapsed, Terminated, etc.)
- **STATUSDISPLAYTEXT** - Detailed status description
- **ORIGEFFDATE** - Original effective date (used for time filtering)
- **ISSUEDATE** - Issue date
- **PAIDTODATE** - Paid-to date
- **TERMDATE** - Termination date
- **FIRSTNAME**, **LASTNAME** - Insured name
- **PHONE1** - Contact phone

### Persistency Classification

#### Positive (Active)
- STATUSCATEGORY = "Active"
- Death claims with >24 months persistence (TERMDATE - ORIGEFFDATE > 24 months)

#### Negative (Inactive)
- Decline, Not Taken, Withdrawn, Closed, Terminated
- LM App Decline, Lapsed, Pending, Reject, Rescind, Reissue
- Death claims with ≤24 months persistence

### Lapse Detection
Policies are flagged as "at-risk" or "lapsed" if:
- STATUSCATEGORY = "Lapsed"
- STATUSDISPLAYTEXT contains "lapse"
- STATUSDISPLAYTEXT contains "requested termination"

## Time Ranges Analyzed
- **3 months** - Policies with ORIGEFFDATE in last 3 months
- **6 months** - Policies with ORIGEFFDATE in last 6 months
- **9 months** - Policies with ORIGEFFDATE in last 9 months
- **All time** - All policies in the file

## Excel File Format
- Files must be XLSX or XLS format
- Sheet name should contain "policy" (case-insensitive) or be the first sheet
- Headers are expected on **row 2** (Excel row 2, 0-indexed row 1)
- Data rows start on row 3

## Testing Files Available
- `Aflac_policies.xlsx` - Sample Aflac data
- `Aetna_policies.xlsx` - Sample Aetna data

## API Response Format
The `/api/analyze` endpoint now returns results for all uploaded carriers including Aflac and Aetna:

```json
{
  "results": [
    {
      "carrier": "Aflac",
      "timeRanges": {
        "3": { "positivePercentage": 85.5, "positiveCount": 150, ... },
        "6": { ... },
        "9": { ... },
        "All": { ... }
      },
      "statusBreakdowns": {
        "3": { "Active": { "count": 150, "percentage": 85.5 }, ... },
        ...
      },
      "totalPolicies": 1000,
      "persistencyRate": 87.2
    }
  ],
  "lapsePolicies": [
    {
      "id": "POL123456",
      "carrier": "Aflac",
      "insuredFirstName": "John",
      "insuredLastName": "Doe",
      "phone": "555-1234",
      "statuses": ["Lapsed", "Policy Lapsed"],
      "daysToLapse": null
    }
  ]
}
```

## Installation
The following packages were added to package.json:
```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

## Usage
1. Navigate to the application in your browser
2. Upload Aflac XLSX file using the "Aflac" upload box
3. Upload Aetna XLSX file using the "Aetna" upload box
4. Optionally upload American Amicable or Combined Insurance CSV files
5. Click "Analyze Persistency"
6. View results including:
   - Persistency charts across all carriers
   - Detailed breakdown by time period
   - Status distribution
   - Lapsed/at-risk policies table

## Implementation Matches Requirements
✅ Computes persistency (active vs inactive) for Aflac and Aetna
✅ Analyzes across 3, 6, 9 months and all-time
✅ Produces status breakdowns
✅ Extracts "about to lapse / lapsed" policies
✅ Handles XLSX file format with headers on row 2
✅ Uses ORIGEFFDATE for time filtering
✅ Implements death exception (>24 months = positive)
✅ Matches functionality of AMAM and Combined carriers
✅ Displays lapse policies in the same table as other carriers

