import React from "react";
import ReactDOM from "react-dom";

import {Grid, Header, Dropdown} from "semantic-ui-react";

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
			<div style={{width: "100%"}}>
				<Header block>
                    <Grid columns={2} style={{fontSize: "1.2em", lineHeight: "1.2em"}}>
                        <Grid.Column width={3} floated="left">
                            Model Output
                        </Grid.Column>

                        <Grid.Column width={5} floated="right" style={{padding: "0.8em"}}>
                            <Dropdown selection fluid placeholder="Select plot"
                                disabled={plotOptions.length <= 0}
                                onChange={this.changePlotIndex}
                                options={plotOptions}/>
                                </Grid.Column>
                    </Grid>
				</Header>

                {this.state.plotIdx != null &&
                    <object data={plotPath} style={plotStyle}> {plotName} </object>
                }
			</div>
		);
	}
}

export default ModelOutputBox;

