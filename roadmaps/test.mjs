import path from 'node:path';

console.log('process.argv[1]:', process.argv[1]);
console.log('resolved:', path.resolve(process.argv[1]));
console.log('as URL:', `file://${path.resolve(process.argv[1]).replace(/\/g, '/')}`);
console.log('import.meta.url:', import.meta.url);
