import React from "react"
import ReactDOM from "react-dom"

import {Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal, Checkbox} from "semantic-ui-react"

function TextParam(props) {
    return (
        <Form.Field>
            <Popup on="hover" content={props.parameter.description} trigger={
                <div>
                    <label> {props.parameter.name} </label>

                    <Input focus fluid value={props.parameter.value}
                        onChange={event => {props.onChange(event.target.value)}}/>
                </div>
            }/>
        </Form.Field>
    );
}

function CheckboxParam(props) {
    const isChecked = props.parameter.value;

    return (
        <Form.Field>
            <Popup on="hover" content={props.parameter.description} trigger={
                <Checkbox label={props.parameter.name} checked={isChecked}
                    onChange={() => {props.onChange(!isChecked)}}/>
            }/>
        </Form.Field>
    );
}

function ParametersDialog(props) {
    if (props.step == null) return null;

    const runModel = () => {
        const params = props.params.map(param => param.value);

        props.onRunModel(props.model.id, params);
        props.onClose();
    };

    return (
        <Modal size="fullscreen" open={props.isOpen} onClose={props.onClose}>
            <Modal.Header> {props.step.name} </Modal.Header>

            <Modal.Content>
                <Modal.Description>
                    {props.params.map((param, idx) => {
                        const fcn = props.onChange.bind(this, props.step.index, idx);

                        switch(param.type) {
                            case "checkbox":
                                return <CheckboxParam parameter={param} key={idx}
                                            onChange={fcn}/>
                            case "text":
                                return <TextParam parameter={param} key={idx}
                                            onChange={fcn}/>
                            case "dragDrop":
                                //TODO:
                                return null;
                            default:
                                return <TextParam parameter={param} key={idx}
                                            onChange={fcn}/>
                        }
                    })}
                </Modal.Description>
            </Modal.Content>

            <Modal.Actions>
                <Button basic color='red' inverted>
                    <Icon name='remove'/> Cancel
                </Button>
                <Button color='green' inverted onClick={runModel}>
                    <Icon name='checkmark'/> Run
                </Button>
            </Modal.Actions>
        </Modal>
    );
}

class ParametersBox extends React.Component {
	constructor() {
		super();

		this.state = {
            /* Object with description of the models */
			modelsInfo: {},

            /* Name of the currently selected model */
            currModelId: null,

            /* Array of parameters of selected model */
            currModelParams: [],

            /* Index of the current step */
            currStepIdx: null,

            /* Controls whether parameters dialog should be open */
            isParamsDialogOpen: false,

            errorMsg: null
		};

        this.fetchModelsMetadata = this.fetchModelsMetadata.bind(this);

        this.runModel = this.runModel.bind(this);
        this.changeModel = this.changeModel.bind(this);
        this.changeParamValue = this.changeParamValue.bind(this);
        this.openParamsDialog = this.openParamsDialog.bind(this);
	}

	componentDidMount() {
		this.fetchModelsMetadata();
	}

	fetchModelsMetadata() {
        const fetchModelsMetadataRequest = new XMLHttpRequest();

        fetchModelsMetadataRequest.addEventListener("load", request => {
            this.setState({modelsInfo: JSON.parse(request.target.response)});
        });

        fetchModelsMetadataRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
        });

        fetchModelsMetadataRequest.open("GET", "/fetch_models_metadata/");
        fetchModelsMetadataRequest.send();
	}

    /* TODO: Not used at the moment */
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
        modelNameForm.set("model", JSON.stringify(model));

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
	runModel(modelId, params) {
		const runModelRequest = new XMLHttpRequest();

		runModelRequest.addEventListener("load", request => {
            this.setState({currStepIdx: this.state.currStepIdx + 1});
            this.props.returnModelOutput(JSON.parse(request.target.response));
		});

		runModelRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const modelForm = new FormData();
        modelForm.set("model", JSON.stringify(modelId));
        modelForm.set("parameters", JSON.stringify(params));

		runModelRequest.open("POST", "/run_model/");
		runModelRequest.send(modelForm);
	}

	changeParamValue(stepIdx, paramIdx, newValue) {
        /* Deep copy the changed parameter */
		const newParams = this.state.currModelParams.slice();
        newParams[stepIdx] = newParams[stepIdx].slice();

        newParams[stepIdx][paramIdx] = Object.assign({},
                newParams[stepIdx][paramIdx]
        );

        newParams[stepIdx][paramIdx].value = newValue;
		this.setState({currModelParams: newParams});
	}

    changeModel(event, data) {
        const modelId = data.value;
        const model = this.state.modelsInfo[modelId];

        this.setState({
            currModelId: modelId,
            currStepIdx: 0,

            /* Deep copy of parameters */
            currModelParams: model.parameters.map(paramsGrp =>
                paramsGrp.map(param =>
                    Object.assign({}, param, {value: param.defaultValue})
                )
            )
        });
    }

    openParamsDialog(event, data) {
        if (!data.disabled) {
            this.setState({
                currStepIdx: data.index,
                isParamsDialogOpen: true
            });
        }
    }

	render() {
        const selectedModel = (this.state.currModelId != null) ? Object.assign({},
            this.state.modelsInfo[this.state.currModelId],
            {id: this.state.currModelId}
        ) : null;

        const currentStep = (selectedModel != null) ? Object.assign({},
            selectedModel.steps[this.state.currStepIdx],
            {index: this.state.currStepIdx}
        ) : null;

        const currentParams = this.state.currModelParams[this.state.currStepIdx];

        const modelDropdownChoice = Object.keys(this.state.modelsInfo).map(model => ({
            text: this.state.modelsInfo[model].name,
            value: model
        }));

		return (
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
                                options={modelDropdownChoice}
                                onChange={this.changeModel}/>
                        </Menu.Item>

                        <Menu.Item/>

                        {selectedModel != null && selectedModel.steps.map((step, idx) =>
                            <Menu.Item name={step.name} key={idx} index={idx}
                                active={this.state.currStepIdx === idx}
                                disabled={idx > this.state.currStepIdx}
                                onClick={this.openParamsDialog}/>
                        )}
                    </Menu>

                    <Button primary> Export as CSV </Button>
                </Form>

                <ParametersDialog isOpen={this.state.isParamsDialogOpen}
                    onClose={() => {this.setState({isParamsDialogOpen: false})}}
                    onRunModel={this.runModel}
                    onChange={this.changeParamValue}
                    params={currentParams}
                    model={selectedModel}
                    step={currentStep}
                />
		    </div>
		);
	}
}

export {ParametersBox};

