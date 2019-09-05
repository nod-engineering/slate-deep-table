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
    var direction = mergeOptions.direction;


    if (isHeadless || !isHeadless && pos.getRowIndex() > 0 || direction === directions.right) {

        var spanAttribute = direction === directions.right ? spanTypes.colSpan : spanTypes.rowSpan;
        var firstCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex());
        var span = firstCell.data.get(spanAttribute) || 1;
        var nextCell = null;
        var numCellsIsEqual = true;
        var thisRow = table.nodes.get(pos.getRowIndex());
        var nextRow = table.nodes.get(pos.getRowIndex() + span);

        if (direction === directions.down) {
            if (nextRow) {

                nextCell = nextRow.nodes.get(pos.getColumnIndex());
            }
        } else {
            nextCell = table.nodes.get(pos.getRowIndex()).nodes.get(pos.getColumnIndex() + span);
        }

        if (nextCell && nextCell.type === opts.typeCell) {

            if (direction === direction.down) {} else {
                numCellsIsEqual = firstCell.data.get(spanTypes.rowSpan) === nextCell.data.get(spanTypes.rowSpan);
            }

            if (numCellsIsEqual) {
                var paragraphs = nextCell.nodes.map(function (node) {
                    return Slate.Block.fromJSON(node.toJSON());
                });

                for (var i = 0; i < paragraphs.size; i++) {
                    editor.insertNodeByKey(firstCell.key, firstCell.nodes.size + i, paragraphs.get(i));
                }

                var firstCellData = firstCell.data.toJSON();
                firstCellData['' + spanAttribute] = span + 1;

                var nextCellData = Object.assign({ data: { 'display': 'none', mergeDirection: direction } }, nextCell.data.toJSON());

                editor.setNodeByKey(firstCell.key, { data: firstCellData }).setNodeByKey(nextCell.key, nextCellData);

                if (nextRow.nodes.count(function (node) {
                    return node.data.get('display') !== 'none';
                }) === 0) {
                    editor.removeNodeByKey(nextRow.key);
                }
            }
        }
    }

    return editor;
}

module.exports = mergeCell;