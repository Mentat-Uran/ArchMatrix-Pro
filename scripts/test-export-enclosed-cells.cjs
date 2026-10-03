const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'matrix_generator.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'application script should exist');

function loadApp() {
    let exportedJSON;
    const document = {
        body: {
            appendChild() {},
            removeChild() {},
        },
        createElement() {
            return { click() {} };
        },
    };
    const context = {
        Blob: class {
            constructor(parts) {
                this.text = parts[0];
            }
        },
        URL: {
            createObjectURL(blob) {
                exportedJSON = JSON.parse(blob.text);
                return 'blob:test';
            },
        },
        document,
        window: {},
    };

    vm.runInNewContext(`${script}\nglobalThis.AppForTest = App;`, context);
    return {
        createApp(matrix) {
            const app = Object.create(context.AppForTest.prototype);
            app.size = matrix.length;
            app.matrix = matrix;
            app.gridEl = { children: [] };
            app.showToast = () => {};
            app.exportJSON();
            return exportedJSON;
        },
    };
}

test('exports enclosed cells even when there are no rendered inner-cell markers', () => {
    const app = loadApp();
    const matrix = [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ];

    assert.deepEqual(app.createApp(matrix), matrix.map(row => row.map(() => 1)));
});

test('does not fill an open boundary during export', () => {
    const app = loadApp();
    const matrix = [
        [1, 1, 0, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
    ];

    assert.deepEqual(app.createApp(matrix), matrix);
});
