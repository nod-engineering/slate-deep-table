const TablePosition = require('../TablePosition');
const moveSelection = require('./moveSelection');
const createCell = require('../createCell');
const { getMergeCentre, getMergeCentreByPath } = require('../getMergeCentre');

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
    const { startBlock } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    if (typeof at === 'undefined') {
        at = pos.getColumnIndex() + (pos.cell.data.get('colspan') || 1);
    }

    const newCells = [];
    const initialMergeCentre = [];

    const column = table.nodes.map((row) => row.nodes.get(at));

    table.nodes.forEach((rowNode, index) => {
        const node = rowNode.nodes.get(at);
        let newCell = createCell(opts);
        if (node) {
            const isMerged = node.data.get('isMerged');
            if (isMerged) {
                const mergeDirection = node.data.get('mergeDirection');
                const mergeCentrePath = node.data.get('mergeCentre') || getMergeCentre({mergeDirection, table, columnIndex: at, rowIndex: index});
                const {mergeCentreNode, mergeCentreNodePath} = getMergeCentreByPath({path: mergeCentrePath, table, cellPosition: { x: at, y: index } });
                if ((mergeDirection.right || mergeDirection === 'right') && mergeCentreNode && rowNode.nodes.find(rowCell => rowCell.key === mergeCentreNode.key)) {
                    if (mergeCentreNode && mergeCentreNode.data.get('colspan') > 1) {
                        initialMergeCentre.push({ mergeCentreNode, mergeCentreNodePath });
                    }
                }
                let addMergedCell = false;

                if (mergeDirection && mergeCentreNode) {
                    if ((mergeDirection.right || mergeDirection === 'right') && !(mergeDirection.down || mergeDirection === 'down') && rowNode.nodes.find(rowCell => rowCell.key === mergeCentreNode.key)) {
                        addMergedCell = true;
                    } else if ((mergeDirection.right || mergeDirection === 'right') && (mergeDirection.down || mergeDirection === 'down') && !column.find(cell => cell.key === mergeCentreNode.key)) {
                        addMergedCell = true;
                    }
                }
                if (addMergedCell) {
                    newCell = newCell.setIn(['data', 'isMerged'], isMerged);
                    newCell = newCell.setIn(['data', 'mergeDirection'], mergeDirection);
                    newCell = newCell.setIn(['data', 'mergeCentre'], mergeCentrePath);
                }
            }
        }
        newCells.push({ rowKey: rowNode.key, newCell });
    });

    // Insert the new cell
    editor.withoutNormalizing(() => {
        if (initialMergeCentre.length > 0) {
            initialMergeCentre.forEach(({mergeCentreNode, mergeCentreNodePath}) => {
                const initialMergeCellData = mergeCentreNode.data.toJSON();
                for (let rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                    for (let columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                        if (!(rowIndex === 0 && columnIndex === 0) && ((mergeCentreNodePath.x + columnIndex) >= at)) {
                            const cell = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                            const cellData = cell.data.toJSON();
                            cellData.mergeCentre = {
                                x: columnIndex + 1,
                                y: rowIndex
                            };
                            editor.setNodeByKey(cell.key, { data: cellData });
                        }
                    }
                }
                initialMergeCellData.colspan = initialMergeCellData.colspan + 1;
                editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
            });
        }
        newCells.forEach((item) =>{
            editor.insertNodeByKey(item.rowKey, at, item.newCell);
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
