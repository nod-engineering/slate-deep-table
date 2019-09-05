'use strict';

var TablePosition = require('../TablePosition');

/**
 * Move selection to {x,y}
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} x
 * @param {Number} y
 * @return {Slate.Editor}
 */
function moveSelection(opts, editor, x, y) {
    var value = editor.value;
    var startBlock = value.startBlock;

    var startOffset = value.selection.start.offset;

    if (!TablePosition.isInCell(value, startBlock, opts)) {
        throw new Error('moveSelection can only be applied in a cell');
    }

    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var row = table.nodes.get(y);
    var cell = row.nodes.get(x);

    // Calculate new offset
    var cellTextLength = cell.text.length;
    if (startOffset > cellTextLength) {
        startOffset = cellTextLength;
    }

    return editor.moveTo(cell.getFirstText().key, startOffset);
}

module.exports = moveSelection;