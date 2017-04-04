import React from "react";
import ReactDOM from "react-dom";

import {Grid, Header, Message, Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal} from "semantic-ui-react";
import {DropdownEditParam, TextParam, CheckboxParam, RadioParam} from "./UIElements.jsx";
import {DropdownParam, SliderParam, RangeParam, DragDropParam} from "./UIElements.jsx";
import {FileInputParam} from "./UIElements.jsx";

import HTML5Backend from "react-dnd-html5-backend";
import {DragDropContext} from "react-dnd";

import 'rc-slider/assets/index.css';

function stringCmp(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
}

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

        this.updateDependentParams = this.updateDependentParams.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.step == null) return;

        let currPage = this.state.page;

        /* Page must be reset when step changes */
        if (this.props.stepIdx != nextProps.stepIdx) {
            this.setState({page: 0});
            currPage = 0;
        }

        const pageLayout = nextProps.step.layout[currPage];
        const pageParams = pageLayout.usedParams;

        this.updateDependentParams(pageParams);
    }

    updateDependentParams(paramsToUpdate) {
        const {step, params, csvColumnValues} = this.props;
        const fieldnamesToFetch = {};

        /* Read all csv columns used in the current step */
        for (let paramId of paramsToUpdate) {
            const param = params[paramId];

            if (param.source != null && param.source.action == "readCSV") {
                const uniqueOnly = param.source.unique == true;

                const csvColumnsToFetch = params[param.source.id].value;
                const filename = params[param.source.file].value;

                if (filename != null && csvColumnsToFetch != null) {
                    let fieldnames = fieldnamesToFetch[filename];

                    /* Initialize if entry doesn't exist */
                    if (fieldnamesToFetch[filename] == null) {
                        fieldnames = fieldnamesToFetch[filename] = {};
                    }

                    csvColumnsToFetch.map(val => {
                        if (!this.props.csvColumnValues.hasOwnProperty(val)) {
                            fieldnames[val] = uniqueOnly;
                        }
                    });
                }
            }
        }

        /* Send one request per csv file */
        for (let filename in fieldnamesToFetch) {
            const fieldnames = fieldnamesToFetch[filename];
            this.readCsvColumn(filename, fieldnames);
        }
    }

    uploadCsvFile(paramId, event) {
        const file = event.target.files[0];

        if (file != null) {
            const uploadCsvFileRequest = new XMLHttpRequest();

            uploadCsvFileRequest.addEventListener("load", request => {
                const csvFieldnames = JSON.parse(request.target.response);

                const targetParamId = this.props.params[paramId].target;
                const targetParam = this.props.params[targetParamId];

                /* Update filename parameter */
                this.props.onChange(paramId, file.name);

                /* Update referenced target parameter */
                this.props.onChange(targetParamId, csvFieldnames.sort());

                /* Update all parameters corresponding to the same dragDrop group */
                for (let paramId in this.props.params) {
                    const param = this.props.params[paramId];

                    if (paramId != targetParamId && param.group == targetParam.group) {
                        this.props.onChange(paramId, []);
                    }
                }

                this.props.onChange
            });

            uploadCsvFileRequest.addEventListener("error", request => {
                //TODO: Add error handling
            });

            const csvFileForm = new FormData();
            csvFileForm.append("model", this.props.modelId);
            csvFileForm.append("session", this.props.sessionId);
            csvFileForm.append("csvFile", file);

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
                    return csvValues[param.value[0]] + ", " + csvValues[param.value[1]];
                }

                if (param.returnValue != null) {
                    const retVal = param.returnValue;
                    const choice = param.choice;

                    const k = (retVal[1] - retVal[0]) / (choice[1] - choice[0]);
                    const l = retVal[0] - k*choice[0];

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
                    const l = retVal[0] - k*choice[0];

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
            csvFieldnameForm.set("model", this.props.modelId);
            csvFieldnameForm.set("session", this.props.sessionId);
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
        const nextPageLayout = this.props.step.layout[this.state.page - 1];
        const nextPageParams = nextPageLayout.usedParams;

        this.updateDependentParams(nextPageParams);
        this.setState({page: this.state.page - 1});
    }

    goToNextPage() {
        if (!this.validateParams()) return;

        if (this.state.page + 1 < this.props.step.layout.length) {
            const nextPageLayout = this.props.step.layout[this.state.page + 1];
            const nextPageParams = nextPageLayout.usedParams;

            this.updateDependentParams(nextPageParams);
            this.setState({page: this.state.page + 1});
        } else {
            this.runModel();
        }
    }

    resetParams() {
        const {step, params} = this.props;
        const page = step.layout[this.state.page];

        const pageParams = page.usedParams.map(paramId =>
            params[paramId]
        );

        this.props.resetParams(pageParams);

        page.usedParams.forEach(paramId =>
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

class CreateSessionDialog extends React.Component {
    constructor() {
        super();

        this.state = {
            newSessionName: '',
            errorMsg: null
        };

        this.createSession = this.createSession.bind(this);
        this.setSessionName = this.setSessionName.bind(this);
    }

    componentWillReceiveProps() {
        this.setState({errorMsg: null});
    }

    createSession(event, data) {
        if (event.key == "Enter") event.preventDefault();

        if (event.key == null || event.key == "Enter") {
            const newSessionName = this.state.newSessionName;

            /* Validate session name */
            if (newSessionName == '') {
                this.setState({errorMsg: "Session name cannot be empty"});
            } else if (this.props.sessions.includes(newSessionName)) {
                this.setState({errorMsg: "Session name already exists"});
            } else {
                const createSessionRequest= new XMLHttpRequest();

                createSessionRequest.addEventListener("load", request => {
                    const sessionName = JSON.parse(request.target.response);

                    this.props.onCreateSession(sessionName);
                    this.props.onClose();
                });

                createSessionRequest.addEventListener("error", request => {
                    // TODO: Handle error
                });

                const createSessionForm = new FormData();
                createSessionForm.append("model", this.props.modelId);
                createSessionForm.append("session", this.state.newSessionName);

                createSessionRequest.open("POST", "/create_session/");
                createSessionRequest.send(createSessionForm);
            }
        }
    }

    setSessionName(e, data) {
        this.setState({
            newSessionName: data.value,
            errorMsg: null
        });
    }

    render() {
        const {newSessionName, errorMsg} = this.state;

        return (
            <Modal open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header> Create new session </Modal.Header>

                <Modal.Content>
                    <Form>
                        <Form.Field>
                            <label> Session name </label>
                            <Input focus placeholder="Enter unique session name"
                                onKeyPress={this.createSession}
                                onChange={this.setSessionName}
                                error={errorMsg != null}
                            />
                        </Form.Field>

                        {errorMsg != null &&
                            <Form.Field>
                                <Message negative>
                                    <Message.Header>
                                        Incorrect session name
                                    </Message.Header>

                                    {errorMsg}
                                </Message>
                            </Form.Field>
                        }
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button primary onClick={this.createSession}>
                        Create session
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

            /* List of the user session names for the current model */
            sessions: [],


            /* Name of the currently used model */
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

            isCreateSessionDialogOpen: false,

            // TODO:
            errorMsg: null,
		};

        // Parameters whose values are csv column fieldnames which will be used
        this.srcParams = {};

        this.addSession = this.addSession.bind(this);
        this.saveSession = this.saveSession.bind(this);
        this.loadSession = this.loadSession.bind(this);
        this.deleteSession = this.deleteSession.bind(this);
        this.restoreSession = this.restoreSession.bind(this);

        this.fetchModelsMetadata = this.fetchModelsMetadata.bind(this);
        this.selectModel = this.selectModel.bind(this);
        this.runModel = this.runModel.bind(this);

        this.fetchSessions = this.fetchSessions.bind(this);
        this.selectSession = this.selectSession.bind(this);

        this.changeParamValue = this.changeParamValue.bind(this);

        this.openParamsDialog = this.openParamsDialog.bind(this);
        this.openNewSessionDialog = this.openNewSessionDialog.bind(this);

        this.updateCsvColumnValues = this.updateCsvColumnValues.bind(this);
	}

	componentDidMount() {
		this.fetchModelsMetadata();
	}

    getPageParams(params, layout) {
        if (layout == null) return;

        if (!Array.isArray(layout)) {
            params.push(layout);
            return;
        }

        for (let elem of layout) {
            this.getPageParams(params, elem);
        }
    }

	fetchModelsMetadata() {
        const fetchModelsMetadataRequest = new XMLHttpRequest();

        fetchModelsMetadataRequest.addEventListener("load", request => {
            const {username, models} = JSON.parse(request.target.response);

            /* Stack together all parameters on per page basis */
            for (let model of Object.values(models)) {
                for (let step of Object.values(model.steps)) {
                    for (let pageIdx in step.layout) {
                        const page = step.layout[pageIdx];

                        const pageParams = page.usedParams = [];
                        this.getPageParams(pageParams, page.header);
                        this.getPageParams(pageParams, page.body);
                    }
                }
            }

            this.setState({modelsInfo: models});
            this.props.onUsernameChange(username);
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

	runModel(currStep, runParamValues) {
		const runModelRequest = new XMLHttpRequest();

		runModelRequest.addEventListener("load", request => {
            const {consoleOutput, plots} = JSON.parse(request.target.response);
            this.props.onModelOutputChange(consoleOutput, plots);

            const model = this.state.modelsInfo[this.state.modelId];

            if (this.state.stepIdx + 1 < model.steps.length) {
                this.setState({stepIdx: this.state.stepIdx + 1});
            }
		});

		runModelRequest.addEventListener("error", request => {
            this.setState({errorMsg: request.target.response});
		});

        const allParamValues = {};
        for (let paramId in this.state.modelParams) {
            const {value} = this.state.modelParams[paramId];

            allParamValues[paramId] = value;
        }

        const modelForm = new FormData();
        modelForm.set("model", this.state.modelId);
        modelForm.set("session", this.state.sessionId);

        modelForm.set("stepId", currStep.id);
        modelForm.set("stepIdx", this.state.stepIdx + 1);

        modelForm.set("runParamValues", JSON.stringify(runParamValues));
        modelForm.set("allParamValues", JSON.stringify(allParamValues));

		runModelRequest.open("POST", "/run_model/");
		runModelRequest.send(modelForm);
	}

	changeParamValue(paramId, newValue) {
        /* Deep copy the changed parameter */
		const newParams = Object.assign({}, this.state.modelParams);
        newParams[paramId] = Object.assign({}, newParams[paramId]);

        newParams[paramId].value = newValue;

        /* Check if param is used as a source param */
        if (this.srcParams.hasOwnProperty(paramId)) {
            const srcParam = this.srcParams[paramId];

            if (srcParam.action == "readCSV") {
                const newCsvColumnValues = Object.assign({}, this.state.csvColumnValues);

                /* Remove CSV columns which are outdated */
                if (Array.isArray(newValue)) {
                    newValue.forEach(value => {
                        delete newCsvColumnValues[value];
                    });
                } else {
                    delete newCsvColumnValues[newValue];
                }

                this.setState({csvColumnValues: newCsvColumnValues});
            } else {
                /* Reset all parameters which use this as source */
                srcParam.targetIds.forEach(targetId => {
                    newParams[targetId] = Object.assign({}, newParams[targetId]);
                    newParams[targetId].value = newParams[targetId].defaultValue;
                });
            }
        }

        this.setState({modelParams: newParams});
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

        this.setState({
            modelId: modelId,
            modelParams: modelParams
        });

        this.props.onModelChange(modelId);

        /* Reset source parameters list */
        this.srcParams = {};
        for (let paramId in model.parameters) {
            const param = model.parameters[paramId];

            /* Make a note of all parameters used as an entry to a resource(eg. CSV) */
            if (param.source != null) {
                if (this.srcParams[param.source.id] != null) {
                    this.srcParams[param.source.id].targetIds.push(paramId);
                } else {
                    this.srcParams[param.source.id] = {
                        action: param.source.action,
                        targetIds: [paramId]
                    }
                }
            }
        }

        this.fetchSessions(modelId);
    }

    openParamsDialog(event, data) {
        if (!data.disabled) {
            this.setState({
                stepIdx: data.index,
                isParamsDialogOpen: true
            });
        }
    }

    openNewSessionDialog(e, data) {
        if (this.state.modelId != null) {
            this.setState({isCreateSessionDialogOpen: true});
        }
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

    selectSession(event, data) {
        const sessionId = data.value;

        this.props.onSessionChange(sessionId);
        this.setState({sessionId: sessionId, stepIdx: 0});

        this.loadSession(this.state.modelId, sessionId);
    }

    // Add session to the sorted session list
    addSession(newSession) {
        // TODO: Use binary search to improve performance
        const newSessions = this.state.sessions.slice();
        newSessions.push(newSession);

        this.setState({
            sessions: newSessions.sort(),
            sessionId: newSession,
            stepIdx: 0
        });

        this.loadSession(this.state.modelId, newSession);
    }

    loadSession(modelId, sessionId) {
        const loadSessionRequest= new XMLHttpRequest();

        loadSessionRequest.addEventListener("load", request => {
            const newParams = Object.assign({}, this.state.modelParams);

            /* Deep copy of parameters */
            Object.keys(newParams).forEach(paramId => {
                newParams[paramId] = Object.assign({}, newParams[paramId]);
            });

            const sessionMetadata = JSON.parse(request.target.response);

            if (Object.keys(sessionMetadata).length > 0) {
                const paramValues = sessionMetadata.paramValues;

                /* Restore parameter values for this session */
                Object.keys(paramValues).forEach(paramId => {
                    newParams[paramId].value = paramValues[paramId];
                });

                /* Restore step index for this session */
                this.setState({stepIdx: sessionMetadata.stepIdx});

                /* Restore plots list for this session*/
                this.props.onPlotsFetch(sessionMetadata.plots);
            } else {
                /* Reset step index and parameters to defaults */
                this.resetParamsToDefaults(newParams);
                this.setState({stepIdx: 0});
            }

            this.setState({
                modelParams: newParams,
                csvColumnValues: {}
            });
        });

        loadSessionRequest.addEventListener("error", request => {
            // TODO: Handle error
        });

        const loadSessionForm = new FormData();
        loadSessionForm.append("model", modelId);
        loadSessionForm.append("session", sessionId);

        loadSessionRequest.open("POST", "/load_session/");
        loadSessionRequest.send(loadSessionForm);
    }

    saveSession(e, data) {
        if (this.state.sessionId != null) {
            const saveSessionRequest= new XMLHttpRequest();

            saveSessionRequest.addEventListener("load", request => {
                // TODO: Do something
            });

            saveSessionRequest.addEventListener("error", request => {
                // TODO: Handle error
            });

            const saveSessionForm = new FormData();
            saveSessionForm.append("model", this.state.modelId);
            saveSessionForm.append("session", this.state.sessionId);

            saveSessionRequest.open("POST", "/save_session/");
            saveSessionRequest.send(saveSessionForm);
        }
    }

    deleteSession(e, data) {
        if (this.state.sessionId != null) {
            const deleteSessionRequest = new XMLHttpRequest();

            deleteSessionRequest.addEventListener("load", request => {
                this.setState({
                    sessionId: null,

                    sessions: this.state.sessions.filter(session =>
                        session != this.state.sessionId)
                });
            });

            deleteSessionRequest.addEventListener("error", request => {
                // TODO: Handle error
            });

            const deleteSessionForm = new FormData();
            deleteSessionForm.append("model", this.state.modelId);
            deleteSessionForm.append("session", this.state.sessionId);

            deleteSessionRequest.open("POST", "/delete_session/");
            deleteSessionRequest.send(deleteSessionForm);
        }
    }

    restoreSession() {
        // TODO: Retreive session information from temp, not saved
    }

	render() {
        const {modelsInfo, modelId, sessionId, stepIdx, modelParams} = this.state;

        const model = modelsInfo[modelId];
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
                        <Menu.Item name="New session" disabled={modelId == null}
                            onClick={this.openNewSessionDialog}/>

                        <Menu.Item name="Save session" disabled={sessionId == null}
                            onClick={this.saveSession}/>

                        <Menu.Item name="Delete session" disabled={sessionId == null}
                            onClick={this.deleteSession}>
                        </Menu.Item>
                    </Menu>

                    <Menu vertical fluid>
                        <Menu.Item>
                            <Dropdown selection scrolling placeholder="Select model"
                                options={modelDropdownChoice}
                                onChange={this.selectModel}/>

                            <Dropdown selection scrolling placeholder="Select session"
                                value={(sessionId != null) ? sessionId : ''}
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
                    onClose={() => {this.setState({isParamsDialogOpen: false})}}

                    csvColumnValues={this.state.csvColumnValues}
                    updateCsvColumnValues={this.updateCsvColumnValues}

                    resetParams={this.resetParamsToDefaults}

                    modelId={modelId}
                    sessionId={sessionId}

                    step={step}
                    stepIdx={stepIdx}
                    params={modelParams}

                    onChange={this.changeParamValue}
                    onRunModel={this.runModel}
                />

                <CreateSessionDialog isOpen={this.state.isCreateSessionDialogOpen}
                    onClose={() => {this.setState({isCreateSessionDialogOpen: false})}}
                    onCreateSession={this.addSession}
                    sessions={this.state.sessions}
                    modelId={this.state.modelId}
                />
		    </div>
		);
	}
}

export default ParametersBox;

