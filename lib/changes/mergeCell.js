const Slate = require('slate');
const TablePosition = require('../TablePosition');

/**
 * Insert a new row in current table
 *
 * @param {Object} opts
 * @param {Slate.Editor} editor
 * @param  {Object} mergeOptions
 * @return {Slate.Editor}
 */

const directions = {
    down: 'down',
    right: 'right'
};

const getNodeContentsAsBlocks = (node) =>
    [].concat(
        ...node.nodes.map((innerNode) => {
            return Slate.Block.fromJSON(innerNode.toJSON());
        })
    );

const createMergeDirection = (currentMergeDirection, additionalMerge) => {
    const updatedMerge = {[additionalMerge]: true};
    if (currentMergeDirection === 'right' || (currentMergeDirection && currentMergeDirection.right)) {
        updatedMerge.right = true;
    }
    if (currentMergeDirection === 'down' || (currentMergeDirection && currentMergeDirection.down)) {
        updatedMerge.down = true;
    }
    return updatedMerge;
};

function mergeCell(opts, editor, mergeOptions) {
    const { value } = editor;
    const { startBlock } = value;
    const pos = TablePosition.create(value, startBlock, opts);
    const { table } = pos;
    const isHeadless = table.data.get('headless');
    const { direction } = mergeOptions;

    if (
        isHeadless ||
    (!isHeadless && pos.getRowIndex() >= 0)
    ) {
        const currentCellRowIndex = pos.getRowIndex();
        const currentCellColumnIndex = pos.getColumnIndex();

        const currentCell = table.nodes
            .get(currentCellRowIndex)
            .nodes.get(currentCellColumnIndex);
        let rowSpan = currentCell.data.get('rowspan') || 1;
        let colSpan = currentCell.data.get('colspan') || 1;


        const nextCells = [];

        if (direction === directions.down) {
            const firstCell = table.nodes
                .get(currentCellRowIndex + rowSpan)
                .nodes.get(currentCellColumnIndex);
            const firstCellRowSpan = firstCell.data.get('rowspan') || 1;
            const firstCellColSpan = firstCell.data.get('colspan') || 1;

            rowSpan += firstCellRowSpan;

            if (firstCellColSpan > 1) {
                for (let rowCount = 0; rowCount < rowSpan; rowCount += 1) {
                    for (
                        let columnCount = 0;
                        columnCount < firstCellColSpan;
                        columnCount += 1
                    ) {
                        if (!(rowCount === 0 && columnCount === 0)) {
                            const nextCell = table.nodes
                                .get(currentCellRowIndex + rowCount)
                                .nodes.get(currentCellColumnIndex + columnCount);
                            if (nextCell)
                                nextCells.push({ cell: nextCell, path: { x: columnCount, y: rowCount } });
                        }
                    }
                }
            } else {
                nextCells.push({ cell: firstCell, path: { x: 0, y: rowSpan - 1 } });
            }
        } else {
            const firstCell = table.nodes
                .get(currentCellRowIndex)
                .nodes.get(currentCellColumnIndex + colSpan);
            const firstCellRowSpan = firstCell.data.get('rowspan') || 1;
            const firstCellColSpan = firstCell.data.get('colspan') || 1;

            colSpan += firstCellColSpan;

            if (firstCellRowSpan > 1) {
                for (let rowCount = 0; rowCount < firstCellRowSpan; rowCount += 1) {
                    for (let columnCount = 0; columnCount < colSpan; columnCount += 1) {
                        if (!(rowCount === 0 && columnCount === 0)) {
                            const nextCell = table.nodes
                                .get(currentCellRowIndex + rowCount)
                                .nodes.get(currentCellColumnIndex + columnCount);

                            if (nextCell)
                                nextCells.push({ cell: nextCell, path: { x: columnCount, y: rowCount }});
                        }
                    }
                }
            } else {
                nextCells.push({ cell: firstCell, path: { x: colSpan - 1, y: 0 } });
            }
        }

        if (
            nextCells.length > 0 &&
      nextCells.every(({ cell }) => cell.type === opts.typeCell)
        ) {
            const contents = nextCells.filter(({ cell }) => cell.text !== '').map(({ cell }) =>
                getNodeContentsAsBlocks(cell)
            );

            const cellContents = [].concat(...contents);
            editor.withoutNormalizing(() =>
            {
                for (let i = 0; i < cellContents.length; i++) {
                    editor.insertNodeByKey(
                        currentCell.key,
                        currentCell.nodes.size + i,
                        cellContents[i]
                    );
                }
            });

            editor.withoutNormalizing(() =>
                nextCells.forEach(({cell}) =>
                    cell.nodes.forEach((node) =>
                        editor.removeNodeByKey(node.key)
                    )
                )
            );

            const firstCellData = currentCell.data.toJSON();
            firstCellData['rowspan'] = rowSpan;
            firstCellData['colspan'] = colSpan;
            firstCellData['mergeDirection'] = createMergeDirection(firstCellData.mergeDirection, direction);

            editor.setNodeByKey(currentCell.key, { data: firstCellData });

            editor.withoutNormalizing(() => {
                nextCells.forEach(({cell, path}) => {
                    const nextCellData = cell.data.toJSON();
                    delete nextCellData.colspan;
                    delete nextCellData.rowspan;
                    nextCellData['mergeCentre'] = path;
                    nextCellData['isMerged'] = true;
                    nextCellData['mergeDirection'] = createMergeDirection(nextCellData.mergeDirection, direction);
                    editor.setNodeByKey(cell.key, { data: nextCellData });
                });
                editor.focus();
            });
        }
    }

    return editor;
}

module.exports = mergeCell;
