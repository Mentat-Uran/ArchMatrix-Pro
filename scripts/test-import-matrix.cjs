const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'matrix_generator.html'), 'utf8');
const start = html.indexOf('        function validateImportedMatrix(data) {');
assert.notEqual(start, -1, 'matrix_generator.html must define the matrix validator');
const close = html.indexOf('\n        }', start);
assert.notEqual(close, -1, 'matrix_generator.html must close the matrix validator');
const source = html.slice(start, close + '\n        }'.length).trim();
const validateImportedMatrix = vm.runInNewContext(`(${source})`);

const input = [[0, 1], [1, 0]];
const normalized = validateImportedMatrix(input);
assert.equal(JSON.stringify(normalized), JSON.stringify(input));
assert.notEqual(normalized, input, 'validator should return a detached matrix');
assert.notEqual(normalized[0], input[0], 'validator should copy matrix rows');

assert.throws(() => validateImportedMatrix([]), /非空二维数组/);
assert.throws(() => validateImportedMatrix(null), /非空二维数组/);
assert.throws(() => validateImportedMatrix([[0, 1], [1]]), /方阵/);
assert.throws(() => validateImportedMatrix([[0], [1, 0]]), /方阵/);
assert.throws(() => validateImportedMatrix([[0, 2], [1, 0]]), /只能是数字 0 或 1/);
assert.throws(() => validateImportedMatrix([[0, '1'], [1, 0]]), /只能是数字 0 或 1/);
assert.throws(() => validateImportedMatrix([[0, true], [1, 0]]), /只能是数字 0 或 1/);

console.log('Imported matrix validation passed.');
