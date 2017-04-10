import React from "react";
import ReactDOM from "react-dom"

import {Header, Container, Menu} from "semantic-ui-react"

class ConsoleOutputBox extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			consoleOutput: props.consoleOutput
		}
	}

	render() {
        const {output=[]} = this.props;

		return (
			<div style={{"width": "100%", "overflow": "auto"}}>
                {output.map((line, idx) =>
                    <div key={idx} style={{"whiteSpace": "pre-wrap"}}>
                        {line} <br/>
                    </div>
                )}
			</div>
		);
	}
}

export default ConsoleOutputBox;

