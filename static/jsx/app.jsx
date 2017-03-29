import React from "react";
import ReactDOM from "react-dom";

import SplitPane from 'react-split-pane';
import {Container, Grid, Sidebar, Menu, Image} from "semantic-ui-react";

import ParametersBox from "./parametersBox.jsx";
import ModelOutputBox from "./modelOutputBox.jsx";
import ConsoleOutputBox from "./consoleOutputBox.jsx";

//import "react-split-panel/dist/splitPanel.css";
import "../css/styles.css";

class Application extends React.Component {
    constructor() {
        super();

        this.state = {
            consoleOutput: [],
            plotList: [],

            sessionId: null,
            username: null,

            size: "20vw"
        };

        this.onModelsMetadataFetch = this.onModelsMetadataFetch.bind(this);
        this.onSessionSelect = this.onSessionSelect.bind(this);

        this.onPlotsFetch = this.onPlotsFetch.bind(this);
        this.onModelOutput = this.onModelOutput.bind(this);
    }

    onModelOutput(consoleOutput, plots) {
        this.setState({
            consoleOutput: consoleOutput,
            plotList: plots
        });
    }

    onModelsMetadataFetch(username) {
        this.setState({username: username});
    }

    onSessionSelect(sessionId) {
        this.setState({sessionId: sessionId});
    }

    onPlotsFetch(plots) {
        this.setState({plotList: plots});
    }

	render() {
        const {username, sessionId} = this.state;

        const applicationStyle = {
            flexDirection: "column",
            display: "flex",

            minHeight: "100vh",
            height: "100vh"
        };

        const logoStyle = {
            height: "100%",
            width: "13em"
        };

		return (
            <div className="flex-container" style={applicationStyle}>
				<Menu size="large" style={{margin: 0, borderTop: 0, borderLeft: 0, borderRight: 0}}>
					<Menu.Item header style={{padding: 0}}>
                        <img src="/static/images/logo.png" style={logoStyle}/>
                    </Menu.Item>
				</Menu>

                <Sidebar.Pushable>
                    <Sidebar visible={true}>
                        <ParametersBox sessionId={sessionId} selectSession={this.onSessionSelect}
                            returnModelOutput={this.onModelOutput} fetchPlots={this.onPlotsFetch}
                            updateUsername={this.onModelsMetadataFetch}/>
                    </Sidebar>

                    <Sidebar.Pusher>
                        <SplitPane split="horizontal" size={"70%"}>
                            <ModelOutputBox username={username} sessionId={sessionId}
                                plotList={this.state.plotList}/>
                            <ConsoleOutputBox output={this.state.consoleOutput}/>
                        </SplitPane>
                    </Sidebar.Pusher>
                </Sidebar.Pushable>
            </div>
		);
	}
}

ReactDOM.render(<Application/>, document.getElementById("application"));

