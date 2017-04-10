import React from "react";
import ReactDOM from "react-dom";

import SplitPane from 'react-split-pane';
import {Grid, Menu, Breadcrumb, Image, Icon} from "semantic-ui-react";

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

            modelName: null,
            sessionId: null,

            view: false,

            plotIdx: null,
            plotList: [],

            consoleOutput: []
        };

        this.toggleView = this.toggleView.bind(this);

        this.changePlotIndex = this.changePlotIndex.bind(this);
        this.storeModelOutput = this.storeModelOutput.bind(this);

        this.storeUsername = this.storeUsername.bind(this);
        this.updateModelName= this.updateModelName.bind(this);
        this.storeSessionId = this.storeSessionId.bind(this);

        this.storePlots= this.storePlots.bind(this);
        this.storeModelOutput = this.storeModelOutput.bind(this);
    }

    changePlotIndex(idx) {
        this.setState({plotIdx: idx});
    }

    toggleView() {
        this.setState({view: !this.state.view});
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

    updateModelName(modelName) {
        this.setState({modelName: modelName});
    }

	render() {
        const {username, modelName, sessionId, plotList, view} = this.state;

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

        let viewName = '';
        if (modelName != null && sessionId != null) {
            viewName = view ? "Plots view" : "Console output view";
        }

        let currentPlot;
        if (this.state.plotIdx != null) {
            currentPlot = this.state.plotList[this.state.plotIdx];
        }

		return (
            <div style={applicationStyle}>
				<Menu size="small" borderless style={{margin: 0, borderWidth: "0 0 1px 0"}}>
					<Menu.Item fitted header>
                        <Image src="/static/images/logo.png" size="small" as='a'
                            href="http://analyticalwizards.com/" target="_blank"/>
                    </Menu.Item>

                    <Menu.Item>
                        <Breadcrumb>
                            <Breadcrumb.Section>
                                <b> {this.state.modelName} </b>
                            </Breadcrumb.Section>

                            <Breadcrumb.Divider icon="right angle"/>

                            <Breadcrumb.Section>
                                {this.state.sessionId}
                            </Breadcrumb.Section>

                            <Breadcrumb.Divider icon="right angle"/>

                            <Breadcrumb.Section>
                                <small> {viewName} </small>
                            </Breadcrumb.Section>
                        </Breadcrumb>
                    </Menu.Item>

                    <Menu.Item position="right">
                        <Icon name="user" color="blue"/>
                        <em> {this.state.username} </em>
                    </Menu.Item>
				</Menu>

                <Grid stackable divided columns={2} style={{flex: 1, margin: 0}}>
                    <Grid.Column width={3} style={gridColumnStyle}>
                        <ParametersBox sessionId={sessionId}
                            onUsernameChange={this.storeUsername}
                            onModelOutputChange={this.storeModelOutput}
                            onSessionChange={this.storeSessionId}
                            onModelChange={this.updateModelName}
                            onPlotChange={this.changePlotIndex}
                            onPlotsFetch={this.storePlots}
                            onToggleView={this.toggleView}
                            plotList={this.state.plotList}
                            plotIdx={this.state.plotIdx}
                            view={this.state.view}/>
                    </Grid.Column>

                    <Grid.Column width={13} style={{overflow: "auto"}}>
                        {(this.state.view) ?
                            <ModelOutputBox plot={currentPlot}/>
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

