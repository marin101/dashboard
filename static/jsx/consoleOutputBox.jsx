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
        let idx = 0;

		return (
			<div style={{"width": "100%", "marginTop": "1px", "marginLeft": "-1px",
                "overflow": "auto"}}>

				<Header dividing block>
					Console output
				</Header>

                {this.props.output.map(line =>
                    <div key={idx++}>
                        {line} <br/>
                    </div>
                )}
			</div>
		);
	}
}

export {ConsoleOutputBox};

