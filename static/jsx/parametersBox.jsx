import React from "react";
import ReactDOM from "react-dom";

import {Grid, Header, Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal} from "semantic-ui-react";
import {DropdownEditParam, TextParam, CheckboxParam, RadioParam} from "./UIElements.jsx";
import {DropdownParam, SliderParam, RangeParam, DragDropParam} from "./UIElements.jsx";
import {FileInputParam} from "./UIElements.jsx";

import HTML5Backend from "react-dnd-html5-backend";
import {DragDropContext} from "react-dnd";

import 'rc-slider/assets/index.css';

function Param(props) {
    const {paramId, param, dataSet, onChange} = props;

    const disabled = (param.source != null && dataSet == null) ? true : props.disabled;

    switch(props.param.type) {
        case "checkbox":
            return <CheckboxParam parameter={param} onChange={onChange}/>;
        case "radio":
            return <RadioParam parameterId={paramId} parameter={param} onChange={onChange}/>;
        case "dropdown":
            return <DropdownParam parameter={param} options={dataSet} onChange={onChange}/>;
        case "dropdownEdit":
            return <DropdownEditParam parameter={param} options={dataSet} onChange={onChange}/>;
        case "dragDrop":
            return <DragDropParam parameterId={paramId} parameter={param} onChange={onChange}/>;
        case "slider":
            return <SliderParam parameter={param} dataSet={dataSet} disabled={disabled}
                onChange={onChange}/>;
        case "range":
            return <RangeParam parameter={param} dataSet={dataSet} disabled={disabled}
                onChange={onChange}/>;
        case "file":
            return <FileInputParam parameter={param} onChange={onChange}/>;
        case "text":
        default:
            return <TextParam parameter={param} onChange={onChange}/>;
    }
}

function PageParams(props) {
    const {params, paramIds, isGridRow=false} = props;

    if (Array.isArray(paramIds)) {
        const childParams = paramIds.map((childParamIds, idx) =>
            <PageParams key={idx} params={params} paramIds={childParamIds}
                csvColumnValues={props.csvColumnValues}

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
        if (param.source.action == "readCSV") {
            if (srcParam.value != null) {
                dataSet = props.csvColumnValues[srcParam.value[0]];
            }
        } else {
            dataSet = srcParam.value;
        }
    }

    const paramElem = (
        <Param paramId={paramIds} param={param} dataSet={dataSet} disabled={disabled}
            onChange={props.onChange.bind(this, paramIds)}
        />
    );

    if (props.isGridRow) {
        return <Grid.Row> {paramElem} </Grid.Row>;
    }

    return <Grid.Column> {paramElem} </Grid.Column>;
}

class ParametersDialog extends React.Component {
    constructor() {
        super();

        this.state = {
            page: 0
        };

        this.csvOperationActive = false;

        this.runModel = this.runModel.bind(this);
        this.resetParams = this.resetParams.bind(this);
        this.goToPrevPage = this.goToPrevPage.bind(this);
        this.goToNextPage = this.goToNextPage.bind(this);
        this.readCsvColumn = this.readCsvColumn.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.step == null) return;

        const {step, params, csvColumnValues} = nextProps;
        const fieldnamesToFetch = {};

        /* Read all csv columns used in the current step */
        for (let paramId of step.parameters) {
            const param = params[paramId];

            if (param.source != null && param.source.action == "readCSV") {
                const uniqueOnly = param.source.unique == true;

                const srcFileParam = params[param.source.file];
                const filename = srcFileParam.value;

                const fieldnames = fieldnamesToFetch[filename] = {};
                const {value} = params[param.source.id];

                if (value != null) {
                    const prevValue = this.props.params[param.source.id].value;

                    if (prevValue == null) {
                        for (let fieldname of value) {
                            if (fieldnames.hasOwnProperty(fieldname)) {
                                fieldnames[fieldname] = fieldnames[fieldname] && uniqueOnly;
                            } else {
                                fieldnames[fieldname] = uniqueOnly;
                            }
                        }
                    } else {
                        for (var i = 0, j = 0; i < prevValue.length && j < value.length;) {
                            if (prevValue[i] == value[j]) {
                                i++, j++;
                            } else if (prevValue[i] == value[j + 1]) {
                                if (fieldnames.hasOwnProperty(fieldname)) {
                                    fieldnames[value[j]] = fieldnames[value[j]] && uniqueOnly;
                                } else {
                                    fieldnames[value[j]] = uniqueOnly;
                                }

                                break;
                            } else i++;
                        }

                        if (j < value.length) {
                            if (fieldnames.hasOwnProperty(fieldname)) {
                                fieldnames[value[j]] = fieldnames[value[j]] && uniqueOnly;
                            } else {
                                fieldnames[value[j]] = uniqueOnly;
                            }
                        }
                    }
                }
            }
        }

        /* Send one request per csv file */
        for (let filename in fieldnamesToFetch) {
            const fieldnames = fieldnamesToFetch[filename];
            this.readCsvColumn(filename, fieldnames);
        }

        /* Page must be reset when step changes */
        if (this.props.stepIdx != nextProps.stepIdx) {
            this.setState({page: 0});
        }
    }

    uploadCsvFile(paramId, event) {
        const file = event.target.files[0];

        if (file != null) {
            const uploadCsvFileRequest = new XMLHttpRequest();

            uploadCsvFileRequest.addEventListener("load", request => {
                const csvFieldnames = JSON.parse(request.target.response).fieldnames;
                const targetParamId = this.props.params[paramId].target;

                /* Update filename parameter */
                this.props.onChange(paramId, file.name);

                /* Update referenced parameter */
                this.props.onChange(targetParamId, csvFieldnames.sort((a, b) =>
                    a.toLowerCase().localeCompare(b.toLowerCase())
                ));
            });

            uploadCsvFileRequest.addEventListener("error", request => {
                //TODO: Add error handling
            });

            const csvFileForm = new FormData();
            csvFileForm.append("sessionId", this.props.sessionId);
            csvFileForm.append("csvfile", file);

            uploadCsvFileRequest.open("POST", "/upload_csv_file/");
            uploadCsvFileRequest.send(csvFileForm);
        }
    }

    runModel() {
        const {step, params} = this.props;

        this.props.onRunModel(step, step.parameters.map(paramId => {
            const param = params[paramId];

            switch (param.type) {
            case "range":
                /* Check if parameter is disabled */
                if (param.control != null) {
                    const controlParam = params[param.control.id];

                    if (param.control.enableValue != controlParam.value) {
                        return param.control.disabledReturnValue;
                    }
                }

                if (param.source != null) {
                    const srcParam = params[param.source.id];

                    // TODO: Support handling of multiple values???
                    const csvValues = this.getCsvColumnValues(srcParam.value[0]);
                    return csvValues[param.value[0]] + ", " + csvValues[param.value[1] + 1];
                }

                if (param.returnValue != null) {
                    const retVal = param.returnValue;
                    const choice = param.choice;

                    const k = (retVal[1] - retVal[0]) / (choice[1] - choice[0]);
                    const l = (retVal[0] - k*choice[0]);

                    /* Linear mapping from input to ouptput range */
                    return param.value.map(val => (k*val + l)).join(", ");
                }

                return param.value.join(', ');

            case "slider":
                /* Check if parameter is disabled */
                if (param.control != null) {
                    const controlParam = params[param.control.id];

                    if (param.control.enableValue != controlParam.value) {
                        return param.control.disabledReturnValue;
                    }
                }

                if (param.returnValue != null) {
                    const retVal = param.returnValue;
                    const choice = param.choice;

                    /* Linear mapping coefficients */
                    const k = (retVal[1] - retVal[0]) / (choice[1] - choice[0]);
                    const l = (retVal[0] - k*choice[0]);

                    return k*param.value + l;
                }

                return param.value;

            case "radio":
                return param.returnValue[param.value];

            case "checkbox":
                return param.value ? param.returnValue[1] : param.returnValue[0];

            case "dragDrop":
            case "dropdown":
            case "dropdownEdit":
                // TODO: Remove when dropdown is fixed
                if (!Array.isArray(param.value)) return '';
                return param.value.join(', ');

            case "file":
            case "text":
            default:
                return param.value;
            }
        }));

        this.props.onClose();
    }

    readCsvColumn(filename, fieldnames) {
        if (!this.csvOperationActive && Object.keys(fieldnames).length > 0) {
            this.csvOperationActive = true;

            const fetchCsvColumnRequest = new XMLHttpRequest();

            fetchCsvColumnRequest.addEventListener("load", request => {
                const csvColumns = JSON.parse(request.target.response);
                for (let column in csvColumns.values) column.sort();

                // TODO Add sorting function for strings
                this.props.updateCsvColumnValues(csvColumns);
                this.csvOperationActive = false;
            });

            fetchCsvColumnRequest.addEventListener("error", request => {
                // TODO: Handle error
                this.csvOperationActive = false;
            });

            const csvFieldnameForm = new FormData();
            csvFieldnameForm.set("sessionId", this.props.sessionId);
            csvFieldnameForm.set("fieldnames", JSON.stringify(fieldnames));
            csvFieldnameForm.set("filename", filename);

            fetchCsvColumnRequest.open("POST", "/fetch_csv_columns/");
            fetchCsvColumnRequest.send(csvFieldnameForm);
        }
    }

    validateParams() {
        // TODO:Validate current page parameters
        return true;
    }

    getCsvColumnValues(fieldname) {
        return this.props.csvColumnValues[fieldname];
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

    resetParams() {
        const {step, params} = this.props;

        const stepParams = step.parameters.map(paramId =>
            params[paramId]
        );

        this.props.resetParams(stepParams);

        step.parameters.forEach(paramId =>
            this.props.onChange(paramId, params[paramId].value)
        );
    }

    render() {
        // TODO: Consider
        if (this.props.step == null) return null;

        const {page} = this.state;

        const {step, params} = this.props;
        const pageLayout = step.layout[page];

        let pageHeaderParams = [];
        if (pageLayout.header != null) {
            pageHeaderParams = pageLayout.header;
        }

        let pageBodyParamIds = [];
        if (pageLayout.body != null) {
            pageBodyParamIds = pageLayout.body;
        }

        return (
            <Modal size="fullscreen" open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header style={{display: "flex"}}>
                    <div style={{flex: 1}}> {step.name} </div>

                    <Grid style={{flex: 1}}>
                        {pageHeaderParams.map((paramId, idx) =>
                            <Grid.Column key={idx}>
                                <FileInputParam parameter={params[paramId]}
                                    onChange={this.uploadCsvFile.bind(this, paramId)}/>
                            </Grid.Column>
                        )}
                    </Grid>
                </Modal.Header>

                <Modal.Content>
                    <Form>
                        <Grid stretched stackable columns="equal">
                            {pageBodyParamIds.map((childParamIds, idx) =>
                                <PageParams key={idx} params={params} paramIds={childParamIds}
                                    csvColumnValues={this.props.csvColumnValues}
                                    onChange={this.props.onChange}
                                />
                            )}
                        </Grid>
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button secondary content="Reset" onClick={this.resetParams}/>
                    <Button negative disabled={page <= 0} onClick={this.goToPrevPage}>
                        Back
                    </Button>
                    <Button positive onClick={this.goToNextPage}>
                        {(page < step.layout.length - 1) ? "Next" : "Run"}
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

            /* List of the user session names for the current model */
            sessions: [],


            /* Name of the currently selected model */
            modelId: null,

            /* Name of the currently selected session */
            sessionId: null,

            /* Index of the current step */
            stepIdx: null,

            /* Parameters of currently selected model */
            modelParams: {},


            /* Column values for referenced fields */
            csvColumnValues: {},

            /* Controls whether parameters dialog should be open */
            isParamsDialogOpen: false,

            // TODO:
            errorMsg: null,
		};

        this.saveSession = this.saveSession.bind(this);
        this.createSession = this.createSession.bind(this);
        this.deleteSession = this.deleteSession.bind(this);

        this.fetchModelsMetadata = this.fetchModelsMetadata.bind(this);
        this.selectModel = this.selectModel.bind(this);
        this.runModel = this.runModel.bind(this);

        this.fetchPlots = this.fetchPlots.bind(this);
        this.fetchSessions = this.fetchSessions.bind(this);
        this.selectSession = this.selectSession.bind(this);

        this.changeParamValue = this.changeParamValue.bind(this);
        this.openParamsDialog = this.openParamsDialog.bind(this);

        this.updateCsvColumnValues = this.updateCsvColumnValues.bind(this);
	}

	componentDidMount() {
		this.fetchModelsMetadata();
	}

	fetchModelsMetadata() {
        console.log('kita')
        const fetchModelsMetadataRequest = new XMLHttpRequest();

        fetchModelsMetadataRequest.addEventListener("load", request => {
            const {username, models} = JSON.parse(request.target.response);

            this.setState({modelsInfo: models});
            this.props.updateUsername(username);
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

    updateCsvColumnValues(csvColumns) {
        const csvColumnValues = Object.assign({}, this.state.csvColumnValues);

        console.log('kita2')
        for (let fieldname in csvColumns) {
            csvColumnValues[fieldname] = csvColumns[fieldname];
        };

        this.setState({csvColumnValues: csvColumnValues});
    }

    /* Resets parameter values in-place */
    resetParamsToDefaults(paramsToReset) {
        for (let paramId in paramsToReset) {
            const param = paramsToReset[paramId];
            param.value = param.defaultValue;
        }
    }

    // TODO: Add session ID
	runModel(step, params) {
		const runModelRequest = new XMLHttpRequest();

		runModelRequest.addEventListener("load", request => {
            const {consoleOutput, plots} = JSON.parse(request.target.response);
            this.props.returnModelOutput(consoleOutput, plots);

            const model = this.state.modelsInfo[this.state.modelId];

            if (this.state.stepIdx + 1 < model.steps.length) {
                this.setState({stepIdx: this.state.stepIdx + 1});
            }
		});

		runModelRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const stepData = {"index": this.state.stepIdx + 1, "id": step.id};

        const modelForm = new FormData();
        modelForm.set("model", this.state.modelId);
        modelForm.set("sessionId", this.state.sessionId);

        modelForm.set("step", JSON.stringify(stepData));
        modelForm.set("parameters", JSON.stringify(params));

		runModelRequest.open("POST", "/run_model/");
		runModelRequest.send(modelForm);
	}

	changeParamValue(paramId, newValue) {
        /* Deep copy the changed parameter */
		const newParams = Object.assign({}, this.state.modelParams);
        newParams[paramId] = Object.assign({}, newParams[paramId]);

        newParams[paramId].value = newValue;
        console.log('kita5', paramId, newValue)
		this.setState({modelParams: newParams});
	}

    fetchPlots(modelId, sessionId, step) {
        const fetchPlotsRequest = new XMLHttpRequest();

        fetchPlotsRequest.addEventListener("load", request => {
            this.props.fetchPlots(JSON.parse(request.target.response));
        });

        fetchPlotsRequest.addEventListener("error", request => {
            // TODO: Handle error
        });

        const getPlotsForm = new FormData();

        getPlotsForm.append("model", modelId);
        getPlotsForm.append("sessionId", sessionId);

        getPlotsForm.append("stepId", step.id);

        fetchPlotsRequest.open("POST", "/fetch_plots/");
        fetchPlotsRequest.send(getPlotsForm);
    }

    selectSession(event, data) {
        const sessionId = data.value;

        const {modelsInfo, stepIdx} = this.state;
        const model = modelsInfo[this.state.modelId];

        this.props.selectSession(sessionId);
        this.setState({sessionId: sessionId, stepIdx: 0});

        this.fetchPlots(this.state.modelId, sessionId, model.steps[0]);
    }

    selectModel(event, data) {
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

                console.log('ta6')
        this.setState({
            modelId: modelId,
            modelParams: modelParams
        });

        this.fetchSessions(modelId);
    }

    fetchSessions(modelId) {
        const fetchSessionsRequest= new XMLHttpRequest();

        fetchSessionsRequest.addEventListener("load", request => {
            this.setState({sessions: JSON.parse(request.target.response)});
        });

        fetchSessionsRequest.addEventListener("error", request => {
            // TODO: Handle error
        });

        const getSessionsForm = new FormData();
        getSessionsForm.append("model", modelId);

        fetchSessionsRequest.open("POST", "/fetch_sessions/");
        fetchSessionsRequest.send(getSessionsForm);
    }

    openParamsDialog(event, data) {
                console.log('kita6')
        if (!data.disabled) {
            this.setState({
                stepIdx: data.index,
                isParamsDialogOpen: true
            });
        }
    }

    createSession(e, data) {
        const crateSessionRequest= new XMLHttpRequest();

        crateSessionRequest.addEventListener("load", request => {
            const sessionId = JSON.parse(request.target.response);

            this.setState({
                sessions: this.state.sessions.concat(sessionId),
                sessionId: sessionId
            });

            this.props.selectSession(sessionId);
        });

        crateSessionRequest.addEventListener("error", request => {
            // TODO: Handle error
        });

        const createSessionForm = new FormData();
        createSessionForm.append("model", this.state.modelId);

        crateSessionRequest.open("POST", "/create_session/");
        crateSessionRequest.send(createSessionForm);
    }

    saveSession(e, data) {
        const saveSessionRequest= new XMLHttpRequest();

        saveSessionRequest.addEventListener("load", request => {
            // TODO: Do something
        });

        saveSessionRequest.addEventListener("error", request => {
            // TODO: Handle error
        });

        const saveSessionForm = new FormData();
        saveSessionForm.append("model", this.state.modelId);
        saveSessionForm.append("sessionId", this.state.sessionId);

        saveSessionRequest.open("POST", "/save_session/");
        saveSessionRequest.send(saveSessionForm);
    }

    deleteSession(e, data) {
        const deleteSessionRequest = new XMLHttpRequest();

        deleteSessionRequest.addEventListener("load", request => {
            // TODO: Do something
        });

        deleteSessionRequest.addEventListener("error", request => {
            // TODO: Handle error
        });

        const deleteSessionForm = new FormData();
        deleteSessionForm.append("model", this.state.modelId);
        deleteSessionForm.append("sessionId", this.state.sessionId);

        deleteSessionRequest.open("POST", "/delete_session/");
        deleteSessionRequest.send(deleteSessionForm);
    }

	render() {
        const {modelsInfo, sessionId, stepIdx, modelParams} = this.state;

        const model = modelsInfo[this.state.modelId];
        const step = (model != null) ? model.steps[stepIdx] : null;

        const modelDropdownChoice = Object.keys(modelsInfo).map((modelId, idx) => ({
            text: modelsInfo[modelId].name,
            value: modelId,
            key: idx
        }));

        const sessionDropdownChoice = this.state.sessions.map((sessionId, idx) => ({
            value: sessionId,
            text: sessionId,
            key: idx
        }));

		return (
			<div>
                <Form size="mini">
                    <Menu fluid>
                        <Menu.Item name="New session" disabled={model == null}
                            onClick={this.createSession}/>

                        <Menu.Item name="Save session" disabled={sessionId == null}
                            onClick={this.saveSession}/>

                        <Menu.Item name="Delete session" disabled={sessionId == null}
                            onClick={this.createSession}>
                        </Menu.Item>
                    </Menu>

                    <Menu vertical fluid>
                        <Menu.Item>
                            <Dropdown selection scrolling placeholder="Select model"
                                options={modelDropdownChoice}
                                onChange={this.selectModel}/>

                            <Dropdown selection scrolling placeholder="Select session"
                                value={this.state.sessionId}
                                options={sessionDropdownChoice}
                                onChange={this.selectSession}
                                disabled={model == null}/>
                        </Menu.Item>

                        {/*TODO: Add space*/}
                        <Menu.Item/>

                        {model != null && model.steps.map((step, idx) =>
                            <Menu.Item name={idx+1 + ". " + step.name} key={idx} index={idx}
                                active={stepIdx === idx}
                                disabled={idx > stepIdx || sessionId == null}
                                onClick={this.openParamsDialog}/>
                        )}
                    </Menu>

                    <Button primary> Export as csv </Button>
                </Form>

                <DragDropContainer isOpen={this.state.isParamsDialogOpen}
                    onClose={() => {console.log('ita7'); this.setState({isParamsDialogOpen: false})}}

                    csvColumnValues={this.state.csvColumnValues}
                    updateCsvColumnValues={this.updateCsvColumnValues}

                    resetParams={this.resetParamsToDefaults}

                    sessionId={sessionId}

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

