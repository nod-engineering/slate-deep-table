'use strict';

var createRow = require('../createRow');
var Slate = require("slate");
var TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

var spanTypes = {
    colSpan: 'colspan',
    rowSpan: 'rowspan'
};

var directions = {
    down: 'down',
    right: 'right'
};

function mergeCell(opts, editor, mergeOptions) {
    var value = editor.value;
    var startBlock = value.startBlock;

    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var isHeadless = table.data.get('headless');

    if (isHeadless || !isHeadless && pos.getRowIndex() > 0) {
        var direction = mergeOptions.direction;

        var spanAttribute = direction === directions.right ? spanTypes.colSpan : spanTypes.rowSpan;
        var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
        var span = firstCell.data.get(spanAttribute) || 1;
        var nextCell = null;

        if (direction === directions.down) {
            var nextRow = table.nodes.get(pos.getRowIndex() + span);

            if (nextRow) {
                nextCell = nextRow.nodes.get(pos.getColumnIndex());
            }
        } else {
            nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span);
        }

        if (nextCell && nextCell.type === opts.typeCell) {
            var paragraphs = nextCell.nodes.map(function (node) {
                return Slate.Block.fromJSON(node.toJSON());
            });

            for (var i = 0; i < paragraphs.size; i++) {
                editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
            }

            var firstCellData = firstCell.data.toJSON();
            firstCellData['' + spanAttribute] = span + 1;

            var nextCellData = Object.assign({ data: { 'display': 'none' } }, nextCell.data.toJSON());

            editor.setNodeByKey(firstCell.key, { data: firstCellData }).setNodeByKey(nextCell.key, nextCellData);
        }
    }

    return editor;
}

module.exports = mergeCell;