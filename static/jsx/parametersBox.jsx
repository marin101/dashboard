import React from "react";
import ReactDOM from "react-dom";

import {Grid, Header, Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal} from "semantic-ui-react";
import {DropdownEditParam, TextParam, CheckboxParam, RadioParam} from "./UIElements.jsx";
import {DropdownParam, SliderParam, RangeParam, DragDropParam} from "./UIElements.jsx";

import HTML5Backend from "react-dnd-html5-backend";
import {DragDropContext} from "react-dnd";

import 'rc-slider/assets/index.css';

/**
 * Component for uploading CSV file and
 * mapping of the fieldnames from the file to the model parameters
 */
class CSVFieldsMappingDialog extends React.Component {
    uploadCSVFile(fileParameter, event) {
        const file = event.target.files[0];

        if (file != null) {
            const uploadCSVFileRequest = new XMLHttpRequest();

            uploadCSVFileRequest.addEventListener("load", request => {
                /* Update filename parameter */
                // TODO: Remove hardcoded values
                this.props.onChange(0, 0, file.name);

                const CSVFieldnames = JSON.parse(request.target.response).fieldnames;
                const targetParamIdx = this.props.params.findIndex(param =>
                    param.id == fileParameter.target
                );

                this.props.onChange(0, targetParamIdx, CSVFieldnames.sort((a, b) =>
                    a.toLowerCase().localeCompare(b.toLowerCase())
                ));
            });

            uploadCSVFileRequest.addEventListener("error", request => {
                //TODO: Add error handling
            });

            const CSVFileForm = new FormData();
            CSVFileForm.append("CSVfile", file);

            uploadCSVFileRequest.open("POST", "/upload_CSV_file/");
            uploadCSVFileRequest.send(CSVFileForm);
        }
    }

    render() {
        const csvFile = this.props.params.find(elem => elem.type == "file");

        let dragDropStandaloneParams = [], dragDropParamsStack = [];
        for (let param of this.props.params) {
            if (param.type == "dragDrop") {
               if (param.size != 1) {
                   dragDropStandaloneParams.push(param);
               } else {
                   dragDropParamsStack.push(param);
               }
            }
        }

        const dragDropParams = this.props.params.reduce((params, param, idx) => {
            if (param.type == "dragDrop") {
                params.push(Object.assign({}, param, {idx: idx}));
            }

            return params;
        }, []);

        return (
            <Modal size="fullscreen" open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header>
                    {this.props.step.name}

                    <Input placeholder={csvFile.description} style={{"float": "right"}}
                        size="mini" value={(csvFile.value != null) ? csvFile.value : ''}>
                        <input disabled/>

                        <span style={{display: "none"}}>
                        <input type="file" ref={input => {this.uploadCSVButton = input}}
                            onChange={this.uploadCSVFile.bind(this, csvFile)}/>
                        </span>

                        <Button onClick={() => {this.uploadCSVButton.click()}}>
                            {csvFile.name}
                        </Button>
                    </Input>
                </Modal.Header>

                <Modal.Content>
                    <Modal.Description>
                        <Grid stackable>
                            <Grid.Column width={8}>
                                <DragDropParam parameter={dragDropParams[0]}
                                    onChange={this.props.onChange.bind(this, 0,
                                            dragDropParams[0].idx)}/>
                            </Grid.Column>

                            <Grid.Column width={8}>
                                {dragDropParams.slice(1).map((param, idx) =>
                                    <DragDropParam key={idx} parameter={param}
                                        onChange={this.props.onChange.bind(this, 0,
                                            param.idx)}/>
                                )}
                            </Grid.Column>
                        </Grid>
                    </Modal.Description>
                </Modal.Content>

                <Modal.Actions>
                    <Button color='green' inverted onClick={this.props.goToNextPage}>
                        Next
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

const DragDropContainer = DragDropContext(HTML5Backend)(CSVFieldsMappingDialog);

// TODO: Remove params props field
function Param(props) {
    switch(props.param.type) {
        case "checkbox":
            return <CheckboxParam parameter={props.param} onChange={props.onChange}/>;
        case "radio":
            return <RadioParam parameter={props.param} onChange={props.onChange}/>;
        case "dropdown":
            return <DropdownParam parameter={props.param} options={props.dataSet}
                onChange={props.onChange}/>;
        case "dropdownEdit":
            return <DropdownEditParam parameter={props.param} options={props.dataSet}
                onChange={props.onChange}/>;
        case "slider":
            return <SliderParam parameter={props.param} disabled={props.disabled}
                onChange={props.onChange}/>;
        case "range":
            return <RangeParam parameter={props.param} dataSet={props.dataSet}
                onChange={props.onChange} disabled={props.disabled}/>;
        case "text":
        case "dragDrop":
        default:
            return <TextParam parameter={props.param} onChange={props.onChange}/>;
    }
}

class ParametersDialog extends React.Component {
    constructor() {
        super();

        this.state = {
            CSVOperationActive: false,
            page: 0
        };

        this.runModel = this.runModel.bind(this);
        this.goToNextPage = this.goToNextPage.bind(this);
        this.readCSVColumn = this.readCSVColumn.bind(this);
    }

    runModel() {
        const {step, params} = this.props;

        this.props.onRunModel(step.parameters.map(paramId => {
            const param = params[paramId];

            switch (param.type) {
            case "range":
                return '';
                if (param.source != null) {
                    const srcParam = params[param.source];
                    return this.getCSVColumnValues(srcParam.value[0])[param.value];
                }

                if (param.scale != null) {
                    return param.value.map(val => val / param.scale).join(', ');
                }

                return param.value.join(', ');

            case "slider":
                return (param.scale != null) ? param.value / param.scale : param.value;

            case "radio":
                return param.returnValue[param.value];

            case "checkbox":
                return param.value ? param.returnValue[1] : param.returnValue[0];

            case "dragDrop":
            case "dropdown":
            case "dropdownEdit":
                // TODO: This check is unnecessary after finishing dragDrop
                if (param.value == null || param.value == '') return '';
                return param.value.join(', ');

            case "text":
            default:
                return param.value;
            }
        }));

        this.props.onClose();
    }

    goToNextPage() {
        this.setState({page: this.state.page + 1});
    }

    readCSVColumn(fieldname, unique=false) {
        if (!this.state.CSVOperationActive) {
            this.setState({CSVOperationActive: true});

            const fetchCSVColumnRequest = new XMLHttpRequest();

            fetchCSVColumnRequest.addEventListener("load", request => {
                const fieldValues = JSON.parse(request.target.response);
                this.props.updateCSVColumnValues(fieldname, fieldValues.sort());
                this.setState({CSVOperationActive: false});
            });

            fetchCSVColumnRequest.addEventListener("error", request => {
                // TODO: Handle error
                this.setState({CSVOperationActive: false});
            });

            const CSVFieldnameForm = new FormData();
            CSVFieldnameForm.set("fieldname", JSON.stringify(fieldname))
            CSVFieldnameForm.set("unique", JSON.stringify(unique))

            fetchCSVColumnRequest.open("POST", "/fetch_CSV_column/");
            fetchCSVColumnRequest.send(CSVFieldnameForm);
        }
    }

    getCSVColumnValues(fieldname) {
        if (!this.props.CSVColumnValues.hasOwnProperty(fieldname)) {
            this.readCSVColumn(fieldname, true);
        }

        return this.props.CSVColumnValues[fieldname];
    }

    render() {
        if (this.props.step == null) return null;

        const {step, params} = this.props;

        /*
        if (step.index == 0 && this.state.page == 0) {
            return <DragDropContainer {...this.props} params={stepParams}
                CSVLoading={this.state.CSVOperationActive}
                goToNextPage={this.goToNextPage}/>;
        }
        */

        return (
            <Modal size="fullscreen" onOpen={() => this.setState({page: 0})}
                open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header> {step.name} </Modal.Header>

                <Modal.Content>
                    <Form>
                        {step.parameters.reduce((validParams, paramId, idx) => {
                            const param = params[paramId];

                            if (param.type != "dragDrop") {
                                let disabled = false, dataSet;

                                if (param.control != null) {
                                    const controlParam = params[param.control.id];
                                    disabled = param.control.enableValue != controlParam.value;
                                }

                                if (param.source != null) {
                                    const srcParam = params[param.source];
                                    // TODO: Handle properly
                                    if (srcParam.value != null) {
                                        dataSet = this.getCSVColumnValues(srcParam.value[0]);
                                    }
                                }

                                validParams.push(
                                    <Param onChange={this.props.onChange.bind(this, paramId)}
                                        key={idx} param={param} dataSet={dataSet} disabled={disabled}
                                    />
                                );
                            }

                            return validParams;
                        }, [])}
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button type="submit" color='green' inverted onClick={this.runModel}>
                        <Icon name='checkmark'/> Run
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

class ParametersBox extends React.Component {
	constructor() {
		super();

		this.state = {
            //TODO: Consider removing
            /* Object with description of all models */
			modelsInfo: {},


            /* Currently selected model */
            modelId: null,

            /* Index of the current step */
            currStepIdx: null,

            /* Parameters of selected model */
            modelParams: {},


            /* Column values for referenced fields */
            CSVColumnValues: {},

            /* Controls whether parameters dialog should be open */
            isParamsDialogOpen: false,

            errorMsg: null,

            newSession: 0,
            saveSession: 0,
            sessionID: null
		};

        this.fetchModelsMetadata = this.fetchModelsMetadata.bind(this);

        this.runModel = this.runModel.bind(this);
        this.changeModel = this.changeModel.bind(this);
        this.changeParamValue = this.changeParamValue.bind(this);
        this.openParamsDialog = this.openParamsDialog.bind(this);
        this.updateCSVColumnValues = this.updateCSVColumnValues.bind(this);
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
            this.setState({modelParams: parameters});
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

    updateCSVColumnValues(fieldname, values) {
        const CSVColumnValues = Object.assign({}, this.state.CSVColumnValues);

        CSVColumnValues[fieldname] = values;
        this.setState({CSVColumnValues: CSVColumnValues});
    }

    /* Resets parameter values in-place */
    resetParamsToDefaults(paramsToReset) {
        for (let paramId in paramsToReset) {
            const param = paramsToReset[paramId];
            param.value = param.defaultValue;
        }
    }

    // TODO: Add session ID
	runModel(params) {
		const runModelRequest = new XMLHttpRequest();

		runModelRequest.addEventListener("load", request => {
            this.setState({currStepIdx: this.state.currStepIdx + 1});
            this.props.returnModelOutput(JSON.parse(request.target.response));
		});

		runModelRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const modelForm = new FormData();
        modelForm.set("model", JSON.stringify(this.state.modelId));

        modelForm.set("step", this.state.currStepIdx);
        modelForm.set("sessionID", JSON.stringify(this.state.sessionID));
        modelForm.set("newSession", JSON.stringify(this.state.newSession));
        modelForm.set("saveSession", JSON.stringify(this.state.saveSession));
        modelForm.set("parameters", JSON.stringify(params));

		runModelRequest.open("POST", "/run_model/");
		runModelRequest.send(modelForm);
	}

	changeParamValue(paramId, newValue) {
        /* Deep copy the changed parameter */
		const newParams = Object.assign({}, this.state.modelParams);
        newParams[paramId] = Object.assign({}, newParams[paramId]);

        newParams[paramId].value = newValue;
		this.setState({modelParams: newParams});
	}

    changeModel(event, data) {
        const modelId = data.value;
        const model = this.state.modelsInfo[modelId];

        // TODO: Spare us of the deep copy
        /* Deep copy */
        const modelParams = {};
        for (let key in model.parameters) {
            const param = model.parameters[key];
            modelParams[key] = Object.assign({}, param);
        }

        this.resetParamsToDefaults(modelParams);

        this.setState({
            modelId: modelId,
            currStepIdx: 0,

            modelParams: modelParams
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
        const {currStepIdx, modelParams} = this.state;

        const model = this.state.modelsInfo[this.state.modelId];
        const currStep = (model != null) ? model.steps[currStepIdx] : null;

        const modelDropdownChoice = Object.keys(this.state.modelsInfo).map(modelId => ({
            text: this.state.modelsInfo[modelId].name,
            value: modelId
        }));

		return (
			<div>
                <Form size="mini">
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

                        {model != null && model.steps.map((step, idx) =>
                            <Menu.Item name={idx+1 + ". " + step.name} key={idx} index={idx}
                                active={currStepIdx === idx}
                                disabled={idx > currStepIdx}
                                onClick={this.openParamsDialog}/>
                        )}
                    </Menu>

                    <Button primary> Export as CSV </Button>
                </Form>

                <ParametersDialog isOpen={this.state.isParamsDialogOpen}
                    onClose={() => {this.setState({isParamsDialogOpen: false})}}
                    updateCSVColumnValues={this.updateCSVColumnValues}
                    CSVColumnValues={this.state.CSVColumnValues}

                    step={currStep}
                    params={modelParams}

                    onChange={this.changeParamValue}
                    onRunModel={this.runModel}
                />
		    </div>
		);
	}
}

export default ParametersBox;

