const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/HomePage.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
const importsToAdd = `import HomeBentoFeatures from '@/components/marketing/sections/HomeBentoFeatures';
import HomeDashboardShowcase from '@/components/marketing/sections/HomeDashboardShowcase';
import HomeROIBanner from '@/components/marketing/sections/HomeROIBanner';`;

if (!content.includes('import HomeBentoFeatures')) {
  content = content.replace(
    "import HomeHero from '@/components/marketing/sections/HomeHero';",
    `${importsToAdd}\nimport HomeHero from '@/components/marketing/sections/HomeHero';`
  );
}

// 2. Remove the simulator sections
const startIndex = content.indexOf('{/* 4. EXCEL-FIRST & SPREADSHEET POWER SIMULATOR */}');
const endMarker = '<HomeIndustrySolutionsSection />';
let endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end markers for replacement.");
  process.exit(1);
}

// Find the <ScrollReveal> right before <HomeIndustrySolutionsSection />
// Search backwards from endIndex for "<ScrollReveal"
const actualEndIndex = content.lastIndexOf('<ScrollReveal', endIndex);

if (actualEndIndex === -1) {
    console.error("Could not find actual end marker for replacement.");
    process.exit(1);
}

const replacement = `      {/* 4. UNIFIED ENGINE & EXCEL IMPORT */}
      <HomeBentoFeatures />

      {/* 5. IMMERSIVE DASHBOARD SHOWCASE */}
      <HomeDashboardShowcase />

      {/* 6. ROI & EXCLUSIVITY BANNER */}
      <HomeROIBanner />

      `;

const newContent = content.substring(0, startIndex) + replacement + content.substring(actualEndIndex);

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log("Successfully updated HomePage.jsx");
