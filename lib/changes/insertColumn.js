const TablePosition = require('../TablePosition');
const moveSelection = require('./moveSelection');
const createCell = require('../createCell');
const getMergeCentre = require('../getMergeCentre');

/**
 * Insert a new column in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @return {Slate.Editor}
 */
function insertColumn(opts, editor, at) {
    const { value } = editor;
    const { startBlock, document } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    if (typeof at === 'undefined') {
        at = pos.getColumnIndex() + (pos.cell.data.get('colspan') || 1);
    }

    const newCells = [];
    const initialMergeCells = [];
    const column = table.nodes.map((row) => row.nodes.get(at));

    table.nodes.forEach((rowNode, index) => {
        const node = rowNode.nodes.get(at);
        let newCell = createCell(opts);
        if (node) {
            const isMerged = node.data.get('isMerged');
            const mergeDirection = node.data.get('mergeDirection');
            const mergeCentre = node.data.get('mergeCentre') || getMergeCentre({mergeDirection, table, columnIndex: at, rowIndex: index});


            if (isMerged) {
                if ((mergeDirection.right || mergeDirection === 'right') && rowNode.nodes.find(rowCell => rowCell.key === mergeCentre)) {
                    const selectedCell = document.getNode(mergeCentre);
                    if (selectedCell && selectedCell.data.get('colspan') > 1) {
                        initialMergeCells.push(selectedCell);
                    }
                }
                let addMergedCell = false;

                if (mergeDirection) {
                    if ((mergeDirection.right || mergeDirection === 'right') && !(mergeDirection.down || mergeDirection === 'down') && rowNode.nodes.find(rowCell => rowCell.key === mergeCentre)) {
                        addMergedCell = true;
                    } else if ((mergeDirection.right || mergeDirection === 'right') && (mergeDirection.down || mergeDirection === 'down') && !column.find(cell => cell.key === mergeCentre)) {
                        addMergedCell = true;
                    }
                }

                if (addMergedCell) {
                    newCell = newCell.setIn(['data', 'isMerged'], isMerged);
                    newCell = newCell.setIn(['data', 'mergeDirection'], mergeDirection);
                }
            }
        }
        newCells.push({ rowKey: rowNode.key, newCell });
    });

    // Insert the new cell
    editor.withoutNormalizing(() => {
        newCells.forEach((item) =>{
            editor.insertNodeByKey(item.rowKey, at, item.newCell);
        });
        initialMergeCells.forEach((cell) => {
            const initialMergeCellData = cell.data.toJSON();
            initialMergeCellData.colspan = initialMergeCellData.colspan + 1;
            editor.setNodeByKey(cell.key, { data: initialMergeCellData });
        });
    });

    // Update the selection (not doing can break the undo)
    return moveSelection(
        opts,
        editor,
        pos.getColumnIndex() + 1,
        pos.getRowIndex()
    );
}

module.exports = insertColumn;
