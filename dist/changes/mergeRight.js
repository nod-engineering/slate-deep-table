'use strict';

var createRow = require('../createRow');
var Slate = require("slate");
var TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @param {Function} textGetter
 * @return {Slate.Editor}
 */
function mergeRight(opts, editor) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    var colspan = firstCell.data.get('colspan') || 1;
    var nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + colspan);

    if (nextCell) {
        var paragraphs = nextCell.nodes.map(function (node) {
            return Slate.Block.fromJSON(node.toJSON());
        });

        if (nextCell.type === 'table_cell') {
            // use constant

            for (var i = 0; i < paragraphs.size; i++) {
                editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
            }

            var firstCellData = Object.assign({ data: { 'colspan': colspan + 1 } }, firstCell.data.toJSON());
            var nextCellData = Object.assign({ data: { 'display': 'none' } }, nextCell.data.toJSON());

            editor.setNodeByKey(firstCell.key, firstCellData).setNodeByKey(nextCell.key, nextCellData);
        }
    }

    return editor;
}

module.exports = mergeRight;