const fs = require('fs');
const txt = fs.readFileSync('d:/SISTEMAS/wonderchicken-back/notes/wonderchicken-api.postman_collection.json', 'utf8');
try {
    JSON.parse(txt);
    console.log('VALID JSON');
} catch(e) {
    console.log('INVALID:', e.message);
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const lines = txt.substring(0, pos).split('\n');
        console.log('Error near line', lines.length, 'column', lines[lines.length-1].length);
        console.log('Context:', txt.substring(Math.max(0, pos-100), pos+100));
    }
}
