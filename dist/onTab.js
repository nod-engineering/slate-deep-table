'use strict';

var TablePosition = require('./TablePosition');
var moveSelectionBy = require('./changes/moveSelectionBy');
var insertRow = require('./changes/insertRow');

/**
 * Select all text of current block.
 * @param {Slate.Editor} editor
 * @return {Slate.Editor}
 */
function selectAllText(editor) {
    var value = editor.value;
    var startBlock = value.startBlock;


    return editor.moveToRangeOfNode(startBlock);
}

/**
 * Pressing "Tab" moves the cursor to the next cell
 * and select the whole text
 */
function onTab(event, editor, opts) {
    var _editor = editor,
        value = _editor.value;

    event.preventDefault();
    var direction = event.shiftKey ? -1 : +1;

    // Create new row if needed
    var startBlock = value.startBlock;

    var pos = TablePosition.create(value, startBlock, opts);

    if (pos.isFirstCell() && direction === -1) {
        editor = insertRow(opts, editor, 0);
    } else if (pos.isLastCell() && direction === 1) {
        editor = insertRow(opts, editor);
    }

    // Move
    editor = moveSelectionBy(opts, editor, direction, 0);

    // Select all cell.
    return selectAllText(editor);
}

module.exports = onTab;