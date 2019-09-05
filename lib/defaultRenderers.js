const React = require('react');

/**
 * split rows into thead contens and body contents,
 * unless "headless" option is set
 */
const splitHeader = (props) => {
    const rows = props.children;
    console.log('props', props.node.toJSON());
    
    const header = !(props.node.get('data').get('headless'));

    if (!header || !rows || !rows.length || rows.length===1) {
        return {header: null, rows: rows};
    }
    return {
        header: rows[0],
        rows: rows.slice(1),
    };
}

/**
 * default renderers for easier use in your own schema
 * @param {Object} opts The same opts passed into plugin instance
 */
const makeRenderers = (opts = {}) => (props, editor, next) => {

    const colspan = props.node.data.get('colspan');
    const rowspan = props.node.data.get('rowspan');
    const display = props.node.data.get('display');

    if(colspan) props.attributes.colspan = colspan;
    if(rowspan) props.attributes.rowspan = rowspan;
    if(display && display === 'none') props.attributes.style = { display: 'none' };

    switch (props.node.type) {
        case 'paragraph':  return <p {...props.attributes}>{props.children}</p>;
        case 'heading':    return <h1 {...props.attributes}>{props.children}</h1>;
        case 'subheading': return <h2 {...props.attributes}>{props.children}</h2>;
        case opts.typeTable:
            const {header, rows} = splitHeader(props);
            return (
                <table>
                    {header &&
                        <thead {...props.attributes}>
                            {header}
                        </thead>
                    }
                    <tbody {...props.attributes}>
                        {rows}
                    </tbody>
                </table>
            );
        case opts.typeRow: return <tr {...props.attributes} >{props.children}</tr>;
        case opts.typeCell: return <td {...props.attributes} >{props.children}</td>;
        default: return next();
    }
}

module.exports = makeRenderers;