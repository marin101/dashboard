import React from "react";
import ReactDOM from "react-dom";

import SplitPane from 'react-split-pane';
import {Grid, Menu, Image} from "semantic-ui-react";

import ParametersBox from "./parametersBox.jsx";
import ModelOutputBox from "./modelOutputBox.jsx";
import ConsoleOutputBox from "./consoleOutputBox.jsx";

//import "react-split-panel/dist/splitPanel.css";
import "../css/styles.css";

class Application extends React.Component {
    constructor() {
        super();

        this.state = {
            username: null,

            modelId: null,
            sessionId: null,

            view: 0,
            plotList: [],
            consoleOutput: []
        };

        this.storeModelOutput = this.storeModelOutput.bind(this);

        this.storeUsername = this.storeUsername.bind(this);
        this.storeModelId = this.storeModelId.bind(this);
        this.storeSessionId = this.storeSessionId.bind(this);

        this.storePlots= this.storePlots.bind(this);
        this.storeModelOutput = this.storeModelOutput.bind(this);
    }

    storeModelOutput(consoleOutput, plots) {
        this.setState({
            consoleOutput: consoleOutput,
            plotList: plots
        });
    }

    storeUsername(username) {
        this.setState({username: username});
    }

    storeSessionId(sessionId) {
        this.setState({sessionId: sessionId});
    }

    storePlots(plots) {
        this.setState({plotList: plots});
    }

    storeModelId(modelId) {
        this.setState({modelId: modelId});
    }

    setView(view) {
        this.setState({view: view});
    }

	render() {
        const {username, modelId, sessionId, plotList} = this.state;

        const applicationStyle = {
            flexDirection: "column",
            display: "flex",

            minHeight: "100vh",
            minWidth: "100vw",

            height: "100vh",
            width: "100vw"
        };

        const logoStyle = {
            height: "100%",
            width: "13em"
        };

        const gridColumnStyle = {
            padding: 0
        };

		return (
            <div style={applicationStyle}>
				<Menu size="large" style={{margin: 0, borderWidth: "0 0 1px 0"}}>
					<Menu.Item header style={{padding: 0}}>
                        <Image src="/static/images/logo.png"/>
                    </Menu.Item>
				</Menu>

                <Grid stackable divided columns={2} style={{flex: 1, margin: 0}}>
                    <Grid.Column width={3} style={gridColumnStyle}>
                        <ParametersBox sessionId={sessionId}
                            onUsernameChange={this.storeUsername}
                            onModelOutputChange={this.storeModelOutput}
                            onSessionChange={this.storeSessionId}
                            onModelChange={this.storeModelId}
                            onPlotsFetch={this.storePlots}
                            onViewChange={this.setView}/>
                    </Grid.Column>

                    <Grid.Column width={13} style={gridColumnStyle}>
                        {(this.state.view == 0) ?
                            <ModelOutputBox username={username} modelId={modelId}
                                sessionId={sessionId} plotList={plotList}/>
                        :
                            <ConsoleOutputBox output={this.state.consoleOutput}/>
                        }
                    </Grid.Column>
                </Grid>
            </div>
		);
	}
}

ReactDOM.render(<Application/>, document.getElementById("application"));

