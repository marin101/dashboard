import React from "react"
import ReactDOM from "react-dom"

import SplitPane from 'react-split-pane'
import {Container, Grid, Menu, Image} from "semantic-ui-react"

import {ParametersBox} from "./parametersBox.jsx"
import {ModelOutputBox} from "./modelOutputBox.jsx"
import {ConsoleOutputBox} from "./consoleOutputBox.jsx"

import "../css/styles.css"

class Prototype extends React.Component {
    constructor() {
        super();

        this.state = {
            modelOutput: null
        };

        this.onModelOutput = this.onModelOutput.bind(this);
    }

    onModelOutput(output) {
        this.setState({modelOutput: output});
    }

	render() {
		return (
			<Container fluid style={{"height": "100%", "overflow": "hidden"}}>
				<Menu fixed="top">
					<Menu.Item header> Analytical wizards </Menu.Item>
				</Menu>

				<SplitPane split="vertical" defaultSize="20%" maxSize="98%" style={{"marginTop":"3em"}}>
					<ParametersBox returnModelOutput={this.onModelOutput}/>

					<SplitPane split="horizontal" primary="second" defaultSize="35%" maxSize="98%">
						<ModelOutputBox/>
						<ConsoleOutputBox output={this.state.modelOutput}/>
					</SplitPane>
				</SplitPane>
			</Container>
		);
	}
}

ReactDOM.render(<Prototype/>, document.getElementById("application"));

