'use strict';

var TablePosition = require('../TablePosition');

/**
 * Toggles table headers on / off
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @return {Slate.Editor}
 */
function toggleHeaders(opts, editor) {
    var value = editor.value;
    var startBlock = value.startBlock;


    var pos = TablePosition.create(value, startBlock, opts);
    var table = pos.table;


    var currentSetting = !!table.get('data').get('headless');

    editor.setNodeByKey(table.key, {
        data: {
            headless: !currentSetting
        }
    });

    return editor;
}

module.exports = toggleHeaders;