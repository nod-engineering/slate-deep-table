'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var insertTable = require('./changes/insertTable');
var insertTableByKey = require('./changes/insertTableByKey');
var insertTableByPath = require('./changes/insertTableByPath');
var insertRow = require('./changes/insertRow');
var removeRow = require('./changes/removeRow');
var insertColumn = require('./changes/insertColumn');
var removeColumn = require('./changes/removeColumn');
var removeTable = require('./changes/removeTable');
var moveTableSelection = require('./changes/moveSelection');
var moveTableSelectionBy = require('./changes/moveSelectionBy');
var toggleTableHeaders = require('./changes/toggleHeaders');
var mergeCell = require('./changes/mergeCell');
var unmergeCell = require('./changes/unmergeCell');

var TablePosition = require('./TablePosition');
var onTab = require('./onTab');
var onUpDown = require('./onUpDown');
var makeSchema = require('./makeSchema');
var makeRenderers = require('./defaultRenderers');
var makeSerializerRules = require('./defaultSerializers');

var KEY_TAB = 'Tab';
var KEY_DOWN = 'ArrowUp';
var KEY_UP = 'ArrowDown';

/**
 * @param {String} opts.typeTable The type of table blocks
 * @param {String} opts.typeRow The type of row blocks
 * @param {String} opts.typeCell The type of cell blocks
 * @param {String} opts.typeContent The type of default content blocks
 */
function EditTable(opts) {
    opts = opts || {};
    opts.typeTable = opts.typeTable || 'table';
    opts.typeRow = opts.typeRow || 'table_row';
    opts.typeCell = opts.typeCell || 'table_cell';
    opts.typeContent = opts.typeContent || 'paragraph';

    /**
     * Is the selection in a table
     */
    function isSelectionInTable(editor) {
        var startBlock = editor.value.startBlock;

        if (!startBlock) return false;

        return TablePosition.isInCell(editor.value, startBlock, opts);
    }

    /**
     * Bind an editor command to our instance options as first arg
     */
    function bindEditor(fn) {
        return function (editor) {
            if (!isSelectionInTable(editor)) {
                return editor;
            }

            for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
            }

            return fn.apply(undefined, _toConsumableArray([opts, editor].concat(args)));
        };
    }

    /**
     * User is pressing a key in the editor
     */
    function onKeyDown(event, editor, next) {
        // Only handle events in cells
        if (!isSelectionInTable(editor)) {
            return next();
        }

        // Build arguments list
        var args = [event, editor, opts];

        switch (event.key) {
            case KEY_TAB:
                return onTab.apply(undefined, args);
            case KEY_DOWN:
            case KEY_UP:
                return onUpDown.apply(undefined, args);
        }
        return next();
    }

    var _makeSchema = makeSchema(opts),
        schema = _makeSchema.schema,
        normalizeNode = _makeSchema.normalizeNode;

    var renderBlock = makeRenderers(opts);

    function getPosition(editor) {
        if (!TablePosition.isInCell(editor.value, editor.value.startBlock, opts)) {
            return null;
        }
        return TablePosition.create(editor.value, editor.value.startBlock, opts);
    }

    return {
        onKeyDown: onKeyDown,

        schema: schema,
        normalizeNode: normalizeNode,
        renderBlock: renderBlock,

        queries: {
            isSelectionInTable: isSelectionInTable,
            getTablePosition: getPosition
        },

        commands: {
            insertTable: insertTable.bind(null, opts),
            insertTableByKey: insertTableByKey.bind(null, opts),
            insertTableByPath: insertTableByPath.bind(null, opts),
            insertRow: bindEditor(insertRow),
            removeRow: bindEditor(removeRow),
            insertColumn: bindEditor(insertColumn),
            removeColumn: bindEditor(removeColumn),
            removeTable: bindEditor(removeTable),
            moveTableSelection: bindEditor(moveTableSelection),
            moveTableSelectionBy: bindEditor(moveTableSelectionBy),
            toggleTableHeaders: bindEditor(toggleTableHeaders),
            mergeCell: bindEditor(mergeCell),
            unmergeCell: bindEditor(unmergeCell)
        }
    };
}

// attach top-level function to create serializer rules
EditTable.makeSerializerRules = makeSerializerRules;

module.exports = EditTable;