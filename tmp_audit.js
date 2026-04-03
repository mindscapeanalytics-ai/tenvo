const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const actionPath = path.join(process.cwd(), 'lib', 'actions');
const files = walk(actionPath);
const missing = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes("'use server'") && !content.includes('"use server"')) {
        missing.push(file);
    }
});

console.log('--- MISSING USE SERVER ---');
missing.forEach(f => console.log(path.relative(process.cwd(), f)));
console.log('--- END ---');
