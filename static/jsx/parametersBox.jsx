import React from "react"
import ReactDOM from "react-dom"

import {Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal, Checkbox} from "semantic-ui-react"

function TextParam(props) {
    return (
        <Form.Field>
            <Popup on="hover" content={this.props.parameter.description} trigger={
                <div>
                    <label> {this.props.parameter.name} </label>

                    <Input focus fluid value={this.props.parameter.value}
                        onChange={event => {this.handleChange(event.target.value)}}/>
                </div>
            }/>
        </Form.Field>
    );
}

function CheckboxParam(props) {
    const isChecked = this.props.parameter.value;

    return (
        <Form.Field>
            <Popup on="hover" content={this.props.parameter.description} trigger={
                <Checkbox label={this.props.parameter.name} checked={isChecked}
                    onChange={() => {this.props.handleChange(!isChecked)}}/>
            }/>
        </Form.Field>
    );
}

class ParametersBox extends React.Component {
	constructor() {
		super();

		this.state = {
            /* Object with description of the models */
			modelsInfo: null,

            /* Name of the currently selected model */
            currModel: null,

            /* Array of parameters of selected model */
            currModelParams: [],

            /* Index of the current step */
            currStep: null,

            errorMsg: null
		};

        this.fetchModelNames = this.fetchModelNames.bind(this);
		this.handleRScriptChoice = this.handleRScriptChoice.bind(this);
	}

	componentDidMount() {
		this.fetchModelNames();
	}

	fetchModelNames() {
        const fetchModelNamesRequest = new XMLHttpRequest();

        fetchModelNamesRequest.addEventListener("load", request => {
            this.setState({modelsInfo: request.target.response});
        });

        fetchModelNamesRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
        });

        fetchModelNamesRequest.open("GET", "/fetch_model_names/");
        fetchModelNamesRequest.send();
	}

	fetchModelDescription(model) {
		const fetchModelDescriptionRequest = new XMLHttpRequest();

		fetchModelDescriptionRequest.addEventListener("load", request => {
            const description = JSON.parse(request.target.response);

            //TODO: Move from here
            const parameters = description.parameters.map(stepParams => {
                stepParams.map(param => param.defaultValue);
            });

            const newModelsInfo = Object.assign({}, this.state.modelsInfo);

            newModelsInfo[model] = description;
            this.setState({currModelParams: parameters});
            this.setState({modelsInfo: newModelsInfo});
		});

		fetchModelDescriptionRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const modelNameForm = new FormData();
        modelNameForm.set("model", model);

		fetchModelDescriptionRequest.open("POST", "/fetch_model_description/");
		fetchModelDescriptionRequest.send(modelNameForm);
	}

    /* Resets parameter values in-place */
    resetParamsToDefaults(params) {
        params.forEach(param => {
            param.value = param.defaultValue;
            return param;
        });
    }

    // TODO: Add session ID
	runModel(model) {
		const sendOptionsRequest = new XMLHttpRequest();

		runModelRequest.addEventListener("load", request => {
            // TODO: Add model response handling
			console.log(request.target.response);
		});

		runModelRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const modelForm = new FormData();
        modelForm.set("model", this.state.modelsInfo[model]);
        modelForm.set("parameters", params[this.state.currStep]);

		runModelRequest.open("POST", "/run_model/");
		runModelRequest.send(modelForm);
	}

	onParamValueChange(stepIdx, paramIdx, newValue) {
		const newParams = this.state.currModelParams.slice();

        /* Deep copy the changed parameter */
        newParams[stepIdx] = newParams[stepIdx].slice();
        newParams[stepIdx][paramIdx] = newValue;

		this.setState({currModelParams: newParams});
	}

	parametersMenu(params, paramType) {
		return params.map((param, idx) => {
			switch(param.type) {
			case "checkbox":
				return <CheckboxParam parameter={param}
						handleChange={this.onParamValueChange.bind(this, paramType, idx)}/>;
			case "text":
				return <TextParam parameter={param}
						handleChange={this.onParamValueChange.bind(this, paramType, idx)}/>;
			case "dragDrop":
				return null;
			default:
				return <TextParam parameter={param}
						handleChange={this.onParamValueChange.bind(this, paramType, idx)}/>;
			}
		});
	}

	handleMenuClose(event) {
		this.setState({readMenuActive: false});
		this.setState({optimMenuActive: false});
		this.setState({prepMenuActive: false});
	}

	handleRScriptChoice(event) {
		this.setState({rScript: event.target.value});
	}

    changeStep(event) {
        console.log(event.target.response);
    }

    changeModel(event) {
        this.setState({currModel: event.target.response});
    }

	render() {
        const modelNames = (this.state.modelsInfo != null) ?
            Object.keys(this.state.modelsInfo).map(model =>
                this.state.modelsInfo[model].name
            ) : [];

		return (
			<div>
				<div>
					<Form>
						<Menu fluid>
							<Menu.Item name="New session" onClick={this.restartSession}>
							</Menu.Item>
							<Menu.Item name="Save session" onClick={this.saveSession}>
							</Menu.Item>
						</Menu>

						<Menu vertical fluid>
							<Menu.Item>
								<Dropdown scrolling placeholder="Select model"
                                    value={this.state.currModel}
									onChange={this.changeModel}
                                    options={modelNames}/>
							</Menu.Item >

                            {this.state.modelsInfo != null &&
                            this.state.modelsInfo.steps.map(step =>
                                <Menu.Item name={step.name} onClick={this.changeStep}/>
                            )}
						</Menu>

						<Button primary> Export as CSV </Button>
					</Form>

					<Modal size="fullscreen" dimmer={false} open={this.state.readMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Read parameters </Modal.Header>

						<Modal.Content image>
							<Modal.Description>
								{this.parametersMenu(this.state.selectedStep)}
							</Modal.Description>
						</Modal.Content>

						<Modal.Actions>
							<Button basic color='red' inverted>
								<Icon name='remove'/> Cancel
							</Button>
							<Button color='green' inverted>
								<Icon name='checkmark'/> Run
							</Button>
						</Modal.Actions>
					</Modal>
				</div>
			}
		</div>
		);
	}
}

export {ParametersBox};

