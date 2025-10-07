# Persistency Analyzer

A modern, beautiful web application for analyzing insurance policy persistency across multiple carriers.

## Features

- 📊 **Multi-Carrier Analysis**: Upload and analyze data from American Amicable, Guarantee Trust Life, and Combined
- 📈 **Visual Persistency Charts**: Beautiful pie charts showing persistency rates
- ⚠️ **Lapsing Policy Alerts**: Identify policies at risk with urgency indicators
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- ⚡ **Fast & Efficient**: Built with Next.js 14 and optimized for performance

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd persistency
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customizing Analysis Logic

The application includes placeholder analysis functions that you need to customize with your specific business logic.

### File Structure

- `app/api/analyze/route.ts` - Contains the analysis logic for each carrier
- `components/FileUpload.tsx` - File upload component
- `components/PersistencyChart.tsx` - Pie chart visualization
- `components/LapsingPolicies.tsx` - Display lapsing policies

### Customizing Analysis Functions

Edit `/app/api/analyze/route.ts` and replace the placeholder functions with your actual analysis code:

```typescript
async function analyzeAmericanAmicable(fileContent: string) {
  // Add your American Amicable analysis logic here
  // Parse the CSV, calculate persistency, identify lapsing policies
  // Return the result object
}

async function analyzeGuaranteeTrustLife(fileContent: string) {
  // Add your Guarantee Trust Life analysis logic here
}

async function analyzeCombined(fileContent: string) {
  // Add your Combined analysis logic here
}
```

Each function should return an object with this structure:

```typescript
{
  carrier: string;              // Carrier name
  persistencyRate: number;      // Percentage (0-100)
  totalPolicies: number;        // Total count
  activePolicies: number;       // Active count
  lapsedPolicies: number;       // Lapsed count
  lapsingPolicies: [            // Array of policies at risk
    {
      policyNumber: string;
      holderName: string;
      premium: number;
      daysUntilLapse: number;
    }
  ]
}
```

## CSV File Format

Your CSV files should include columns that map to the policy data structure. Common columns include:

- Policy Number
- Policy Holder Name
- Premium Amount
- Status (active/lapsed)
- Days Until Lapse
- Last Payment Date

The default implementation looks for these column names (case-insensitive):
- `policyNumber` or `PolicyNumber`
- `holderName` or `PolicyHolder`
- `premium` or `Premium`
- `status`
- `daysUntilLapse`

## Deployment on Vercel

1. Push your code to GitHub

2. Import your repository on [Vercel](https://vercel.com):
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. Vercel will automatically detect Next.js and configure the build settings

4. Your app will be live at `https://your-project.vercel.app`

### Environment Variables (if needed)

If you need environment variables:
1. Go to your project settings on Vercel
2. Navigate to "Environment Variables"
3. Add your variables

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **CSV Parsing**: PapaParse
- **Icons**: Lucide React

## Development

### Project Structure

```
persistency/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts       # API endpoint for analysis
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── FileUpload.tsx         # File upload component
│   ├── PersistencyChart.tsx   # Chart component
│   └── LapsingPolicies.tsx    # Lapsing policies display
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT

## Support

For issues or questions, please open an issue in the repository.

