import React from "react"
import ReactDOM from "react-dom"

import {Popup, Form, Menu, Input, Modal, Checkbox} from "semantic-ui-react"

function TextParam(props) {
	return (
		<Form.Field>
			<Popup content={props.parameter.description} on="hover" trigger={<div>
					<label> {props.parameter.name} </label>
					<Input focus fluid onChange={props.handleChange}/>
				</div>
			}/>
		</Form.Field>
	);
}

function CheckboxParam(props) {
	return (
		<Form.Field>
			<Popup on="hover" content={props.parameter.description} trigger={
				<Checkbox label={props.parameter.name} onChange={props.handleChange}
					checked={props.isChecked}/>
			}/>
		</Form.Field>
	);
}

class ParametersBox extends React.Component {
	constructor() {
		super();

		this.state = {
			parameters: null,

			readParamsMenuActive: false,
			optimParamsMenuActive: false,
			prepParamsMenuActive: false
		};

		this.handleReadClick = this.handleReadClick.bind(this);
		this.handleOptimClick = this.handleOptimClick.bind(this);
		this.handlePrepClick = this.handlePrepClick.bind(this);
		this.handleMenuClose = this.handleMenuClose.bind(this);
	}

	componentDidMount() {
		const getOptionsRequest = new XMLHttpRequest();

		getOptionsRequest.addEventListener("load", request => {
			try {
				let parameters = JSON.parse(request.target.response);
				this.setState({parameters: parameters});
			} catch(error) {
				console.log(error);
			}

		});

		getOptionsRequest.addEventListener("error", error => {
			console.log(error);
		});

		getOptionsRequest.open("GET", "/parameters/");
		getOptionsRequest.send();
	}

	send_parameters() {
		const sendOptionsRequest = new XMLHttpRequest();

		sendOptionsRequest.addEventListener("load", request => {
			console.log(request);
		});

		sendOptionsRequest.addEventListener("error", error => {
			console.log(error);
		});

		sendOptionsRequest.open("POST", "/parameters/");
		sendOptionsRequest.send(this.state.parameters);
	}

	parametersMenu(params) {
		return params.map(parameter => {
			switch(parameter.type) {
			case "checkbox":
				return <CheckboxParam parameter={parameter} handleChange={() => null}/>;
			case "text":
				return <TextParam parameter={parameter} handleChange={() => null}/>;
			case "number":
				return null;
			default:
				return <TextParam parameter={parameter} handleChange={() => null}/>;
			}
		});
	}

	handleReadClick(event) {
		this.setState({readMenuActive: true});
		this.setState({optimMenuActive: false});
		this.setState({prepMenuActive: false});
	}

	handleOptimClick(event) {
		this.setState({readMenuActive: false});
		this.setState({optimMenuActive: true});
		this.setState({prepMenuActive: false});
	}

	handlePrepClick(event) {
		this.setState({readMenuActive: false});
		this.setState({optimMenuActive: false});
		this.setState({prepMenuActive: true});
	}

	handleMenuClose(event) {
		this.setState({readMenuActive: false});
		this.setState({optimMenuActive: false});
		this.setState({prepMenuActive: false});
	}

	render() {
		return (
			<div>
			{this.state.parameters != null &&
				<div>
					<Form>
						<Menu fluid>
							<Menu.Item name="New session" onClick={this.restartSession}>
							</Menu.Item>
							<Menu.Item name="Save session" onClick={this.saveSession}>
							</Menu.Item>
						</Menu>

						<Menu vertical fluid>
							<Menu.Item name="Read" onClick={this.handleReadClick}>
							</Menu.Item>

							<Menu.Item name="Optimize" onClick={this.handleOptimClick}>
							</Menu.Item>

							<Menu.Item name="Prepare" onClick={this.handlePrepClick}>
							</Menu.Item>

							<Menu.Item name="Export CSV">
							</Menu.Item>
						</Menu>
					</Form>

					<Modal size="fullscreen" open={this.state.readMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Read parameters </Modal.Header>

						<Modal.Content>
							{this.parametersMenu(this.state.parameters.Read)}
						</Modal.Content>
					</Modal>

					<Modal size="fullscreen" open={this.state.optimMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Optimize parameters </Modal.Header>

						<Modal.Content>
							Optim
						</Modal.Content>
					</Modal>

					<Modal size="fullscreen" open={this.state.prepMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Prepare parameters </Modal.Header>

						<Modal.Content>
							Prep
						</Modal.Content>
					</Modal>
				</div>
			}
		</div>
		);
	}
}

export {ParametersBox};

