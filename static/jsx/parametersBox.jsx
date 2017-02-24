import React from "react"
import ReactDOM from "react-dom"

import {Image, Icon, Button, Popup, Form, Menu, Input, Modal, Checkbox} from "semantic-ui-react"

class TextParam extends React.Component {
	constructor() {
		super();

		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(event) {
		this.props.handleChange(event.target.value);
	}

	render() {
		return (
			<Form.Field>
				<Popup on="hover" content={this.props.parameter.description} trigger={
					<div>
						<label> {this.props.parameter.name} </label>

						<Input focus fluid value={this.props.parameter.value}
							onChange={this.handleChange}/>
					</div>
				}/>
			</Form.Field>
		);
	}
}

class CheckboxParam extends React.Component {
	constructor() {
		super();

		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(event) {
		this.props.handleChange(!this.props.parameter.value);
	}

	render() {
		return (
			<Form.Field>
				<Popup on="hover" content={this.props.parameter.description} trigger={
					<Checkbox label={this.props.parameter.name}
						checked={this.props.parameter.value}
						onChange={this.handleChange}/>
				}/>
			</Form.Field>
		);
	}
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

		this.parametersMenu = this.parametersMenu.bind(this);
	}

	/* Fetch R script parameters */
	componentDidMount() {
		const getOptionsRequest = new XMLHttpRequest();

		getOptionsRequest.addEventListener("load", request => {
			try {
				let parameters = JSON.parse(request.target.response);
				this.setState({parameters: parameters});

				for (let type in parameters) {
					parameters[type] = parameters[type].map(param => {
						param.value = param.defaultValue;
						return param;
					});
				}
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

	runRScript() {
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

	parametersMenu(params, paramType) {
		return params.map((param, idx) => {
			switch(param.type) {
			case "checkbox":
				return <CheckboxParam parameter={param}
						handleChange={this.onParamValueChange.bind(this, paramType, idx)}/>;
			case "text":
				return <TextParam parameter={param}
						handleChange={this.onParamValueChange.bind(this, paramType, idx)}/>;
			case "dragDrop":
				return null;
			default:
				return <TextParam parameter={param}
						handleChange={this.onParamValueChange.bind(this, paramType, idx)}/>;
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

	readFile(event) {

	}

	/* type - [Read, Optim, ...], idx - index of parameter */
	onParamValueChange(type, idx, newValue) {
		const newParams = this.state.parameters;

		newParams[type][idx].value = newValue;
		this.setState({parameters: newParams});
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
							<Menu.Item>
								<Input type="file" onChange={this.readFile}/>
							</Menu.Item >

							<Menu.Item name="Read" onClick={this.handleReadClick}/>
							<Menu.Item name="Optimize" onClick={this.handleOptimClick}/>
							<Menu.Item name="Prepare" onClick={this.handlePrepClick}/>
						</Menu>

						<Button primary> Export as CSV </Button>
					</Form>

					<Modal size="fullscreen" dimmer={false} open={this.state.readMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Read parameters </Modal.Header>

						<Modal.Content image>
							<Modal.Description>
								{this.parametersMenu(this.state.parameters.Read, "Read")}
							</Modal.Description>
						</Modal.Content>

						<Modal.Actions>
							<Button basic color='red' inverted>
								<Icon name='remove'/> Cancel
							</Button>
							<Button color='green' inverted>
								<Icon name='checkmark'/> Run
							</Button>
						</Modal.Actions>
					</Modal>

					<Modal size="fullscreen" open={this.state.optimMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Optimize parameters </Modal.Header>

						<Modal.Content>
							{this.parametersMenu(this.state.parameters.Optim, "Optim")}
						</Modal.Content>

						<Modal.Actions>
							<Button basic color='red' inverted>
								<Icon name='remove' /> Cancel
							</Button>
							<Button color='green' inverted>
								<Icon name='checkmark' /> Run
							</Button>
						</Modal.Actions>
					</Modal>

					<Modal size="fullscreen" open={this.state.prepMenuActive} onClose={this.handleMenuClose}>
						<Modal.Header> Prepare parameters </Modal.Header>

						<Modal.Content>
							{this.parametersMenu(this.state.parameters.Prep, "Prep")}
						</Modal.Content>

						<Modal.Actions>
							<Button basic color='red' inverted>
								<Icon name='remove' /> Cancel
							</Button>
							<Button color='green' inverted>
								<Icon name='checkmark' /> Run
							</Button>
						</Modal.Actions>
					</Modal>
				</div>
			}
		</div>
		);
	}
}

export {ParametersBox};

