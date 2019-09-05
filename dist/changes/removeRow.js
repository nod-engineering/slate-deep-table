'use strict';

var Slate = require('slate');
var Text = Slate.Text;

var TablePosition = require('../TablePosition');

/**
 * Remove current row in a table. Clear it if last remaining row
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */
function removeRow(opts, editor, at) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    if (typeof at === 'undefined') {
        at = pos.getRowIndex();
    }

    var row = table.nodes.get(at);
    // Update table by removing the row
    if (pos.getHeight() > 1) {
        editor.removeNodeByKey(row.key);
    }
    // If last remaining row, clear it instead
    else {
            editor.withoutNormalizing(function () {
                row.nodes.forEach(function (cell) {
                    // remove all children of cells
                    // the schema will create an empty child content block in each cell
                    cell.nodes.forEach(function (node) {
                        editor.removeNodeByKey(node.key);
                    });
                });
            });
        }

    return editor;
}

module.exports = removeRow;