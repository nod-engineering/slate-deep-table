const createRow = require('../createRow');
const TablePosition = require('../TablePosition');
const { getMergeCentre, getMergeCentreByPath } = require('../getMergeCentre');

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
    const { startBlock } = value;

    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;

    // Create a new row with the right count of cells
    const firstRow = table.nodes.get(0);
    let newRow = createRow(opts, firstRow.nodes.size, textGetter);

    if (typeof at === 'undefined') {
        at = pos.getRowIndex() + (pos.cell.data.get('rowspan') || 1);
    }

    const initialMergeCentre = [];

    const nextRow = table.nodes.get(at);
    if (nextRow) {
        nextRow.nodes.forEach((node, index) => {
            const isMerged = node.data.get('isMerged');
            if (isMerged) {
                const mergeDirection = node.data.get('mergeDirection') || {};
                const mergeCentrePath = node.data.get('mergeCentre') || getMergeCentre({mergeDirection, table, columnIndex: index, rowIndex: at});
                const {mergeCentreNode, mergeCentreNodePath} = getMergeCentreByPath({path: mergeCentrePath, table, cellPosition: { x: index, y: at } });

                if (mergeCentreNode && mergeDirection.down || mergeDirection === 'down') {
                    const row = nextRow.nodes;
                    if (!row.find(rowNode => rowNode.key === mergeCentreNode.key)) {

                        if (mergeCentreNode && mergeCentreNode.data.get('rowspan') > 1) {
                            initialMergeCentre.push({ mergeCentreNode, mergeCentreNodePath });
                        }
                    }

                }

                let addMergedCell = true;

                if (mergeDirection.right || mergeDirection === 'right') {
                    const row = nextRow.nodes;
                    if (mergeCentreNode && row.find(rowNode => rowNode.key === mergeCentreNode.key)) {
                        addMergedCell = false;
                    }
                }

                if (addMergedCell) {
                    newRow = newRow.setIn(['nodes', index, 'data', 'isMerged'], isMerged);
                    newRow = newRow.setIn(
                        ['nodes', index, 'data', 'mergeDirection'],
                        mergeDirection
                    );
                    newRow = newRow.setIn(
                        ['nodes', index, 'data', 'mergeCentre'], mergeCentrePath
                    );

                }
            }
        });
    }

    return editor.withoutNormalizing(() => {
        if (initialMergeCentre.length > 0) {
            initialMergeCentre.forEach(({mergeCentreNode, mergeCentreNodePath}) => {
                const initialMergeCellData = mergeCentreNode.data.toJSON();
                for (let rowIndex = 0; rowIndex < initialMergeCellData.rowspan || 0; rowIndex += 1) {
                    for (let columnIndex = 0; columnIndex < initialMergeCellData.colspan || 0; columnIndex += 1) {
                        if (!(rowIndex === 0 && columnIndex === 0) && ((mergeCentreNodePath.y + rowIndex) >= at)) {
                            const cell = table.nodes.get(mergeCentreNodePath.y + rowIndex).nodes.get(mergeCentreNodePath.x + columnIndex);
                            const cellData = cell.data.toJSON();
                            cellData.mergeCentre = {
                                x: columnIndex,
                                y: rowIndex + 1
                            };
                            editor.setNodeByKey(cell.key, { data: cellData });
                        }
                    }
                }
                initialMergeCellData.rowspan = initialMergeCellData.rowspan + 1;
                editor.setNodeByKey(mergeCentreNode.key, { data: initialMergeCellData });
            });
        }
        editor
            .insertNodeByKey(table.key, at, newRow)
            .moveToEndOfNode(newRow.nodes.get(pos.getColumnIndex()))
            .focus();
    });
}

module.exports = insertRow;
