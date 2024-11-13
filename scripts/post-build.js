const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const pluginPath = path.join(distPath, 'index.js');

let content = fs.readFileSync(pluginPath, 'utf8');

// Remove 'use strict' and exports.__esModule assignment
content = content.replace('"use strict";', '');
content = content.replace('Object.defineProperty(exports, "__esModule", { value: true });', '');

// Replace 'exports.default =' with 'module.exports ='
content = content.replace('exports.default =', 'module.exports =');

fs.writeFileSync(pluginPath, content);

// Rename index.js to plugin.js
fs.renameSync(pluginPath, path.join(distPath, 'plugin.js'));

console.log('Post-build processing completed.');