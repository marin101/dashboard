import React from "react";
import ReactDOM from "react-dom";

import {Header} from "semantic-ui-react"

class ModelOutputBox extends React.Component {
	constructor() {
		super();

		this.state = {
			modelOutput: null
		}
	}

	componentDidMount() {
		// TODO: Is output stream or one-time event???
		let modelOutputStream = new EventSource("/output_stream/");

		modelOutputStream.addEventListener("error", error => {
			console.log(error);
		});

		modelOutputStream.addEventListener("model_output", message => {
			this.setState({modelOutput: JSON.parse(message.data)});
		});
	}

	render() {
		return (
			<div style={{"width": "100%", "maringTop": "1px", "marginLeft": "-1px"}}>
				<Header dividing block>
					Model Output
				</Header>
			</div>
		);
	}
}

export default ModelOutputBox;

