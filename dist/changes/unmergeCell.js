'use strict';

var TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

function unmergeCell(opts, editor) {
    var value = editor.value;
    var startBlock = value.startBlock;

    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
    var colSpan = firstCell.data.get('colspan') || 1;
    var rowSpan = firstCell.data.get('rowspan') || 1;

    editor.withoutNormalizing(function () {
        for (var rowCount = 0; rowCount < rowSpan; rowCount += 1) {
            for (var columnCount = 0; columnCount < colSpan; columnCount += 1) {

                var cell = table.nodes.get(pos.getRowIndex() + rowCount).nodes.get(pos.getColumnIndex() + columnCount);

                var data = cell.data.toJSON();
                delete data.isMerged;
                delete data.colspan;
                delete data.rowspan;
                delete data.mergeDirection;
                editor.setNodeByKey(cell.key, {
                    data: data
                });
            }
        }
        editor.focus();
    });

    return editor;
}

module.exports = unmergeCell;