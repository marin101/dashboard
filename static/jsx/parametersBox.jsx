import React from "react";
import ReactDOM from "react-dom";

import {Grid, Header, Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal} from "semantic-ui-react";
import {DropdownEditParam, TextParam, CheckboxParam, RadioParam} from "./UIElements.jsx";
import {DropdownParam, SliderParam, RangeParam, DragDropParam} from "./UIElements.jsx";
import {FileInputParam} from "./UIElements.jsx";

import HTML5Backend from "react-dnd-html5-backend";
import {DragDropContext} from "react-dnd";

import 'rc-slider/assets/index.css';

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
        case "dragDrop":
            return <DragDropParam parameter={props.param} onChange={props.onChange}/>;
        case "slider":
            return <SliderParam parameter={props.param} disabled={props.disabled}
                onChange={props.onChange}/>;
        case "range":
            return <RangeParam parameter={props.param} dataSet={props.dataSet}
                onChange={props.onChange} disabled={props.disabled}/>;
        case "file":
            return <FileInputParam parameter={props.param} onChange={props.onChange}/>;
        case "text":
        case "dragDrop":
        default:
            return <TextParam parameter={props.param} onChange={props.onChange}/>;
    }
}

function PageParams(props) {
    const {params, paramIds, isGridRow=false} = props;

    if (Array.isArray(paramIds)) {
        const childParams = paramIds.map((childParamIds, idx) =>
            <PageParams key={idx} params={params} paramIds={childParamIds}
                CSVColumnValues={props.CSVColumnValues}
                onChange={props.onChange}
                isGridRow={!isGridRow}
            />
        );

        if (props.isGridRow) {
            return <Grid.Row> {childParams} </Grid.Row>;
        }

        return <Grid.Column> {childParams} </Grid.Column>;
    }

    /* No more grid nesting (paramIds is only one parameter) */
    const param = params[paramIds];
    let disabled = false, dataSet;

    /* Check if parameter state is controlled by another parameter */
    if (param.control != null) {
        const controlParam = params[param.control.id];
        disabled = controlParam.value != param.control.enableValue;
    }

    /* Check if parameter values are taken from another parameter */
    if (param.source != null) {
        const srcParam = params[param.source.id];

        // TODO: Handle properly
        if (srcParam.value != null) {
            dataSet = props.CSVColumnValues[srcParam.value[0]];
        }
    }

    return (
        <Param onChange={props.onChange.bind(this, paramIds)}
            param={param} dataSet={dataSet} disabled={disabled}
        />
    );
}

class ParametersDialog extends React.Component {
    constructor() {
        super();

        this.state = {
            page: 0
        };

        this.CSVOperationActive = false;

        this.runModel = this.runModel.bind(this);
        this.goToPrevPage = this.goToPrevPage.bind(this);
        this.goToNextPage = this.goToNextPage.bind(this);
        this.readCSVColumn = this.readCSVColumn.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.step == null) return;

        const {step, params, CSVColumnValues} = nextProps;

        // TODO: Support pages
        const pageParamIds = step.layout[this.state.page];

        /* Read all CSV columns that will be used */
        for (let paramId in params) {
            const param = params[paramId];

            if (param.source != null && param.source.action == "readCSV") {
                const uniqueValuesOnly = param.source.unique == true;
                const srcParam = params[param.source.id];

                // TODO: Change CSVColumnValues when changing srcParam.value
                if (srcParam.value != null) {
                    srcParam.value.forEach(csvFieldname => {
                        /* Read only those that are were not already read */
                        if (!CSVColumnValues.hasOwnProperty(csvFieldname)) {
                            this.readCSVColumn(csvFieldname, uniqueValuesOnly);
                        }
                    });
                }
            }
        }

        /* Page must be reset when step changes */
        if (this.props.stateIdx != nextProps.stateIdx) {
            this.setState({page: 0});
        }
    }

    uploadCSVFile(paramId, event) {
        const file = event.target.files[0];

        if (file != null) {
            const uploadCSVFileRequest = new XMLHttpRequest();

            uploadCSVFileRequest.addEventListener("load", request => {
                const CSVFieldnames = JSON.parse(request.target.response).fieldnames;
                const targetParamId = this.props.params[paramId].target;

                /* Update filename parameter */
                this.props.onChange(paramId, file.name);

                /* Update referenced parameter */
                this.props.onChange(targetParamId, CSVFieldnames.sort((a, b) =>
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

    runModel() {
        const {step, params} = this.props;

        this.props.onRunModel(step.parameters.map(paramId => {
            const param = params[paramId];

            switch (param.type) {
            case "range":
                if (param.source != null) {
                    const srcParam = params[param.source.id];
                    // TODO: Support handling of multiple values???
                    const csvValues = this.getCSVColumnValues(srcParam.value[0]);
                    return csvValues[param.value[0]] + ", " + csvValues[param.value[1] + 1];
                }

                if (param.returnValue != null) {
                    const retVal = param.returnValue;

                    const k = (retVal[1] - retVal[0]) / (value[1] - value[0]);
                    const l = (retVal[0] - k*value[0]);

                    /* Linear mapping from input to ouptput range */
                    return param.value.map(val => (k*val + l)).join(", ");
                }

                return param.value.join(', ');

            case "slider":
                const {value} = param;

                if (param.returnValue != null) {
                    const retVal = param.returnValue;

                    const k = (retVal[1] - retVal[0]) / (value[1] - value[0]);
                    const l = (retVal[0] - k*value[0]);

                    /* Linear mapping from input to ouptput range */
                    return param.value.map(val => (k*val + l)).join(", ");
                }

                return value.join(", ");

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

    readCSVColumn(fieldname, unique=false) {
        if (!this.CSVOperationActive) {
            this.CSVOperationActive = true;

            const fetchCSVColumnRequest = new XMLHttpRequest();

            fetchCSVColumnRequest.addEventListener("load", request => {
                const fieldValues = JSON.parse(request.target.response);

                // TODO Add sorting function
                this.props.updateCSVColumnValues(fieldname, fieldValues.sort());
                this.CSVOperationActive = false;
            });

            fetchCSVColumnRequest.addEventListener("error", request => {
                // TODO: Handle error
                this.CSVOperationActive = false;
            });

            const CSVFieldnameForm = new FormData();
            CSVFieldnameForm.set("fieldname", JSON.stringify(fieldname))
            CSVFieldnameForm.set("unique", JSON.stringify(unique))

            fetchCSVColumnRequest.open("POST", "/fetch_CSV_column/");
            fetchCSVColumnRequest.send(CSVFieldnameForm);
        }
    }

    validateParams() {
        // TODO:Validate current page parameters
        return true;
    }

    getCSVColumnValues(fieldname) {
        return this.props.CSVColumnValues[fieldname];
    }

    goToPrevPage() {
        this.setState({page: this.state.page - 1});
    }

    goToNextPage() {
        if (!this.validateParams()) return;

        if (this.state.page < this.props.step.layout.length - 1) {
            this.setState({page: this.state.page + 1});
        } else {
            this.runModel();
        }
    }

    render() {
        // TODO: Consider
        if (this.props.step == null) return null;

        const {step, params} = this.props;
        const pageLayout = step.layout;

        const {page} = this.state;

        let pageHeaderParams = [];
        if (pageLayout[page].header != null) {
            pageHeaderParams = pageLayout[page].header;
        }

        let pageBodyParamIds = [];
        if (pageLayout[page].body != null) {
            pageBodyParamIds = pageLayout[page].body;
        }

        return (
            <Modal size="fullscreen" open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header style={{display: "flex"}}>
                    <div style={{flex: 1}}> {step.name} </div>

                    <Grid style={{flex: 1}}>
                        {pageHeaderParams.map((paramId, idx) =>
                            <Grid.Column key={idx}>
                                <FileInputParam parameter={params[paramId]}
                                    onChange={this.uploadCSVFile.bind(this, paramId)}/>
                            </Grid.Column>
                        )}
                    </Grid>
                </Modal.Header>

                <Modal.Content>
                    <Form>
                        <Grid stretched stackable columns="equal">
                            {pageBodyParamIds.map((childParamIds, idx) =>
                                <PageParams key={idx} params={params} paramIds={childParamIds}
                                    CSVColumnValues={this.props.CSVColumnValues}
                                    onChange={this.props.onChange}
                                />
                            )}
                        </Grid>
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button negative disabled={page <= 0} onClick={this.goToPrevPage}>
                        Back
                    </Button>
                    <Button positive onClick={this.goToNextPage}>
                        {(page < pageLayout.length - 1) ? "Next" : "Run"}
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}

const DragDropContainer = DragDropContext(HTML5Backend)(ParametersDialog);

class ParametersBox extends React.Component {
	constructor() {
		super();

		this.state = {
            //TODO: Consider removing
            /* Object with description of all models */
			modelsInfo: {},


            /* Name of the currently selected model */
            modelId: null,

            /* Index of the current step */
            stepIdx: null,

            /* Parameters of currently selected model */
            modelParams: {},


            /* Column values for referenced fields */
            CSVColumnValues: {},

            /* Controls whether parameters dialog should be open */
            isParamsDialogOpen: false,

            // TODO:
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
    /*
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
    */

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
            this.setState({stepIdx: this.state.stepIdx + 1});
            this.props.returnModelOutput(JSON.parse(request.target.response));
		});

		runModelRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const modelForm = new FormData();
        modelForm.set("model", JSON.stringify(this.state.modelId));

        modelForm.set("step", this.state.stepIdx);
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
            stepIdx: 0,

            modelParams: modelParams
        });
    }

    openParamsDialog(event, data) {
        if (!data.disabled) {
            this.setState({
                stepIdx: data.index,
                isParamsDialogOpen: true
            });
        }
    }

	render() {
        const {modelsInfo, stepIdx, modelParams} = this.state;

        const model = modelsInfo[this.state.modelId];
        const step = (model != null) ? model.steps[stepIdx] : null;

        const modelDropdownChoice = Object.keys(modelsInfo).map(modelId => ({
            text: modelsInfo[modelId].name,
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
                            <Dropdown selection scrolling placeholder="Select model"
                                options={modelDropdownChoice}
                                onChange={this.changeModel}/>
                        </Menu.Item>

                        {/*TODO: Add space*/}
                        <Menu.Item/>

                        {model != null && model.steps.map((step, idx) =>
                            <Menu.Item name={idx+1 + ". " + step.name} key={idx} index={idx}
                                active={stepIdx === idx}
                                disabled={idx > stepIdx}
                                onClick={this.openParamsDialog}/>
                        )}
                    </Menu>

                    <Button primary> Export as CSV </Button>
                </Form>

                <DragDropContainer isOpen={this.state.isParamsDialogOpen}
                    onClose={() => {this.setState({isParamsDialogOpen: false})}}
                    updateCSVColumnValues={this.updateCSVColumnValues}
                    CSVColumnValues={this.state.CSVColumnValues}

                    step={step}
                    stepIdx={stepIdx}
                    params={modelParams}

                    onChange={this.changeParamValue}
                    onRunModel={this.runModel}
                />
		    </div>
		);
	}
}

export default ParametersBox;

