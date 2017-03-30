import React from "react";

import Slider, {Range} from "rc-slider";
import {DragSource, DropTarget} from "react-dnd";
import {Segment, Header, Form, Popup, Input, Button, Checkbox, Radio, Dropdown} from "semantic-ui-react";

function FileInputParam(props) {
    const {name, description, value=''} = props.parameter;

    let uploadCSVButtonRef;

    return (
        <Input placeholder={description} size="mini" value={value}>
            <input disabled/>

            <span style={{display: "none"}}>
            <input type="file" ref={input => {uploadCSVButtonRef = input}}
                onChange={props.onChange}/>
            </span>

            <Button onClick={() => {uploadCSVButtonRef.click()}}>
                {name}
            </Button>
        </Input>
    );
}

// TODO: Add required prop
function TextParam(props) {
    const {name, description, value='', defaultValue, min, max} = props.parameter;

    let valueType;
    // TODO: Verify that it works
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
                        <Radio label={choice} name={props.parameterId} checked={value == idx}
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
        return;
        const value = this.props.parameter.value;

        /* Initialize dropdown values */
        if (!Array.isArray(value) || (this.props.options != null && value.length != this.props.options.length)) {
            const newValue = [];

            if (this.props.options == null) return;
            for (let i = 0; i < this.props.options.length; i++) {
                newValue.push(this.props.parameter.defaultValue);
            }

            this.props.onChange(newValue);
        }
    }

    render() {
        const {name, description, value} = this.props.parameter;

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
    const {name, value=0, description, unit='', choice, step} = props.parameter;
    const [min, max] = choice;

   /* Check if all marking values will be integers */
    const isInteger = Number.isInteger(min) && Number.isInteger(step);

    const marks = {};
    let {markCnt=0} = props.parameter;

    /* Construct marks object */
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
            marks[val] = (isInteger ? val : val.toFixed(2)) + unit;
        }
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

            {!props.disabled &&
                <div style={{"display": "inline", "color": "#96dbfa", "marginLeft": "5px"}}>
                    <strong> {(isInteger ? value : value.toFixed(2)) + unit} </strong>
                </div>
            }

            <Slider min={min} max={max} step={step} marks={marks} value={value}
                style={sliderStyle} disabled={props.disabled}
                onChange={newValue => {
                    // TODO: Remove if mark objects treated as dots bug is resolved
                    // Marks should not be selectable if they do not fit the step
                    newValue = min + Math.round((newValue - min) / step)*step;

                    // TODO: Remove after bug [value > max] is resolved
                    if (newValue <= max) {
                        props.onChange(newValue);
                    }
                }}
            />
       </Form.Field>
    );
}

class RangeParam extends React.Component {
    componentWillMount() {
        if (this.props.disabled) {
            this.props.onChange([0, 0]);
        } else if (this.props.dataSet != null && this.props.parameter.value == null) {
            this.props.onChange([0, this.props.dataSet.length - 1]);
        }
    }

    componenWillReceiveProps(nextProps) {
        if (nextProps.disabled) {
            nextProps.onChange([0, 0]);
        } else if (nextProps.dataSet != null && nextProps.parameter.value == null) {
            nextProps.onChange([0, nextProps.dataSet.length - 1]);
        }
    }

    render() {
        const {name, value=[0, 0], choice, step=1, source, unit=''} = this.props.parameter;
        let {markCnt=0} = this.props.parameter;

        let [min, max] = [0, 0];
        if (choice != null) {
            [min, max] = choice;
        } else if (this.props.dataSet != null) {
            [min, max] = [0, this.props.dataSet.length - 1];
        }

       /* Check if all marking values will be integers */
        const isInteger = Number.isInteger(min) && Number.isInteger(step);

        const marks = {};

        /* Construct marks object */
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

                if (this.props.dataSet != null) {
                    marks[val] = this.props.dataSet[val] + unit;
                } else {
                    marks[val] = (isInteger ? val : val.toFixed(2)) + unit;
                }
            }
        }

        let lowValue, highValue;
        if (this.props.dataSet == null) {
            lowValue  = isInteger ? value[0] : value[0].toFixed(2);
            highValue = isInteger ? value[1] : value[1].toFixed(2);
        } else {
            lowValue  = this.props.dataSet[value[0]];
            highValue = this.props.dataSet[value[1]];
        }

        const rangeStyle = {
            "width": "auto",
            "marginLeft": "1em",
            "marginRight": "1em"
        };

        /* Range is disabled when dataSet was expected but not given */
        const disabled = this.props.disabled || (source != null && this.props.dataSet == null);

        return (
            <Form.Field style={(Object.keys(marks).length > 0) ? {marginBottom: "2em"} : {}}>
                <Popup on="hover" content={this.props.parameter.description} trigger={
                    <label style={{display: "inline"}}> {name} </label>
                }/>

                {!disabled &&
                    <div style={{display: "inline", color: "#96dbfa", marginLeft: "5px"}}>
                        <strong> {lowValue + unit} </strong>
                        &hArr;
                        <strong> {highValue + unit} </strong>
                    </div>
                }

                <Range count={2} disabled={disabled} min={min} max={max} step={step}
                    dots={!disabled} marks={marks} value={value} allowCross={false}
                    style={rangeStyle} onChange={newValue => {
                        // TODO: Remove if mark objects treated as dots bug is resolved
                        // Marks should not be selectable if they do not fit the step
                        newValue[0] = min + Math.round((newValue[0] - min) / step)*step;
                        newValue[1] = min + Math.round((newValue[1] - min) / step)*step;

                        // TODO: Remove after bug [value > max] is resolved
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
        height: 2.8*size + "rem",
        border: "1px solid green",
        borderTop: "none",
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
            <div style={Object.assign({}, containerStyle, {width: "33%"})}>
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
            <div style={{display: "flex"}}>
                <DragDropTarget containerId={props.parameterId} parameter={props.parameter}
                    style={{flex: 1}} onChange={props.onChange}>
                    <DragDropSource containerId={props.parameterId}
                        item={value[0]} onChange={onDragSrcChange}/>
                </DragDropTarget>

                <div style={{textAlign: "center", flex: 1}}> &rArr; </div>

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

