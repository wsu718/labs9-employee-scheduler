import React, { Component } from 'react'
import PropTypes from 'prop-types'
import BreadCrumb from './BreadCrumb'
import styled from '@emotion/styled'
import system from '../design/theme'
import { fetchEmployeesFromDB, updateUserSettings } from '../actions'
import { connect } from 'react-redux'
import Card from './EmployeeCard/Card'
import LeftSideBar from './LeftSideBar'
import OuterContainer from './common/OuterContainer'
import AddEmployee from './AddEmployee'
import AvailabilityForm from './Availability/AvailabilityForm'
import Button from './common/Button'
import Modal from './Modal'
import { Input } from './common/FormContainer'
import ReactJoyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride'
import steps from './Demo/employees'
import axios from 'axios'

// This will have admin information on employees (name, email, phone number, availability ext), managers will be able to add new employees through here.
class Employees extends Component {
  constructor(props) {
    super(props)
    this.state = {
      availTarget: null,
      show: false,
      searchTerm: '',
      employees: props.employees,
      //react joyride demo steps
      steps: undefined, //check demo folder for steps
      stepIndex: 0
    }
  }
  componentDidMount() {
    const { user, org_id, token, fetchEmployeesFromDB } = this.props
    fetchEmployeesFromDB(org_id, token)

    // load the demo steps
    if (steps) this.setState({ steps })
    // check if the user has completed the demo before
    if (user && user.emp_visit === true) {
      return this.setState({ run: true })
    } else {
      return this.setState({ run: false })
    }
  }

  updateAvail = user => {
    this.setState({ availTarget: user })
  }

  turnOffEditAvailability = () => {
    this.setState({ availTarget: null })
  }

  toggleShow = () => {
    this.setState({
      show: !this.state.show
    })
  }

  updateSearch = e => {
    this.setState({ [e.target.name]: e.target.value.substr(0, 20) })
  }

  // for joyride demo
  handleClickStart = e => {
    e.preventDefault()
    this.setState({
      run: true,
      stepIndex: 0
    })
  }

  // joyride event handling, step index controls the position of the event
  handleJoyrideCallback = data => {
    const { action, index, type, status } = data
    const { user } = this.props
    const baseURL = process.env.REACT_APP_SERVER_URL
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Need to set our running state to false, so we can restart if we click start again.
      this.setState({ run: false, stepIndex: 0 })
      axios
        .put(
          `${baseURL}/users/${user.id}`,
          { emp_visit: false, cal_visit: false },
          {
            headers: { authorization: this.props.token }
          }
        )
        .then(res => this.props.updateUserSettings(this.props.token))
        .catch(err => console.log(err))
    } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      const stepIndex = index + (action === ACTIONS.PREV ? -1 : 1)

      if (index === 0) {
        setTimeout(() => {
          this.setState({ run: true })
        }, 400)
      } else if (index === 1) {
        this.setState(
          {
            run: false,
            stepIndex
          },
          () => {
            setTimeout(() => {
              this.setState({ run: true })
            }, 400)
          }
        )
      } else if (index === 2 && action === ACTIONS.PREV) {
        this.setState(
          {
            run: false,
            stepIndex
          },
          () => {
            setTimeout(() => {
              this.setState({ run: true })
            }, 400)
          }
        )
      } else {
        // Update state to advance the tour
        this.setState({
          stepIndex
        })
      }
    }
  }

  render() {
    const { employees } = this.props
    const { availTarget, run, steps } = this.state
    let filteredEmployees = employees.filter(person => {
      if (
        person.first_name
          .toLowerCase()
          .indexOf(this.state.searchTerm.toLowerCase()) > -1
      ) {
        return person
      } else {
        return null
      }
    })
    return (
      <OuterContainer location="Employees ">
        <BreadCrumb location="Employees" />
        <LeftSideBar fixed />
        <MidContainer>
          <h1>Employee Directory</h1>
          <ReactJoyride
            callback={this.handleJoyrideCallback}
            continuous
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
              options: {
                zIndex: 10000
              }
            }}
          />
          <TopButtons>
            <Button id="add-employee" onClick={this.toggleShow}>
              Add Employee
            </Button>
            <Input
              id="search"
              search
              type="text"
              name="searchTerm"
              placeholder="Search employees..."
              onChange={this.updateSearch}
              value={this.state.searchTerm}
            />
            <Button id="tut" onClick={this.handleClickStart}>
              Start Tutorial
            </Button>
          </TopButtons>
          <Modal show={this.state.show} toggleShow={this.toggleShow}>
            <AddEmployee />
          </Modal>
          <InnerContainer>
            <Modal
              show={Boolean(availTarget)}
              toggleShow={this.turnOffEditAvailability}
              availTarget={availTarget}
            >
              {({ toggleShow, Close, availTarget }) => {
                return availTarget ? (
                  <AvailabilityForm
                    availabilities={availTarget.availabilities}
                    Close={Close}
                    first_name={availTarget.first_name}
                    toggleShow={toggleShow}
                  />
                ) : null
              }}
            </Modal>
            {employees &&
              filteredEmployees.map((employee, i) => (
                <FlexSpacer key={i}>
                  <Card
                    {...employee}
                    updateAvail={() => this.updateAvail(employee)}
                  />
                </FlexSpacer>
              ))}
          </InnerContainer>
        </MidContainer>
      </OuterContainer>
    )
  }
}

Employees.propTypes = {
  // add propTypes here
  user: PropTypes.object,
  org_id: PropTypes.string.isRequired,
  employees: PropTypes.arrayOf(PropTypes.object).isRequired,
  token: PropTypes.string.isRequired,
  filterdEmployees: PropTypes.arrayOf(PropTypes.string)
}

const mapStateToProps = state => {
  return {
    user: state.auth.user,
    org_id: state.auth.user.organization_id,
    employees: state.employees.employees,
    token: state.auth.token
  }
}

export default connect(
  mapStateToProps,
  { fetchEmployeesFromDB, updateUserSettings }
)(Employees)

const MidContainer = styled('div')`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: ${system.spacing.container};
  margin-top: 75px;
  position: relative;
`
const FlexSpacer = styled('div')`
  margin: auto;
`

const InnerContainer = styled('div')`
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: baseline;
  margin: ${system.spacing.standardPadding};
`

const TopButtons = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 10px 40px 0;
  @media ${system.breakpoints[1]} {
    padding: 10px 0 0;
    flex-flow: column nowrap;

    #search {
      margin-bottom: 20px;
      order: -1;
    }

    #tut {
      display: none;
    }
  }
`
