'use strict';

var Slate = require('slate');
var Text = Slate.Text;

var _require = require('immutable'),
    List = _require.List;

var TablePosition = require('../TablePosition');

/**
 * Delete current column in a table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */
function removeColumn(opts, editor, at) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getColumnIndex();
    }

    var rows = table.nodes;

    // Remove the cell from every row
    if (pos.getWidth() > 1) {
        editor.withoutNormalizing(function () {
            rows.forEach(function (row) {
                var cell = row.nodes.get(at);
                editor.removeNodeByKey(cell.key);
            });
        });
    }
    // If last column, clear text in cells instead
    else {
            editor.withoutNormalizing(function () {
                rows.forEach(function (row) {
                    row.nodes.forEach(function (cell) {
                        // remove all children of cells
                        // the schema will create an empty child content block in each cell
                        cell.nodes.forEach(function (node) {
                            editor.removeNodeByKey(node.key);
                        });
                    });
                });
            });
        }

    // Replace the table
    return editor;
}

module.exports = removeColumn;