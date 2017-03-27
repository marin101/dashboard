import React from "react";
import ReactDOM from "react-dom";

import {Header} from "semantic-ui-react"

class ModelOutputBox extends React.Component {
	render() {
		return (
			<div style={{height: "100%", width: "100%", maringTop: "1px", marginLeft: "-1px"}}>
				<Header dividing block>
					Model Output
				</Header>

                {/*<object data="/static/graf.html" style={{width: "100%", height: "100%"}}> Kita </object>*/}
			</div>
		);
	}
}

export default ModelOutputBox;

