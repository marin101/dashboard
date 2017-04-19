import React from "react";
import ReactDOM from "react-dom";

import {Grid, Menu, Breadcrumb, Loader, Image, Icon} from "semantic-ui-react";

import ParametersBox from "./parametersBox.jsx";
import ModelOutputBox from "./modelOutputBox.jsx";
import ConsoleOutputBox from "./consoleOutputBox.jsx";

class Application extends React.Component {
    constructor() {
        super();

        this.state = {
            username: null,

            modelName: null,
            sessionId: null,

            stepIdx: null,
            stepName: '',

            view: false,

            plotIdx: null,
            plotList: [],

            consoleOutput: [],

            modelRunning: false
        };

        this.toggleView = this.toggleView.bind(this);

        this.storeStepIdx = this.storeStepIdx.bind(this);
        this.changePlotIndex = this.changePlotIndex.bind(this);
        this.storeModelOutput = this.storeModelOutput.bind(this);


        this.updateModelName = this.updateModelName.bind(this);
        this.storeUsername = this.storeUsername.bind(this);
        this.storeSessionId = this.storeSessionId.bind(this);

        this.storeSessionMetadata = this.storeSessionMetadata.bind(this);
        this.storeModelOutput = this.storeModelOutput.bind(this);

        this.setModelState = this.setModelState.bind(this);
    }

    changePlotIndex(idx) {
        this.setState({plotIdx: idx});
    }

    toggleView() {
        this.setState({view: !this.state.view});
    }

    storeStepIdx(idx) {
        this.setState({
            plotIdx: null,
            stepIdx: idx
        });
    }

    storeModelOutput(stepIdx, consoleOutput, plotList) {
        const output = this.state.consoleOutput.slice(0, stepIdx);
        const plots = this.state.plotList.slice(0, stepIdx);

        output.push(consoleOutput || '');
        plots.push(plotList || []);

        this.setState({
            consoleOutput: output,
            plotList: plots
        });
    }

    storeUsername(username) {
        this.setState({username: username});
    }

    storeSessionId(sessionId) {
        this.setState({
            sessionId: sessionId,

            plotIdx: null,
            stepIdx: null
        });
    }

    storeSessionMetadata(logs, plots) {
        this.setState({
            consoleOutput: logs,
            plotList: plots,

            plotIdx: null,
            stepIdx: null
        });
    }

    updateModelName(modelName) {
        this.setState({
            modelName: modelName,
            stepIdx: 0
        });
    }

    setModelState(state, step='') {
        this.setState({
            modelRunning: state,
            stepName: step
        });
    }

	render() {
        const {username, stepIdx, modelName, sessionId, plotList, view} = this.state;

        const applicationStyle = {
            flexDirection: "column",
            display: "flex",

            minHeight: "100vh",
            height: "100vh",
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
            currentPlot = this.state.plotList[stepIdx][this.state.plotIdx];
        }

        let outputBox = '';

        if (this.state.modelRunning) {
            outputBox = <Loader active> {this.state.stepName} running </Loader>;
        } else if (this.state.view) {
            outputBox = <ModelOutputBox plot={currentPlot}/>;
        } else {
            outputBox = <ConsoleOutputBox output={this.state.consoleOutput[stepIdx]}/>;
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

                <Grid stackable divided stretched columns={2} style={{flex: 1, margin: 0}}>
                    <Grid.Column width={3} style={gridColumnStyle}>
                        <ParametersBox sessionId={sessionId}
                            onModelRunFinish={() => {this.setModelState(false)}}
                            onModelRun={(p) => {this.setModelState(true, p)}}

                            onUsernameChange={this.storeUsername}
                            onModelOutputChange={this.storeModelOutput}

                            plotList={this.state.plotList[stepIdx]}
                            onStepChange={this.storeStepIdx}

                            onSessionLoad={this.storeSessionMetadata}
                            onSessionChange={this.storeSessionId}

                            onPlotChange={this.changePlotIndex}
                            onModelChange={this.updateModelName}

                            onToggleView={this.toggleView}
                            plotIdx={this.state.plotIdx}
                            view={this.state.view}/>
                    </Grid.Column>

                    <Grid.Column width={13} style={{overflow: "auto"}}>
                        {outputBox}
                   </Grid.Column>
                </Grid>
            </div>
		);
	}
}

ReactDOM.render(<Application/>, document.getElementById("application"));

