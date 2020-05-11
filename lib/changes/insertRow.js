const createRow = require('../createRow');
const TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param {Number} at
 * @param {Function} textGetter
 * @return {Slate.Editor}
 */
function insertRow(opts, editor, at, textGetter) {
    const { value } = editor;
    const { startBlock, document } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    // Create a new row with the right count of cells
    const firstRow = table.nodes.get(0);
    let newRow = createRow(opts, firstRow.nodes.size, textGetter);

    if (typeof at === 'undefined') {
        at = pos.getRowIndex() + (pos.cell.data.get('rowspan') || 1);
    }

    const initialMergeCells = [];

    const nextRow = table.nodes.get(at);
    if (nextRow) {
        nextRow.nodes.forEach((node, index) => {
            const isMerged = node.data.get('isMerged');
            const mergeDirection = node.data.get('mergeDirection');
            const mergeCentre = node.data.get('mergeCentre');

            if (isMerged) {
                if (mergeDirection.down) {
                    const row = nextRow.nodes;
                    if (!row.find(rowNode => rowNode.key === mergeCentre)) {
                        const selectedCell = document.getNode(mergeCentre);

                        if (selectedCell && selectedCell.data.get('rowspan') > 1) {
                            initialMergeCells.push(selectedCell);
                        }
                    }

                }

                let addMergedCell = true;

                if (mergeDirection.right) {
                    const row = nextRow.nodes;
                    if (row.find(rowNode => rowNode.key === mergeCentre)) {
                        addMergedCell = false;
                    }
                }

                if (addMergedCell) {
                    newRow = newRow.setIn(['nodes', index, 'data', 'isMerged'], isMerged);
                    newRow = newRow.setIn(
                        ['nodes', index, 'data', 'mergeDirection'],
                        mergeDirection
                    );
                }
            }
        });
    }

    return editor.withoutNormalizing(() => {
        editor
            .insertNodeByKey(table.key, at, newRow)
            .moveToEndOfNode(newRow.nodes.get(pos.getColumnIndex()));
        initialMergeCells.forEach((cell) => {
            const initialMergeCellData = cell.data.toJSON();
            initialMergeCellData.rowspan = initialMergeCellData.rowspan + 1;
            editor.setNodeByKey(cell.key, { data: initialMergeCellData });
        });
        editor.focus();
    });
}

module.exports = insertRow;
