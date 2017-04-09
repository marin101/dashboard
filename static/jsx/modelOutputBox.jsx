import React from "react";
import ReactDOM from "react-dom";

class ModelOutputBox extends React.PureComponent {
	render() {
        const plotStyle = {
            position: "absolute",
            margin: "-40px",
            zIndex: -1,

            height: "100%",
            width: "100%"

        };

		return (
			<div style={{width: "100%", height: "100%"}}>
                {this.props.plot != null &&
                    <object data={this.props.plot.path} style={plotStyle}>
                        {this.props.plot.name}
                    </object>
                }
			</div>
		);
	}
}

export default ModelOutputBox;

