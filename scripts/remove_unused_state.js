const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/HomePage.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

// The marker for the start of the section to remove
const startMarker = '  // Cost & Margin Calculator State';
// The marker for the end of the section to remove
const endMarker = '  // FAQ Accordion State';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find markers to remove state");
  process.exit(1);
}

const newContent = content.substring(0, startIndex) + content.substring(endIndex);

fs.writeFileSync(filePath, newContent, 'utf-8');
console.log("Successfully removed unused state.");
