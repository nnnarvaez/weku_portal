import React from 'react';
import {Link} from 'react-router';
import {connect} from 'react-redux';
import {browserHistory} from 'react-router';
import tt from 'counterpart';

class Topics extends React.Component {
    static propTypes = {
        categories: React.PropTypes.object.isRequired,
        order: React.PropTypes.string,
        current: React.PropTypes.string,
        className: React.PropTypes.string,
        compact: React.PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = {};
    }

    shouldComponentUpdate(nextProps, nextState) {
        const res = this.props.categories !== nextProps.categories ||
            this.props.current !== nextProps.current ||
            this.props.order !== nextProps.order || this.state !== nextState;
        return res;
    }

    render() {
        // console.log('Topics');
        const {
            props: {order, current, compact, className},
        } = this;
        let categories = this.props.categories.get('trending');
        categories = categories.take(50);

        const cn = 'Topics' + (className ? ` ${className}` : '');
        const currentValue = `/${order}/${current}`;

        if (compact) {
            return <select className={cn} onChange={(e) => browserHistory.push(e.target.value)} value={currentValue}>
                <option key={'*'} value={'/' + order}>{tt('g.topics')}...</option>
                {categories.map(cat => {
                    if (cat.indexOf('%') >= 0) return null; // filter out encodedURI
                    if (cat.indexOf('community-') >= 0) return null; // filter out community tag
                    const link = order ? `/${order}/${cat}` : `/${cat}`;
                    return <option key={cat} value={link}>{cat}</option>
                })}
            </select>;
        }

        categories = categories.map(cat => {
            if (cat.indexOf('%') >= 0) return null; // filter out encodedURI
            /*if (cat.indexOf('community-') >= 0) return null; // filter out community tag*/
            const link = order ? `/${order}/${cat}` : `/hot/${cat}`;
            return (<li key={cat}>
                <Link to={link} activeClassName="active">{cat}</Link>
            </li>);
        });
        return (
            <ul className={cn}>
                <li className="Topics__title" key={'*'}>{tt('g.tags_and_topics')}</li>
                <hr/>
                {/*<li><div id="google_translate_element"></div></li>*/}
                {categories}
                <li className="show-more">
                    <Link to={`/tags`}>{tt('g.show_more_topics')}..</Link>
                </li>
            </ul>
        );
    }
}

export default connect(state => ({
    categories: state.global.get('tag_idx')
}))(Topics);
