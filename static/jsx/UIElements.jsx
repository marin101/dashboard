import React from "react";

import Slider, {Range} from "rc-slider";
import {DragSource, DropTarget} from "react-dnd";
import {Segment, Header, Form, Popup, Input, Checkbox, Radio, Dropdown} from "semantic-ui-react";

// TODO: Add required prop
function TextParam(props) {
    const {name, description, value='', defaultValue, min, max} = props.parameter;

    let valueType;
    switch (props.parameter.validation) {
        case "integer":
            valueType = "number";
        case "hidden":
            valueType: "password";
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

            <Form.Group>
                {props.parameter.choice.map((choice, idx) =>
                    <Form.Field key={idx}>
                        <Radio label={choice} name={props.parameter.id} checked={value == idx}
                            onChange={() => {props.onChange(idx)}}
                        />
                    </Form.Field>
                )}
            </Form.Group>
        </Form.Field>
    );
}

function DropdownParam(props) {
    const {name, description, value=[], defaultValue} = props.parameter;

    let dropdownOptions = [];
    if (props.options != null) {
        dropdownOptions = props.options.map((item, idx) => ({
            key: idx, text: item, value: item
        }));
    }

    return (
        <Form.Field error={defaultValue == null && value.length <= 0}>
            <Popup on="hover" content={description} trigger={
                <label> {name} </label>
            }/>

            <Dropdown fluid search selection multiple value={value}
                placeholder={description} options={dropdownOptions}
                onChange={(e, data) => {props.onChange(data.value)}}
            />
        </Form.Field>
    );
}

class DropdownEditParam extends React.Component {
    componentWillMount() {
        console.log("kita", this.props.parameter.name);
        const value = this.props.parameter.value;

        /* Initialize dropdown values */
        if (!Array.isArray(value) || value.length != this.props.options.length) {
            const newValue = [];

            for (let i = 0; i < this.props.options.length; i++) {
                newValue.push(this.props.parameter.defaultValue);
            }

            this.props.onChange(newValue);
        }
    }

    render() {
        const {name, description, value} = this.props.parameter;
        console.log("kara", name);

        let dropdownOptions = [];
        if (this.props.options != null) {
            dropdownOptions = this.props.options.map((item, idx) => ({
                key: idx,
                text: item,
                value: item,

                content: (
                    <Input focus value={value[idx]} label={{content: item}}
                        onChange={(e, data) => {
                            const newValue = value.slice();

                            newValue[idx] = data.value;
                            this.props.onChange(newValue);
                        }
                    }/>
                )
            }));
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

function SliderParam(props) {
    let {name, value, description, unit, min, max, step, scale} = props.parameter;

    /* Default unit */
    if (unit == null) unit = '';

    const marks = {};

    /* There will be at most 10 marked points */
    const stepCnt = Math.floor((max - min) / step) + 1;
    const markDist = (stepCnt < 10) ? step : (max - min)/10;

    /* Check if all marking values will be integers */
    const isInteger = Number.isInteger(min) && Number.isInteger(markDist);

    /* Construct marks object */
    for (let i = min; i <= max; i += markDist) {
        const val = isInteger ? Math.round(i) : i;
        marks[val] = (isInteger ? val : val.toFixed(2)) + unit;
    }

    const sliderStyle = {
        "width": "auto",
        "marginLeft": "1em",
        "marginRight": "1em"
    };

    return (
        <Form.Field style={(Object.keys(marks).length > 0) ? {"marginBottom": "2em"} : {}}>
            <Popup on="hover" content={description} trigger={
                <label style={{"display": "inline"}}> {name} </label>
            }/>

            <div style={{"display": "inline", "color": "#96dbfa", "marginLeft": "5px"}}>
                <strong> {(isInteger ? value : value.toFixed(2)) + unit} </strong>
            </div>

            <Slider min={min} max={max} step={step} marks={marks} value={value}
                style={sliderStyle} disabled={props.disabled}
                onChange={newValue => {
                    // TODO: Remove after bug [value > max] is resolved
                    if (newValue <= max) {
                        props.onChange(newValue);
                    }
                }}
            />
       </Form.Field>
    );
}

function RangeParam(props) {
    let {name, description, value, min, max, step, unit} = props.parameter;

    /* Default unit */
    if (unit == null) unit = '';

    /* Range is disabled when dataSet was expected but not given */
    const disabled = props.disabled || (props.parameter.source != null && props.dataSet == null);

    if (props.dataSet != null) {
        max = props.dataSet.length - 1;
        min = 0;
        step = 1;

        if (value == null) {
            value = [min, max];
            props.onChange(value);
        }
    } else if (disabled && value == null) {
        value = [0, 0];
    }

    const marks = {};

    /* There will be at most 10 marked points */
    const stepCnt = Math.floor((max - min) / step) + 1;
    const markDist = (stepCnt < 10) ? step : (max - min)/10;

    /* Check if all marking values will be integers */
    const isInteger = Number.isInteger(min) && Number.isInteger(step);

    /* Construct marks object */
    if (props.dataSet == null) {
        for (let i = min; i <= max; i += markDist) {
            const val = isInteger ? Math.round(i) : i;
            marks[val] = (isInteger ? val : val.toFixed(2)) + unit;
        }
    } else {
        marks[min] = props.dataSet[min] + unit;
        marks[max] = props.dataSet[max] + unit;
    }

    let lowValue, highValue;
    if (props.dataSet == null) {
        lowValue  = isInteger ? value[0] : value[0].toFixed(2);
        highValue = isInteger ? value[1] : value[1].toFixed(2);
    } else {
        lowValue   = props.dataSet[value[0]];
        highValue  = props.dataSet[value[1]];
    }

    const rangeStyle = {
        "width": "auto",
        "marginLeft": "1em",
        "marginRight": "1em"
    };

    return (
        <Form.Field style={(Object.keys(marks).length > 0) ? {"marginBottom": "2em"} : {}}>
            <Popup on="hover" content={description} trigger={
                <label style={{"display": "inline"}}> {name} </label>
            }/>

            <div style={{"display": "inline", "color": "#96dbfa", "marginLeft": "5px"}}>
                <strong> {lowValue + unit} </strong>
                &hArr;
                <strong> {highValue + unit} </strong>
            </div>

            <Range count={2} disabled={disabled} min={min} max={max} step={step}
                dots={!disabled && props.dataSet != null}
                marks={marks} value={value} allowCross={false} style={rangeStyle}
                onChange={newVal => {props.onChange(newVal)}}/>
        </Form.Field>
    );
}
const itemSource = {
    beginDrag(props) {
        return {item: props.item};
    },
    endDrag(props, monitor) {
        if (monitor.didDrop()) {
            const {removedItem} = monitor.getDropResult();
            props.onChange(props.item, removedItem);
        }
    }
}

function DragDropSourceContainer(props) {
    const opacity = props.isDragging ? 0 : 1;

    const style = {
        border: '1px dashed gray',
        borderRadius: "5px",
        padding: '0.5rem 1rem',
        margin: '.5rem',
        backgroundColor: 'white'
    };

    return props.connectDragSource(
        <div style={style}>
            {props.item}
        </div>
    );
}

const DragDropSource = DragSource("CSV_FIELDNAME", itemSource,
    (connect, monitor) => ({
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    })
)(DragDropSourceContainer);

function DragDropTargetContainer(props) {
    const style = {
        border: '1px dashed green',
        borderRadius: "5px",
        padding: '0.5rem 1rem',
        margin: '.5rem',
        width: "200px",
        height: "200px"
    };

    return props.connectDropTarget(
        <div style={style}>
            {props.children}
        </div>
    );

}

const itemTarget = {
    drop: (props, monitor) => {
        const item = monitor.getItem().item;
        const {value=[], size} = props.parameter;
        const items = value.slice();

        let removedItem;
        if (size != null && size <= value.length) {
            removedItem = items.pop();
        }

        items.push(item);
        // TODO: Add sorting
        props.onChange(items);

        /* Return removed item to the drag source */
        return {removedItem: removedItem};
    }
};

const DragDropTarget = DropTarget("CSV_FIELDNAME", itemTarget,
    (connect, monitor) => ({
        connectDropTarget: connect.dropTarget()
    })
)(DragDropTargetContainer);

function DragDropParam(props) {
    const {name, description, value=[], size} = props.parameter;

    const onDragSrcChange = (valToRemove, valToAdd) => {
        const newValue = value.filter(item => item != valToRemove);

        // TODO: Add sort
        if (valToAdd != null) {
            newValue.push(valToAdd);
        }

        props.onChange(newValue);
    };

    // TODO: Fix loading
    if (size == 1) {
        return (
            <div style={{display: "flex"}}>
                <DragDropTarget parameter={props.parameter} style={{flex: 1}}
                    onChange={props.onChange}>
                    <DragDropSource item={value[0]} onChange={onDragSrcChange}/>
                </DragDropTarget>

                <div style={{textAlign: "center", flex: 1}}>
                    &rArr;
                </div>

                <Popup on="hover" content={description} trigger={
                    <div style={{textAlign: "right", flex: 1}}>
                        {name}
                    </div>
                }/>
            </div>
        );
    }

    return (
        <div>
            <Popup on="hover" content={description} trigger={
                <Header dividing block> {name} </Header>
            }/>

            <DragDropTarget parameter={props.parameter} onChange={props.onChange}>
                {value.map((item, idx) =>
                    <DragDropSource key={idx} item={item} onChange={onDragSrcChange}/>
                )}
            </DragDropTarget>
        </div>
    );
}

export {TextParam, CheckboxParam, RadioParam, DropdownParam,
        DropdownEditParam, SliderParam, RangeParam, DragDropParam};

