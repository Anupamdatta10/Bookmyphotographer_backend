import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Read the Excel file
const filePath = 'c:\\Users\\anupa\\Downloads\\bookMyPhotographer_db.xlsx';

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath);

console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
  console.log(`\n=== Sheet: ${sheetName} ===`);
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('Raw data (first 10 rows):');
  jsonData.slice(0, 10).forEach((row: any, index: number) => {
    console.log(`Row ${index}:`, row);
  });
  
  // Also get as objects with headers
  const jsonDataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
  console.log('\nAs objects (first 5):');
  jsonDataWithHeaders.slice(0, 5).forEach((row: any, index: number) => {
    console.log(`Row ${index}:`, row);
  });
  
  console.log(`\nTotal rows: ${jsonDataWithHeaders.length}`);
});