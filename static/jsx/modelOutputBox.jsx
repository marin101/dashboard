import React from "react";
import ReactDOM from "react-dom";

import {Header, Dropdown} from "semantic-ui-react"

class ModelOutputBox extends React.Component {
    constructor() {
        super();

        this.state = {
            plotIdx: null
        };

        this.changePlotIndex = this.changePlotIndex.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps != this.props.plotList) {
            this.setState({plotIdx: null});
        }
    }

    changePlotIndex(e, data) {
        this.setState({plotIdx: data.value});
    }

	render() {
        const plotStyle = {
            height: "100%",
            width: "100%"
        };

        const {username, sessionId} = this.props;
        const plotName = this.props.plotList[this.state.plotIdx] + ".html"
        const plotPath = "/static/users/" + username + '/' + sessionId + '/' + plotName;

        const plotOptions = this.props.plotList.map((plotName, idx) => ({
            key: idx, text: plotName, value: idx
        }));

		return (
			<div style={{width: "100%", maringTop: "3em", marginLeft: "-1px"}}>
				<Header dividing block style={{display: "flex"}}>
                    <div style={{flex: 1}}>
					    Model Output
                    </div>

                    <Dropdown selection placeholder="Select plot" options={plotOptions}
                        disabled={plotOptions.length <= 0} style={{flex: 1}}
                        onChange={this.changePlotIndex}/>
				</Header>

                {this.state.plotIdx != null &&
                    <object data={plotPath} style={plotStyle}> {plotName} </object>
                }
			</div>
		);
	}
}

export default ModelOutputBox;

