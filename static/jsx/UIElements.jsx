import {Form, Popup, Input, Checkbox, Radio, Dropdown} from "semantic-ui-react";
import Slider, {Range} from "rc-slider";
import React from "react";

function TextParam(props) {
    let {name, description, value} = props.parameter;

    if (value == null) {
        props.onChange('');
        value = '';
    }

    return (
        <Form.Field>
            <Popup on="hover" content={description} trigger={
                <label> {name}: </label>
            }/>

            <Input focus placeholder={description} value={value}
                onChange={(e, data) => {props.onChange(data.value)}}/>
        </Form.Field>
    );
}

function CheckboxParam(props) {
    const isChecked = props.parameter.value;

    return (
        <Form.Field>
            <Checkbox checked={isChecked} onChange={() => {props.onChange(!isChecked)}}
                label={<Popup on="hover" content={props.parameter.description} trigger={
                    <label> {props.parameter.name} </label>
                }/>}
            />
        </Form.Field>
    );
}

function RadioParam(props) {
    return (
        <Form.Field>
            <Popup on="hover" content={props.parameter.description} trigger={
                <label> {props.parameter.name}: </label>
            }/>

            <Form.Group>
                {props.parameter.choice.map((choice, idx) =>
                    <Form.Field key={idx}>
                        <Radio
                            label={choice}
                            name={props.parameter.id}
                            checked={props.parameter.value == idx}
                            onChange={() => {props.onChange(idx)}}
                        />
                    </Form.Field>
                )}
            </Form.Group>
        </Form.Field>
    );
}

function DropdownParam(props) {
    let {name, description, value} = props.parameter;

    if (value == null) {
        props.onChange([]);
        value = [];
    }

    let dropdownOptions = [];
    if (props.options != null) {
        dropdownOptions = props.options.map((item, idx) => ({
            key: idx,
            text: item,
            value: item
        }));
    }

    return (
        <Form.Field>
            <Popup on="hover" content={description} trigger={
                <label> {name}: </label>
            }/>

            <Dropdown fluid search selection multiple value={value}
                placeholder={description} options={dropdownOptions}
                onChange={(e, data) => {props.onChange(data.value)}}
            />
        </Form.Field>
    );
}

function DropdownEditParam(props) {
    let {name, description, value} = props.parameter;

    if (!Array.isArray(value) || value.length != props.options.length) {
        value = [];

        for (let i = 0; i < props.options.length; i++) {
            value.push(props.parameter.defaultValue);
        }

        props.onChange(value);
    }

    let dropdownOptions = [];
    if (props.options != null) {
        dropdownOptions = props.options.map((item, idx) => ({
            key: idx,
            text: item,
            value: item,

            content: (
                <Input focus value={value[idx]} label={{content: item}}
                    onChange={(e, data) => {
                        const newValue = value.slice();

                        newValue[idx] = data.value;
                        props.onChange(newValue);
                    }
                }/>
            )
        }));
    }

    return (
        <Form.Field>
            <Popup on="hover" content={description} trigger={
                <label> {name}: </label>
            }/>

            <Dropdown fluid search closeOnChange={false} selection value=''
                placeholder={description} options={dropdownOptions}/>
        </Form.Field>
    );
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
                <label style={{"display": "inline"}}> {name}: </label>
            }/>

            <div style={{"display": "inline", "color": "#96dbfa", "marginLeft": "5px"}}>
                <strong> {(isInteger ? value : value.toFixed(2)) + unit} </strong>
            </div>

            <Slider min={min} max={max} step={step} marks={marks} value={value}
                style={sliderStyle}
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
                <label style={{"display": "inline"}}> {name}: </label>
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

export {TextParam, CheckboxParam, RadioParam, DropdownParam, DropdownEditParam, SliderParam, RangeParam};

