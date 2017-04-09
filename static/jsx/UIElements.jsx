import React from "react";

import Slider, {Range} from "rc-slider";
import {DragSource, DropTarget} from "react-dnd";
import {Grid, Segment, Header, Form, Popup, Input, Icon, Button, Checkbox, Radio, Dropdown} from "semantic-ui-react";

function paramShallowCompare(nextProps, currProps) {
    for (let prop in nextProps) {
        if (prop == "onChange") continue;

        if (nextProps[prop] != currProps[prop]) {
            return true;
        }
    }

    return false;
}

function FileInputParam(props) {
    const {name, description, value=''} = props.parameter;

    let uploadCSVButtonRef;

    return (
        <Form.Field>
            <span style={{display: "none"}}>
                <input type="file" ref={input => {uploadCSVButtonRef = input}}
                    onChange={props.onChange}/>
            </span>

            <Button icon labelPosition="right" size="mini">
                <Button.Content>
                    {(value != '') ? value : description}
                </Button.Content>

                <Icon name="upload" color="teal"
                    onClick={() => {uploadCSVButtonRef.click()}}/>
            </Button>
        </Form.Field>
    );
}

// TODO: Add required prop
function TextParam(props) {
    const {name, description, value='', defaultValue, min, max} = props.parameter;

    let valueType;
    switch (props.parameter.validation) {
        case "integer":
            valueType = "number";
            break;
        case "hidden":
            valueType: "password";
            break;
        default:
            valueType = "text";
    }

    return (
        <Form.Field error={defaultValue == null && value == ''}>
            <Popup on="hover" content={description} trigger={
                <label> {name} </label>
            }/>

            <Input focus placeholder={description} type={valueType} min={min} max={max}
                value={value} onChange={(e, data) => {props.onChange(data.value)}}/>
        </Form.Field>
    );
}

// TODO: Add required prop
function CheckboxParam(props) {
    const {name, description, value, defaultValue} = props.parameter;

    return (
        <Form.Field error={value == null}>
            <Checkbox checked={value} onChange={() => {props.onChange(!value)}}
                indeterminate={typeof value != "boolean"} label={
                    <Popup on="hover" content={description} trigger={
                        <label> {name} </label>
                }/>}
            />
        </Form.Field>
    );
}

// TODO: Add required prop
function RadioParam(props) {
    const {name, description, value, defaultValue} = props.parameter;

    return (
        <Form.Field error={value == null}>
            <Popup on="hover" content={description} trigger={
                <label> {name} </label>
            }/>

            <Form.Group grouped>
                {props.parameter.choice.map((choice, idx) =>
                    <Form.Field key={idx}>
                        <Radio label={choice} name={props.parameterId} checked={value == idx}
                            onChange={() => {props.onChange(idx)}}
                        />
                    </Form.Field>
                )}
            </Form.Group>
        </Form.Field>
    );
}

class DropdownParam extends React.Component {
    shouldComponentUpdate(nextProps) {
        return paramShallowCompare(nextProps, this.props);
    }

    render() {
        const {name, description, value=[]} = this.props.parameter;

        let dropdownOptions = [];
        if (this.props.options != null) {
            dropdownOptions = this.props.options.map((item, idx) => ({
                value: item, text: item, key: idx
            }));
        }

        return (
            <Form.Field error={this.props.isError}>
                <Popup on="hover" content={description} trigger={
                    <label> {name} </label>
                }/>

                <Dropdown fluid search selection multiple value={value}
                    placeholder={description} options={dropdownOptions}
                    onChange={(e, data) => {this.props.onChange(data.value)}}
                />
            </Form.Field>
        );
    }
}

class DropdownEditParam extends React.Component {
    componentWillMount() {
        const {parameter, options, onChange} = this.props;
        const defaults = parameter.fieldDefaultValue;

        if (options != null && parameter.value == null) {
            onChange(this.getDefaultValue(options.length, defaults));
        }

    }

    componentWillReceiveProps(nextProps) {
        const {parameter, options, onChange} = nextProps;
        const defaults = parameter.fieldDefaultValue;

        /* Detect data set change and reset paramter value */
        if (options != this.props.options && options != null) {
            if (parameter.defaultValue == null) {
                onChange(this.getDefaultValue(options.length, defaults));
            } else {
                // Default value was already set as value if options have changed
            }
        }
    }

    shouldComponentUpdate(nextProps) {
        return paramShallowCompare(nextProps, this.props);
    }

    getDefaultValue(size, defaults) {
        const newValue = [];

        for (let i = 0; i < size; i++) {
            newValue.push(defaults[Math.min(i, defaults.length - 1)]);
        }

        return newValue;
    }

    render() {
        const {name, description, validation=[], fieldDefaultValue} = this.props.parameter;

        let {value} = this.props.parameter;
        const {options} = this.props;

        let dropdownOptions = [];
        if (options != null) {
            if (value == null) {
                value = this.getDefaultValue(options.length, fieldDefaultValue);
            }

            dropdownOptions = this.props.options.map((item, idx) => {
                let valueType;
                switch (validation[Math.min(idx, validation.length - 1)]) {
                    case "integer":
                        valueType = "number";
                        break;
                    case "hidden":
                        valueType: "password";
                        break;
                    default:
                        valueType = "text";
                }

                return {
                    value: item,
                    text: item,
                    key: idx,

                    content: (
                        <Input focus value={value[idx]} label={{content: item}}
                            type={valueType} onChange={(e, data) => {
                                const newValue = value.slice();

                                newValue[idx] = data.value;
                                this.props.onChange(newValue);
                            }
                        }/>
                    )
                }
            });
        }

        return (
            <Form.Field>
                <Popup on="hover" content={description} trigger={
                    <label> {name} </label>
                }/>

                <Dropdown fluid search closeOnChange={false} selection value=''
                    placeholder={description} options={dropdownOptions}/>
            </Form.Field>
        );
    }
}

/* Returns the marks object used by the slider and range element */
function getMarks(min, max, step, unit, markCnt, dataSet) {
    const marks = {};

    /* Check if all marking values will be integers */
    const isInteger = Number.isInteger(min) && Number.isInteger(step);

    if (min < max && markCnt > 0) {
        /* Number of marks must not be greater than number of steps */
        const stepCnt = Math.floor((max - min) / step) + 1;
        if (stepCnt < markCnt) markCnt = stepCnt;

        let markDist;
        if (markCnt - 1 <= 0) {
            markDist = max - min + step;
        } else {
            markDist = (max - min) / (markCnt - 1);
        }

        const startIdx = (markCnt - 1 > 0) ? min : (max + min) / 2;

        for (let i = startIdx; i <= max; i += markDist) {
            const val = isInteger ? Math.round(i) : i;

            if (dataSet != null) {
                marks[val] = dataSet[val] + unit;
            } else {
                marks[val] = (isInteger ? val : val.toFixed(2)) + unit;
            }
        }
    }

    return marks;
}

class SliderParam extends React.Component {
    componentWillMount() {
        const {parameter, dataSet, onChange} = this.props;

        if (dataSet != null && parameter.value == null) {
            onChange([0, dataSet.length - 1]);
        }
    }

    componentWillReceiveProps(nextProps) {
        const {dataSet, parameter, onChange} = nextProps;

        /* Detect data set change and reset paramter value */
        if (dataSet != this.props.dataSet && dataSet != null) {
            if (parameter.defaultValue == null) {
                onChange([0, dataSet.length - 1]);
            }
        }
    }

    shouldComponentUpdate(nextProps) {
        return paramShallowCompare(nextProps, this.props);
    }

    render() {
        const {name, value=0, unit='', choice, step, markCnt=0} = this.props.parameter;
        const [min, max] = choice;

        /* Construct marks object */
        const marks = getMarks(min, max, step, unit, markCnt, this.props.dataSet);

        const sliderStyle = {
            "width": "auto",
            "marginLeft": "1em",
            "marginRight": "1em"
        };

        const displayValue = (this.props.dataSet == null) ? value : this.props.dataSet[value];

        return (
            <Form.Field style={(Object.keys(marks).length > 0) ? {"marginBottom": "2em"} : {}}>
                <Popup on="hover" content={this.props.parameter.description} trigger={
                    <label style={{"display": "inline"}}> {name} </label>
                }/>

                {!this.props.disabled &&
                    <div style={{"display": "inline", "color": "#96dbfa", "marginLeft": "5px"}}>
                        <strong> {displayValue + unit} </strong>
                    </div>
                }

                <Slider min={min} max={max} step={step} marks={marks} value={value}
                    style={sliderStyle} disabled={this.props.disabled}
                    onChange={newValue => {
                        /* Check if all values will be integers */
                        const isInteger = Number.isInteger(min) && Number.isInteger(step);

                        // TODO: Remove if mark objects treated as dots bug is resolved
                        // Marks should not be selectable if they do not fit the step
                        newValue = min + Math.round((newValue - min) / step)*step;
                        newValue = isInteger ? newValue : newValue.toFixed(2);

                        // TODO: Remove if bug [value > max] is resolved
                        if (newValue <= max) this.props.onChange(newValue);
                    }}
                />
           </Form.Field>
        );
    }
}

class RangeParam extends React.Component {
    componentWillMount() {
        const {parameter, dataSet, onChange} = this.props;

        if (dataSet != null && parameter.value == null) {
            onChange([0, dataSet.length - 1]);
        }
    }

    componentWillReceiveProps(nextProps) {
        const {dataSet, parameter, onChange} = nextProps;

        /* Detect data set change and reset paramter value */
        if (dataSet != this.props.dataSet && dataSet != null) {
            if (parameter.defaultValue == null) {
                onChange([0, dataSet.length - 1]);
            }
        }
    }

    shouldComponentUpdate(nextProps) {
        return paramShallowCompare(nextProps, this.props);
    }

    render() {
        const {name, value=[0, 0], choice, step=1, markCnt=0, unit=''} = this.props.parameter;

        let [min, max] = [0, 0];
        if (choice != null) {
            [min, max] = choice;
        } else if (this.props.dataSet != null) {
            [min, max] = [0, this.props.dataSet.length - 1];
        }

        /* Construct marks object */
        const marks = getMarks(min, max, step, unit, markCnt, this.props.dataSet);

        let [lowValue, highValue] = value;
        if (this.props.dataSet != null) {
            lowValue  = this.props.dataSet[value[0]];
            highValue = this.props.dataSet[value[1]];
        }

        const rangeStyle = {
            "width": "auto",
            "marginLeft": "1em",
            "marginRight": "1em"
        };

        return (
            <Form.Field style={(Object.keys(marks).length > 0) ? {marginBottom: "2em"} : {}}>
                <Popup on="hover" content={this.props.parameter.description} trigger={
                    <label style={{display: "inline"}}> {name} </label>
                }/>

                {!this.props.disabled &&
                    <div style={{display: "inline", color: "#96dbfa", marginLeft: "5px"}}>
                        <strong> {lowValue + unit} </strong>
                        &hArr;
                        <strong> {highValue + unit} </strong>
                    </div>
                }

                <Range count={2} disabled={this.props.disabled} min={min} max={max} step={step}
                    dots={!this.props.disabled} marks={marks} value={value} allowCross={false}
                    style={rangeStyle} onChange={newValue => {
                        /* Check if all values will be integers */
                        const isInteger = Number.isInteger(min) && Number.isInteger(step);

                        // TODO: Remove if mark objects treated as dots bug is resolved
                        // Marks should not be selectable if they do not fit the step
                        newValue[0] = min + Math.round((newValue[0] - min) / step)*step;
                        newValue[1] = min + Math.round((newValue[1] - min) / step)*step;

                        newValue[0] = isInteger ? newValue[0] : newValue[0].toFixed(2);
                        newValue[1] = isInteger ? newValue[1] : newValue[1].toFixed(2);

                        // TODO: Remove if bug [value > max] is resolved
                        if (newValue[0] <= max && newValue[1] <= max) {
                            this.props.onChange(newValue);
                        }
                    }}
                />
            </Form.Field>
        );
    }
}

const itemSource = {
    beginDrag(props) {
        return {item: props.item, id: props.containerId};
    },
    endDrag(props, monitor) {
        if (monitor.didDrop()) {
            const {removedItem} = monitor.getDropResult();
            props.onChange(props.item, removedItem);
        }
    }
}

function DragDropSourceContainer(props) {
    // TODO: unused
    const opacity = props.isDragging ? 0 : 1;

    return props.connectDragSource(
        <div> {props.item} </div>
    );
}

const DragDropSource = DragSource("CSV_FIELDNAME", itemSource,
    (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    })
)(DragDropSourceContainer);

function DragDropTargetContainer(props) {
    const {size} = props.parameter;

    const containerStyle = {
        height: 2.8*size + "rem", //TODO:

        border: "1px solid",
        borderTo: "none",

        overflow: "auto"

    };

    const style = {
        border: "1px dashed gray",
        borderRadius: "5px",
        padding: "0.5rem 0.7rem",
        margin: "0.2rem"
    };

    if (size <= 1) {
        return props.connectDropTarget(
            <div>
                {React.Children.map(props.children, child =>
                    <div> {child} </div>
                )}
            </div>
        );
    }

    return props.connectDropTarget(
        <div style={containerStyle}>
            {React.Children.map(props.children, child =>
                <div style={style}> {child} </div>
            )}
        </div>
    );

}

const itemTarget = {
    drop: (props, monitor) => {
        const {value=[], capacity} = props.parameter;
        const srcItem = monitor.getItem().item;
        const items = value.slice();

        let removedItem;
        if (capacity != null && capacity <= value.length) {
            removedItem = items.pop();
        }

        items.push(srcItem);
        // TODO: Add sorting
        props.onChange(items);

        /* Return removed item to the drag source */
        return {removedItem: removedItem};
    },
    canDrop: (props, monitor) => monitor.getItem().id != props.containerId
};

const DragDropTarget = DropTarget("CSV_FIELDNAME", itemTarget,
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget()
    })
)(DragDropTargetContainer);

function DragDropParam(props) {
    const {name, description, value=[], capacity} = props.parameter;

    const onDragSrcChange = (valToRemove, valToAdd) => {
        const newValue = value.filter(item => item != valToRemove);

        // TODO: Add sort
        if (valToAdd != null) {
            newValue.push(valToAdd);
        }

        props.onChange(newValue);
    };

    // TODO: Fix loading
    if (capacity == 1) {
        return (
            <DragDropTarget containerId={props.parameterId}
                parameter={props.parameter} onChange={props.onChange}>
                <Grid columns="equal" celled style={{margin: 0}}>
                    <Grid.Column textAlign="left">
                        <DragDropSource containerId={props.parameterId}
                            item={value[0]} onChange={onDragSrcChange}/>
                    </Grid.Column>

                    <Grid.Column textAlign="center">
                        &rArr;
                    </Grid.Column>

                    <Grid.Column textAlign="center">
                        <Popup on="hover" content={description} trigger={
                            <div> {name} </div>
                        }/>
                    </Grid.Column>
                </Grid>
            </DragDropTarget>
        );
    }

    return (
        <div>
            <Popup on="hover" content={description} trigger={
                <Header dividing block attached="top"> {name} </Header>
            }/>

            <DragDropTarget containerId={props.parameterId} parameter={props.parameter}
                onChange={props.onChange}>
                {value.map((item, idx) =>
                    <DragDropSource key={idx} containerId={props.parameterId}
                        item={item} onChange={onDragSrcChange}/>
                )}
            </DragDropTarget>
        </div>
    );
}

export {TextParam, CheckboxParam, RadioParam, DropdownParam, FileInputParam,
        DropdownEditParam, SliderParam, RangeParam, DragDropParam};

