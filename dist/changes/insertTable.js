'use strict';

var createTable = require('../createTable');

/**
 * Insert a new table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} columns
 * @param {Number} rows
 * @return {Slate.Editor}
 */
function insertTable(opts, editor) {
    var columns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 2;
    var rows = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 2;
    var value = editor.value;


    if (!value.selection.start.key) return false;

    // Create the table node
    var fillWithEmptyText = function fillWithEmptyText(x, y) {
        return '';
    };
    var table = createTable(opts, columns, rows, fillWithEmptyText);

    var done = editor.insertBlock(table);
    return done;
}

module.exports = insertTable;