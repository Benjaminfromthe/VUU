const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const startMatch = ') : false ? (';
const endMatch = ') : (';

const startIndex = code.indexOf(startMatch);
if (startIndex !== -1) {
  const endSlice = code.substring(startIndex + startMatch.length);
  const endIndex = endSlice.indexOf(endMatch);
  if (endIndex !== -1) {
    const toRemove = endSlice.substring(0, endIndex);
    if (toRemove.includes('AUTH LOGIN')) {
       code = code.replace(startMatch + toRemove + endMatch, ') : (');
       fs.writeFileSync('src/App.tsx', code);
       console.log('Removed successfully!');
    } else {
       console.log('AUTH LOGIN not found', toRemove.substring(0, 50));
    }
  } else {
    console.log('endMatch not found');
  }
} else {
  console.log('startMatch not found');
}
