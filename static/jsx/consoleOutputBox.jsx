import React from "react";
import ReactDOM from "react-dom"

import {Header, Container, Menu} from "semantic-ui-react"

class ConsoleOutputBox extends React.Component {
	constructor() {
		super();

		this.state = {
			consoleOutput: null
		}
	}

	componentDidMount() {
		let consoleOutputStream = new XMLHttpRequest("/output_stream/");

		consoleOutputStream.addEventListener("error", error => {
			console.log(error);
		});

		consoleOutputStream.addEventListener("console_output", message => {
			this.setState({consoleOutput: JSON.parse(message.data)});
		});
	}

	render() {
		return (
			<div style={{"width": "100%", "marginTop": "1px", "marginLeft": "-1px"}}>
				<Header dividing block>
					Console output
				</Header>
			</div>
		);
	}
}

export {ConsoleOutputBox};

