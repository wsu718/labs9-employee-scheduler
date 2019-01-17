import React from 'react'
import { connect } from 'react-redux'
import Calendar from '../Calendar'
import { DragDropContext } from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import EmployeePool from './EmployeePool'
import { fetchEmployeesFromDB, createEvent, changeEvent } from '../../actions'
import OuterContainer from '../common/OuterContainer'
import WeekSummary from './WeekSummary'

const DnDCal = withDragAndDrop(Calendar, { backend: false })

class Scheduler extends React.Component {
  state = { events: [] }

  componentDidMount() {
    this.props.fetchEmployeesFromDB()
  }

  handleDrop = drop => {
    console.log('drop', drop)
    const { event, start, end } = drop
    const { type, ...employee } = event

    // checks to see if this is the creation of a new_shift via an employee card
    // being dragged, rather than an existing event being dragged
    if (event.type === 'new_shift') {
      return this.props.createEvent({ employee, start })
    }

    // else, the drop is from dragging an existing shift, so it is interpreted
    // as a change
    return this.props.changeEvent({ event: employee, changes: { start, end } })
  }

  resizeEvent = (type, { start, end, event }) => {
    this.props.changeEvent({ event, changes: { start, end } })
  }

  render() {
    const { employees } = this.props

    const names = []
    employees.map(employee => names.push(`${employee.first_name}`))

    const events = employees.reduce((acc, employee) => {
      return [
        ...acc,
        ...employee.events.map(event => {
          return {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
            title: `${employee.first_name} ${employee.last_name}`
          }
        })
      ]
    }, [])

    return (
      <OuterContainer>
        <div style={{ display: 'flex' }}>
          <EmployeePool employees={employees} />
          <div style={{ display: 'flex', flexFlow: 'column', width: '100%' }}>
            <DnDCal
              selectable
              resizable
              defaultDate={new Date()}
              defaultView="week"
              events={events}
              onEventDrop={this.handleDrop}
              onEventResize={this.resizeEvent}
              onSelectEvent={event => console.log(event)}
              eventPropGetter={event => ({
                className: event.title.split(' ')[0]
              })}
              names={names}
              startAccessor="start"
              endAccessor="end"
              draggableAccessor={event => true}
            />
            <WeekSummary events={events} />
          </div>
        </div>
      </OuterContainer>
    )
  }
}

const mapStateToProps = ({ employees }) => ({ employees: employees.employees })

const DragSched = DragDropContext(HTML5Backend)(Scheduler)
export default connect(
  mapStateToProps,
  { fetchEmployeesFromDB, createEvent, changeEvent }
)(DragSched)
