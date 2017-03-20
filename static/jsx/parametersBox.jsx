import React from "react";
import ReactDOM from "react-dom";

import {Segment, Dropdown, Icon, Button, Popup, Form, Menu, Input, Modal} from "semantic-ui-react";
import {DropdownEditParam, TextParam, CheckboxParam, RadioParam, DropdownParam, SliderParam, RangeParam} from "./UIElements.jsx"

import HTML5Backend from "react-dnd-html5-backend";
import {DragDropContext, DragSource, DropTarget} from "react-dnd";

import 'rc-slider/assets/index.css';

const CSVFieldSource = {
    beginDrag(props) {
        return {fieldname: props.fieldname};
    },
    endDrag(props, monitor) {
        if (monitor.didDrop()) {
            props.removeCSVField(props.fieldname);
        }
    }
}

function CSVField(props) {
    const opacity = props.isDragging ? 0 : 1;

    return props.connectDragSource(
        <div style={{opacity}}>
            {props.isDragging && '(and I am being dragged now)'}
            {props.fieldname}
        </div>
    );
}

const CSVFieldWrapper = DragSource("CSV_FIELDNAME", CSVFieldSource,
    (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    })
)(CSVField);

function CSVFieldTargetContainer(props) {
    const style = {
        border: '1px dashed gray',
        borderRadius: "5px",
        padding: '0.5rem 1rem',
        margin: '.5rem',
        backgroundColor: 'white',
        display: "flex"
    };

    return props.connectDropTarget(
        <div style={style}>
            <div style={{"flex": 1}}>
                <CSVFieldWrapper removeCSVField={props.removeCSVField}
                    fieldname={props.parameter.value}/>
            </div>

            <div style={{"textAlign": "center", "flex": 1}}>
                &rArr;
            </div>

            <Popup on="hover" content={props.parameter.description} trigger={
                <div style={{"textAlign": "right", "flex": 1}}>
                    {props.parameter.name}
                </div>
            }/>
        </div>
    );
}

const CSVFieldTarget = {
    drop: (props, monitor) => {
        const fieldname = monitor.getItem().fieldname;

        props.onChange(fieldname);

        if (props.parameter.value != '') {
            props.addToCSVFieldPool(props.parameter.value);
        }
    }
};

const CSVFieldTargetContainerWrapper = DropTarget("CSV_FIELDNAME", CSVFieldTarget,
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget()
    })
)(CSVFieldTargetContainer);

/**
 * Component for uploading CSV file and
 * mapping of the fieldnames from the file to the model parameters
 */
class CSVFieldsMappingDialog extends React.Component {
    constructor() {
        super();

        this.uploadCSV = this.uploadCSV.bind(this);
        this.removeCSVField = this.removeCSVField.bind(this);
        this.addToCSVFieldPool = this.addToCSVFieldPool.bind(this);
    }

    uploadCSV(event) {
        const file = event.target.files[0];

        if (file != null) {
            const uploadCSVFileRequest = new XMLHttpRequest();

            uploadCSVFileRequest.addEventListener("load", request => {
                const CSVDescription = JSON.parse(request.target.response);

                /* Update filename parameter */
                this.props.onChange(0, 0, file.name);
                this.props.updateCSVFields(CSVDescription.fieldnames);
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

    removeCSVField(fieldnameToRemove) {
        const CSVFields = this.props.CSVFieldsPool.filter(fieldname => {
            if (fieldnameToRemove != fieldname) return fieldname;
        });

        this.props.updateCSVFields(CSVFields);
    }

    addToCSVFieldPool(fieldname) {
        const CSVFields = this.props.CSVFieldsPool.slice();

        CSVFields.push(fieldname);
        this.props.updateCSVFields(CSVFields);
    }

    render() {
        const csvFile = this.props.params.find(elem => elem.type == "file");
        const stepIdx = this.props.step.index;

        return (
            <Modal size="fullscreen" open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header>
                    {this.props.step.name}

                    <Input placeholder={csvFile.description} value={csvFile.value} size="mini"
                        style={{"float": "right"}}>
                        <input disabled/>

                        <span style={{display: "none"}}>
                        <input type="file" ref={input => {this.uploadCSVButton = input}}
                            onChange={this.uploadCSV}/>
                        </span>
                        <Button onClick={() => {this.uploadCSVButton.click()}}>
                            {csvFile.name}
                        </Button>
                    </Input>
                </Modal.Header>

                <Modal.Content>
                    <Modal.Description>
                        <Segment.Group horizontal>
                            <Segment loading={this.props.CSVLoading}>
                                {this.props.CSVFieldsPool.map((fieldname, idx) =>
                                    <CSVFieldWrapper key={idx} removeCSVField={this.removeCSVField}
                                        fieldname={fieldname}/>
                                )}
                            </Segment>

                            <Segment>
                                {/* Filter out only drag and drop parameters */}
                                {this.props.params.reduce((CSVFields, param, idx) => {
                                    if (param.type == "dragDrop") {
                                        CSVFields.push(
                                            <CSVFieldTargetContainerWrapper parameter={param}
                                                onChange={this.props.onChange.bind(this, stepIdx, idx)}
                                                addToCSVFieldPool={this.addToCSVFieldPool} key={idx}
                                                removeCSVField={this.removeCSVField}
                                            />
                                        );
                                    }

                                    return CSVFields;
                                }, [])}
                            </Segment>
                        </Segment.Group>
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

const CSVFieldsMappingDialogWrapper = DragDropContext(HTML5Backend)(CSVFieldsMappingDialog);

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
            return <SliderParam parameter={props.param} onChange={props.onChange}/>;
        case "range":
            return <RangeParam parameter={props.param} dataSet={props.dataSet}
                onChange={props.onChange}/>;
        case "text":
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
        const params = this.props.params.map(param => {
            switch (param.type) {
            case "range":
            case "slider":
                return (param.scale != null) ? param.value / param.scale : param.value;
            case "radio":
                return param.returnValue[param.value];
            case "checkbox":
                return param.value ? param.returnValue[0] : param.returnValue[1];
            default:
                return param.value;
            }
        });

        this.props.onRunModel(this.props.model.id, this.props.step.index+1, params);
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
            });

            fetchCSVColumnRequest.addEventListener("error", request => {
                // TODO: Handle error
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

        const stepIdx = this.props.step.index;
        const stepParams = this.props.params[stepIdx];

        if (this.props.step.index == 0 && this.state.page == 0) {
            return <CSVFieldsMappingDialogWrapper {...this.props} params={stepParams}
                CSVLoading={this.state.CSVOperationActive}
                goToNextPage={this.goToNextPage}/>;
        }

        return (
            <Modal size="fullscreen" onOpen={() => this.setState({page: 0})}
                open={this.props.isOpen} onClose={this.props.onClose}>
                <Modal.Header> {this.props.step.name} </Modal.Header>

                <Modal.Content>
                    <Form>
                        {stepParams != null && stepParams.map((param, idx) => {
                            let dataSet;

                            if (param.source != null) {
                                const CSVParams = this.props.params[0];

                                const srcParam = CSVParams.find(p => p.id == param.source);
                                const srcField = (srcParam != null) ? srcParam.value : null;

                                dataSet = this.getCSVColumnValues(srcField);
                            } else if (param.type == "dropdownEdit") {
                                dataSet = this.props.CSVFieldsPool;
                            }

                            return (
                                <Param onChange={this.props.onChange.bind(this, stepIdx, idx)}
                                    key={idx} param={param} dataSet={dataSet}
                                />
                            );
                        })}
                    </Form>
                </Modal.Content>

                <Modal.Actions>
                    <Button color='green' inverted onClick={this.runModel}>
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
            /* Object with description of the models */
			modelsInfo: {},

            /* Name of the currently selected model */
            currModelId: null,

            /* Index of the current step */
            currStepIdx: null,

            /* Array of parameters of selected model */
            currModelParams: [],

            /* Array of unused CSV fieldnames from the uploaded CSV file */
            CSVFieldsPool: [],

            /* Object of column values for referenced fields */
            CSVColumnValues: {},

            /* Controls whether parameters dialog should be open */
            isParamsDialogOpen: false,

            errorMsg: null
		};

        this.fetchModelsMetadata = this.fetchModelsMetadata.bind(this);

        this.runModel = this.runModel.bind(this);
        this.changeModel = this.changeModel.bind(this);
        this.updateCSVFields = this.updateCSVFields.bind(this);
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
                stepParams.map(param => (param.defaultValue != null) ? param.defaultValue : '');
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

    updateCSVFields(fieldnames) {
        this.setState({CSVFieldsPool: fieldnames.sort((a, b) =>
            a.toLowerCase().localeCompare(b.toLowerCase())
        )});
    }

    updateCSVColumnValues(fieldname, values) {
        const CSVColumnValues = Object.assign({}, CSVColumnValues);
        CSVColumnValues[fieldname] = values;

        this.setState({CSVColumnValues: CSVColumnValues});
    }

    /* Resets parameter values in-place */
    resetParamsToDefaults(params) {
        params.forEach(param => {
            param.value = param.defaultValue;
            return param;
        });
    }

    // TODO: Add session ID
	runModel(modelId, stepIdx, params) {
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
        modelForm.set("parameters", JSON.stringify([stepIdx, ...params]));

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

        const modelDropdownChoice = Object.keys(this.state.modelsInfo).map(model => ({
            text: this.state.modelsInfo[model].name,
            value: model
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

                        {selectedModel != null && selectedModel.steps.map((step, idx) =>
                            <Menu.Item name={idx+1 + ". " + step.name} key={idx} index={idx}
                                active={this.state.currStepIdx === idx}
                                disabled={idx > this.state.currStepIdx}
                                onClick={this.openParamsDialog}/>
                        )}
                    </Menu>

                    <Button primary> Export as CSV </Button>
                </Form>

                <ParametersDialog isOpen={this.state.isParamsDialogOpen}
                    onClose={() => {this.setState({isParamsDialogOpen: false})}}
                    updateCSVColumnValues={this.updateCSVColumnValues}
                    CSVColumnValues={this.state.CSVColumnValues}
                    CSVFieldsPool={this.state.CSVFieldsPool}
                    updateCSVFields={this.updateCSVFields}
                    params={this.state.currModelParams}
                    onChange={this.changeParamValue}
                    onRunModel={this.runModel}
                    model={selectedModel}
                    step={currentStep}
                />
		    </div>
		);
	}
}

export default ParametersBox;

