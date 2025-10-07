# Instructions for Adding Your Analysis Code

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Adding Your Analysis Code

Your custom analysis code needs to be added to: `app/api/analyze/route.ts`

### Step 1: Locate the Analysis Functions

Open `app/api/analyze/route.ts` and find these three functions:

- `analyzeAmericanAmicable(fileContent: string)`
- `analyzeGuaranteeTrustLife(fileContent: string)`
- `analyzeCombined(fileContent: string)`

### Step 2: Replace the Placeholder Code

Each function currently has placeholder code that looks like this:

```typescript
async function analyzeAmericanAmicable(fileContent: string) {
  // TODO: Replace with your American Amicable analysis logic
  const parsed = Papa.parse(fileContent, { header: true });
  const data = parsed.data as any[];

  // ... placeholder logic ...

  return {
    carrier: 'American Amicable',
    persistencyRate: (activePolicies / totalPolicies) * 100,
    totalPolicies,
    activePolicies,
    lapsedPolicies,
    lapsingPolicies,
  };
}
```

### Step 3: Paste Your Code

Replace the entire function body with your analysis code. Make sure your function returns an object with this exact structure:

```typescript
{
  carrier: string,              // e.g., "American Amicable"
  persistencyRate: number,      // Percentage (0-100)
  totalPolicies: number,        // Total policy count
  activePolicies: number,       // Active policy count
  lapsedPolicies: number,       // Lapsed policy count
  lapsingPolicies: [            // Array of policies about to lapse
    {
      policyNumber: string,     // Policy ID
      holderName: string,       // Customer name
      premium: number,          // Premium amount
      daysUntilLapse: number,   // Days remaining
    }
  ]
}
```

### Step 4: Example Implementation

Here's an example of what your custom code might look like:

```typescript
async function analyzeAmericanAmicable(fileContent: string) {
  // Parse the CSV file
  const parsed = Papa.parse(fileContent, { header: true });
  const data = parsed.data as any[];

  // Your custom logic
  let activePolicies = 0;
  let lapsedPolicies = 0;
  const lapsingPolicies: any[] = [];

  data.forEach((row: any) => {
    // Your custom business logic here
    if (row.Status === 'ACTIVE') {
      activePolicies++;

      // Check if policy is about to lapse
      const daysLeft = calculateDaysUntilLapse(row);
      if (daysLeft <= 30) {
        lapsingPolicies.push({
          policyNumber: row['Policy #'],
          holderName: row['Customer Name'],
          premium: parseFloat(row['Monthly Premium']),
          daysUntilLapse: daysLeft,
        });
      }
    } else {
      lapsedPolicies++;
    }
  });

  const totalPolicies = data.length;
  const persistencyRate = (activePolicies / totalPolicies) * 100;

  return {
    carrier: 'American Amicable',
    persistencyRate,
    totalPolicies,
    activePolicies,
    lapsedPolicies,
    lapsingPolicies: lapsingPolicies.sort((a, b) => a.daysUntilLapse - b.daysUntilLapse),
  };
}
```

## CSV File Format

The app uses PapaParse to parse CSV files. Your CSV should have headers that match your analysis code.

Example CSV structure:
```csv
policyNumber,holderName,premium,status,daysUntilLapse
POL-001,John Smith,1250.00,active,45
POL-002,Jane Doe,850.00,active,12
...
```

A sample CSV file is provided in `sample-data/sample-policies.csv` for testing.

## Testing Your Analysis

1. Start the dev server: `npm run dev`
2. Upload a CSV file for each carrier you want to test
3. Click "Analyze Persistency"
4. Check the console for any errors
5. Verify the results display correctly

## Common Issues

### Issue: "No files provided" error
- Make sure you've selected at least one CSV file before clicking Analyze

### Issue: Data not displaying correctly
- Check that your return object matches the expected structure
- Verify your CSV has the correct headers
- Check the browser console for errors

### Issue: Lapsing policies not showing
- Make sure `lapsingPolicies` is an array (even if empty)
- Verify `daysUntilLapse` is a number

## Deployment

When you're ready to deploy to Vercel:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Click Deploy
5. Vercel will automatically detect Next.js and deploy

Your app will be live at `https://your-project.vercel.app`

## Need Help?

- Check the browser console (F12) for errors
- Review the sample data in `sample-data/sample-policies.csv`
- Make sure your return object structure matches the expected format
- Verify your CSV parsing logic handles your specific file format

## Next Steps

1. Add your analysis code for each carrier
2. Test with your actual CSV files
3. Customize the UI if needed (colors, labels, etc.)
4. Deploy to Vercel

Good luck! 🚀

