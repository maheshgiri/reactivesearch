import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import {
	CheckBox,
	Text,
	Body,
	Item,
	Header,
	Left,
	Button,
	Icon,
	Title,
	Right,
} from 'native-base';

import CheckboxItem from './addons/CheckboxItem';
import {
	addComponent,
	removeComponent,
	watchComponent,
	updateQuery,
	setQueryOptions,
} from '@appbaseio/reactivecore/lib/actions';
import {
	isEqual,
	getQueryOptions,
	pushToAndClause,
	checkValueChange,
	getAggsOrder,
	checkPropChange,
} from '@appbaseio/reactivecore/lib/utils/helper';

import types from '@appbaseio/reactivecore/lib/utils/types';

class MultiDropdownList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			currentValue: [],
			options: [],
			showModal: false,
		};

		this.type = this.props.queryFormat === 'or' ? 'Terms' : 'Term';
		this.internalComponent = `${this.props.componentId}__internal`;
	}

	componentDidMount() {
		this.props.addComponent(this.internalComponent);
		this.props.addComponent(this.props.componentId);
		this.setReact(this.props);

		this.updateQueryOptions(this.props);

		if (this.props.defaultSelected) {
			this.selectItem(this.props.defaultSelected, true);
		}
	}

	componentWillReceiveProps(nextProps) {
		checkPropChange(
			this.props.react,
			nextProps.react,
			() => this.setReact(nextProps),
		);
		checkPropChange(
			this.props.options,
			nextProps.options,
			() => {
				this.setState({
					options: nextProps.options[nextProps.dataField].buckets || [],
				});
			},
		);
		checkPropChange(
			this.props.defaultSelected,
			nextProps.defaultSelected,
			() => this.selectItem(nextProps.defaultSelected, true),
		);
		checkPropChange(
			this.props.sortBy,
			nextProps.sortBy,
			() => this.updateQueryOptions(nextProps),
		);
	}

	componentWillUnmount() {
		this.props.removeComponent(this.props.componentId);
		this.props.removeComponent(this.internalComponent);
	}

	setReact = (props) => {
		const { react } = props;
		if (react) {
			const newReact = pushToAndClause(react, this.internalComponent);
			props.watchComponent(props.componentId, newReact);
		} else {
			props.watchComponent(props.componentId, { and: this.internalComponent });
		}
	};

	defaultQuery = (value, props) => {
		if (this.selectAll) {
			return {
				exists: {
					field: [props.dataField],
				},
			};
		} else if (value && value.length) {
			if (props.queryFormat === 'and') {
				const queryArray = value.map(item => (
					{
						[this.type]: {
							[props.dataField]: item,
						},
					}
				));
				return {
					bool: {
						must: queryArray,
					},
				};
			}

			return {
				[this.type]: {
					[props.dataField]: value,
				},
			};
		}
		return null;
	};

	selectItem = (item, isDefaultValue = false, props = this.props) => {
		let { currentValue } = this.state;

		if (isDefaultValue) {
			currentValue = item;
		} else if (currentValue.includes(item)) {
			currentValue = currentValue.filter(value => value !== item);
		} else {
			currentValue = [...currentValue, item];
		}
		const performUpdate = () => {
			this.setState({
				currentValue,
			});
			this.updateQuery(currentValue, props);
		};

		checkValueChange(
			props.componentId,
			currentValue,
			props.beforeValueChange,
			props.onValueChange,
			performUpdate,
		);
	};

	toggleModal = () => {
		this.setState({
			showModal: !this.state.showModal,
		});
	};

	updateQuery = (value, props) => {
		const query = props.customQuery || this.defaultQuery;
		let callback = null;
		if (props.onQueryChange) {
			callback = props.onQueryChange;
		}
		props.updateQuery(props.componentId, query(value, props), value, props.filterLabel, callback);
	};

	updateQueryOptions = (props) => {
		const queryOptions = getQueryOptions(props);
		queryOptions.aggs = {
			[props.dataField]: {
				terms: {
					field: props.dataField,
					size: 100,
					order: getAggsOrder(props.sortBy),
				},
			},
		};
		props.setQueryOptions(this.internalComponent, queryOptions);
		// Since the queryOptions are attached to the internal component,
		// we need to notify the subscriber (parent component)
		// that the query has changed because no new query will be
		// auto-generated for the internal component as its
		// dependency tree is empty
		props.updateQuery(this.internalComponent, null);
	}

	render() {
		return (
			<View>
				{
					this.state.showModal
						? (<Modal
							supportedOrientations={this.props.supportedOrientations || null}
							transparent={false}
							visible={this.state.showModal}
							onRequestClose={() => {
								this.toggleModal();
							}}
						>
							<Header>
								<Left>
									<Button transparent onPress={this.toggleModal}>
										<Icon name="arrow-back" />
									</Button>
								</Left>
								<Body>
									<Title>{this.props.placeholder}</Title>
								</Body>
								<Right />
							</Header>
							<FlatList
								data={this.state.options}
								renderItem={({ item }) => (
									<CheckboxItem
										label={item.key}
										onPress={this.selectItem}
										checked={this.state.currentValue.includes(item.key)}
									/>
								)}
							/>
						</Modal>)
						: (<Item regular style={{ marginLeft: 0 }}>
							<TouchableWithoutFeedback
								onPress={this.toggleModal}
							>
								<Text
									style={{
										flex: 1,
										alignItems: 'center',
										color: this.state.currentValue.length ? '#000' : '#555',
										flex: 1,
										fontSize: 17,
										height: 50,
										lineHeight: 24,
										paddingLeft: 8,
										paddingRight: 5,
										paddingTop: 12,
									}}
								>
									{
										this.state.currentValue.length
											? this.state.currentValue.join(', ')
											: this.props.placeholder
									}
								</Text>
							</TouchableWithoutFeedback>
						</Item>)

				}
			</View>
		);
	}
}

MultiDropdownList.propTypes = {
	queryFormat: types.queryFormatSearch,
	componentId: types.componentId,
	addComponent: types.addComponent,
	dataField: types.dataField,
	sortBy: types.sortByWithCount,
	setQueryOptions: types.setQueryOptions,
	updateQuery: types.updateQuery,
	defaultSelected: types.stringArray,
	react: types.react,
	options: types.options,
	removeComponent: types.removeComponent,
	beforeValueChange: types.beforeValueChange,
	onValueChange: types.onValueChange,
	customQuery: types.customQuery,
	onQueryChange: types.onQueryChange,
	supportedOrientations: types.supportedOrientations,
	placeholder: types.placeholder,
};

MultiDropdownList.defaultProps = {
	size: 100,
	queryFormat: 'or',
	placeholder: 'Select a value',
	sortBy: 'count',
};

const mapStateToProps = (state, props) => ({
	options: state.aggregations[props.componentId],
});

const mapDispatchtoProps = dispatch => ({
	addComponent: component => dispatch(addComponent(component)),
	removeComponent: component => dispatch(removeComponent(component)),
	watchComponent: (component, react) => dispatch(watchComponent(component, react)),
	updateQuery: (component, query, value, filterLabel, onQueryChange) => dispatch(updateQuery(component, query, value, filterLabel, onQueryChange)),
	setQueryOptions: (component, props) => dispatch(setQueryOptions(component, props)),
});

export default connect(mapStateToProps, mapDispatchtoProps)(MultiDropdownList);
