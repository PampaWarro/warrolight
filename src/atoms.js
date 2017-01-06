import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { update } from './common'

export const Title = styled.h3`
  font-size: 16px;
  margin-bottom: 20px;
`

export const Container = styled.div`
  padding-top: 80px;
  padding-left: 5%;
  padding-right: 5%;
`

export const Label = styled.p`
  font-size: 15px;
  margin-top: 10px;
  margin-bottom: 5px;
`
export const Field = styled.input`
  font-size: 14px;
  width: 420px;
  padding: 8px 5px 8px 8px;
`

export const LinkButton = styled.button`
  font-size: 18px;
  background-color: #424242;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 15px 5px 15px;
`

export const SendButton = styled.button`
  font-size: 18px;
  background-color: #424242;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 15px 5px 15px;
`

export const SendContainer = styled.div`
  margin-top: 20px;
`

class SimpleValueContainer extends React.Component {
  constructor() {
    super(...arguments)
  }
  componentWillMount() {
    this.checkLoaded(this.props)
  }
  componentWillReceiveProps(props) {
    this.checkLoaded(props)
  }
  checkLoaded(props) {
    const { result, loading, error } = props
    if (!loading && !result && !error) {
      props.launchFetch(props)
    }
  }
  loading() {
    return <span>Loading...</span>
  }
  render() {
    const { result, loading, error } = this.props
    if (error) {
      return <tt>{JSON.stringify([error, error.stack], null, 2)}</tt>
    }
    if (result) {
      return <div>{this.props.draw(result, this.props)}</div>
    }
    return this.loading()
  }
}

export const SimpleValue = (pathCreator, render) => {
  return connect((state, ownProps) => {
    const pathToStatus = pathCreator(ownProps, state)
    console.log('connect:', pathToStatus, state.generic[pathToStatus])
    return update(
      {
        draw: render,
        path: pathToStatus
      },
      state.generic[pathToStatus]
    )
  }, {
    launchFetch: (props) => {
      return {
        type: 'API_FETCH_REQUEST',
        payload: pathCreator(props)
      }
    }
  })(SimpleValueContainer)
}

const makeConnection = f => {
  return (pathToData, render) => {
    return SimpleValue(props => pathToData + f(props), render)
  }
}

export const ApiValue = makeConnection(props => '/' + props.id)
export const ApiValueFromRoute = makeConnection(props => '/' + props.params.id)
export const CollectionValue = makeConnection(_ => '')
