const insertTable     = require('./changes/insertTable');
const insertTableByKey  = require('./changes/insertTableByKey');
const insertTableByPath = require('./changes/insertTableByPath');
const insertRow       = require('./changes/insertRow');
const removeRow       = require('./changes/removeRow');
const insertColumn    = require('./changes/insertColumn');
const removeColumn    = require('./changes/removeColumn');
const removeTable     = require('./changes/removeTable');
const moveTableSelection   = require('./changes/moveSelection');
const moveTableSelectionBy = require('./changes/moveSelectionBy');
const toggleTableHeaders   = require('./changes/toggleHeaders');
const mergeCell = require('./changes/mergeCell');
const unmergeCell = require('./changes/unmergeCell');

const TablePosition = require('./TablePosition');
const onTab       = require('./onTab');
const onUpDown    = require('./onUpDown');
const makeSchema  = require('./makeSchema');
const makeRenderers = require('./defaultRenderers');
const makeSerializerRules = require('./defaultSerializers');

const KEY_TAB       = 'Tab';
const KEY_DOWN      = 'ArrowUp';
const KEY_UP        = 'ArrowDown';

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
        if (!editor.value) return false;
        const { startBlock } = editor.value;
        if (!startBlock) return false;

        return TablePosition.isInCell(editor.value, startBlock, opts);
    }

    /**
   * Bind an editor command to our instance options as first arg
   */
    function bindEditor(fn) {
        return function(editor, ...args) {
            if (!isSelectionInTable(editor)) {
                return editor;
            }

            return fn(...[opts, editor].concat(args));
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
        const args = [event, editor, opts];

        switch (event.key) {
        case KEY_TAB:
            return onTab(...args);
        case KEY_DOWN:
        case KEY_UP:
            return onUpDown(...args);
        }
        return next();
    }

    const { schema, normalizeNode } = makeSchema(opts);
    const renderBlock = makeRenderers(opts);

    function getPosition(editor) {
        if (!TablePosition.isInCell(editor.value, editor.value.startBlock, opts)) {
            return null;
        }
        return TablePosition.create(editor.value, editor.value.startBlock, opts);
    }

    function canMergeRight(editor) {
        if (!isSelectionInTable(editor)) {
            return false;
        }
        const { value } = editor;
        const { startBlock } = value;

        if (value && startBlock) {
            const pos = TablePosition.create(value, startBlock, opts);
            const { table } = pos;

            const selectedCell = table.nodes
                .get(pos.getRowIndex())
                .nodes.get(pos.getColumnIndex());

            const span = selectedCell.data.get('colspan') || 1;

            const cellToMerge = table.nodes
                .get(pos.getRowIndex())
                .nodes.get(pos.getColumnIndex() + span);

            if (
                cellToMerge &&
            !cellToMerge.data.get('isMerged') &&
            ((!cellToMerge.data.get('rowspan') || cellToMerge.data.get('rowspan') === 1) &&
                (!selectedCell.data.get('rowspan') || selectedCell.data.get('rowspan') === 1))
            ) {
                return true;
            }
        }
        return false;
    }

    function canMergeDown(editor) {
        if (!isSelectionInTable(editor)) {
            return false;
        }
        const { value } = editor;
        const { startBlock } = value;

        if (value && startBlock) {
            const pos = TablePosition.create(value, startBlock, opts);
            const { table } = pos;
            const isHeadless = table.data.get('headless') || true;
            if (!isHeadless) return false;
            const selectedCell = table.nodes
                .get(pos.getRowIndex())
                .nodes.get(pos.getColumnIndex());

            const span = selectedCell.data.get('rowspan') || 1;
            const rowToMerge = table.nodes.get(pos.getRowIndex() + span);

            if (rowToMerge) {
                const cellToMerge = rowToMerge.nodes.get(pos.getColumnIndex());
                if (
                    cellToMerge &&
              !cellToMerge.data.get('isMerged') &&
              ((!cellToMerge.data.get('colspan') || cellToMerge.data.get('colspan') === 1) &&
                (!selectedCell.data.get('colspan') ||
                selectedCell.data.get('colspan') === 1))
                ) {
                    return true;
                }
            }
        }
        return false;
    }

    function canUnMerge(editor) {
        if (!isSelectionInTable(editor)) {
            return false;
        }
        const { value } = editor;

        const { startBlock } = value;

        if (value && startBlock) {
            const pos = TablePosition.create(value, startBlock, opts);
            const { table } = pos;
            const selectedCell = table.nodes
                .get(pos.getRowIndex())
                .nodes.get(pos.getColumnIndex());
            if (
                selectedCell.data.get('rowspan') > 1 ||
            selectedCell.data.get('colspan') > 1
            )
                return true;
        }
        return false;
    }

    return {
        onKeyDown,
        schema,
        normalizeNode,
        renderBlock,

        queries: {
            isSelectionInTable,
            getTablePosition: getPosition,
            canMergeRight,
            canMergeDown,
            canUnMerge
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
