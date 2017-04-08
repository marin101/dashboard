import React from "react";
import ReactDOM from "react-dom";

import {Grid, Header, Dropdown} from "semantic-ui-react";

class ModelOutputBox extends React.PureComponent {
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

        let plotName, plotPath;
        if (this.state.plotIdx != null) {
            plotName = this.props.plotList[this.state.plotIdx].name;
            plotPath = this.props.plotList[this.state.plotIdx].path
        }

        const plotOptions = this.props.plotList.map((plot, idx) => ({
            key: idx, text: plot.name, value: idx
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
                    <object data={plotPath} style={plotStyle}>
                        {plotName}
                    </object>
                }
			</div>
		);
	}
}

export default ModelOutputBox;

