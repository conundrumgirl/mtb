import {
  Box,
  createStyles,
  FormControlLabel,
  makeStyles,
  Theme,
} from '@material-ui/core'
import {Alert} from '@material-ui/lab'
import _ from 'lodash'
import React, {FunctionComponent} from 'react'
import NavigationPrompt from 'react-router-navigation-prompt'
import {poppinsFont, theme} from '../../../style/theme'
import {
  DWsEnum,
  PerformanceOrder,
  Schedule,
  SessionSchedule,
  StartEventId,
  StudySession,
} from '../../../types/scheduling'
import {StudyBuilderComponentProps} from '../../../types/types'
import ConfirmationDialog from '../../widgets/ConfirmationDialog'
import ErrorDisplay from '../../widgets/ErrorDisplay'
import SaveButton from '../../widgets/SaveButton'
import {SchedulerErrorType} from '../StudyBuilder'
import AssessmentList from './AssessmentList'
import Duration from './Duration'
import SchedulableSingleSessionContainer from './SchedulableSingleSessionContainer'
import actionsReducer, {
  ActionTypes,
  SessionScheduleAction,
} from './scheduleActions'
import StudyStartDate from './StudyStartDate'
import Timeline from './Timeline'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    labelDuration: {
      paddingTop: theme.spacing(1),
      paddingRight: theme.spacing(2),
      fontFamily: poppinsFont,
      fontSize: '18px',
      fontStyle: 'normal',
      fontWeight: 600,
    },
    assessments: {
      width: '286px',
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: '#BCD5E4',
      padding: theme.spacing(1),
    },
    scheduleHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: theme.spacing(2),
    },
    studyStartDateContainer: {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  })
)

type SchedulerProps = {
  id: string
  schedule: Schedule
  version?: number
  token: string
  onSave: Function
  schedulerErrors: SchedulerErrorType[]
}

const Scheduler: FunctionComponent<
  SchedulerProps & StudyBuilderComponentProps
> = ({
  hasObjectChanged,
  saveLoader,
  onUpdate,
  schedule: _schedule,
  onSave,
  children,
  token,
  version,
  schedulerErrors,
}: SchedulerProps & StudyBuilderComponentProps) => {
  const classes = useStyles()
  const [isErrorAlert, setIsErrorAlert] = React.useState(true)
  const [schedule, setSchedule] = React.useState({..._schedule})
  console.log('%c ---scheduler update--' + version, 'color: red')

  const [schedulerErrorState, setSchedulerErrorState] = React.useState(
    new Map<
      string,
      {
        generalErrorMessage: string[]
        sessionWindowErrors: Map<number, string>
        notificationErrors: Map<number, string>
      }
    >()
  )

  function parseErrors(_schedulerErrors: SchedulerErrorType[]) {
    const newErrorState = new Map()
    for (const error of _schedulerErrors) {
      const {entity, errors} = error
      const ks = Object.keys(errors)
      ks.forEach((key, index) => {
        const keyArr = key.split('.')
        //first session, timewindow, message
        var numberPattern = /\d+/g
        let windowIndex
        let notificationIndex
        const sessionIndex = _.first(keyArr[0]?.match(numberPattern))
        // This should not happen
        if (!sessionIndex) return
        // if 3 levels - assume window
        if (keyArr.length > 2) {
          if (keyArr[1].startsWith('notifications')) {
            // notfication error
            notificationIndex = _.first(keyArr[1]?.match(numberPattern))
          } else {
            // assume window error
            windowIndex = _.first(keyArr[1]?.match(numberPattern))
          }
        }
        const errorType = keyArr[keyArr.length - 1]
        const currentError = errors[key]
        const errorMessage = currentError
          .map((error: string) => error.replace(key, ''))
          .join(',')

        const sessionName = entity.sessions[sessionIndex[0]].name
        const wholeErrorMessage = errorType + errorMessage

        const windowNumber = windowIndex ? parseInt(windowIndex) + 1 : undefined
        const notificationNumber = notificationIndex
          ? parseInt(notificationIndex) + 1
          : undefined
        const sessionKey = `${sessionName}-${parseInt(sessionIndex) + 1}`

        let currentErrorState: any
        if (newErrorState.has(sessionKey)) {
          currentErrorState = newErrorState.get(sessionKey)
        } else {
          currentErrorState = {
            generalErrorMessage: [],
            sessionWindowErrors: new Map<number, string>(),
            notificationErrors: new Map<number, string>(),
          }
        }

        if (windowNumber) {
          currentErrorState?.sessionWindowErrors.set(
            windowNumber,
            wholeErrorMessage
          )
        } else if (notificationNumber) {
          currentErrorState?.notificationErrors.set(
            notificationNumber,
            wholeErrorMessage
          )
        } else {
          currentErrorState!.generalErrorMessage.push(wholeErrorMessage)
        }
        newErrorState.set(sessionKey, currentErrorState)
      })
    }
    return newErrorState
  }

  React.useEffect(() => {
    const newErrorState = parseErrors(schedulerErrors)
    setSchedulerErrorState(newErrorState)
  }, [schedulerErrors])

  const getStartEventIdFromSchedule = (
    schedule: Schedule
  ): StartEventId | null => {
    if (_.isEmpty(schedule.sessions)) {
      return null
    }
    const eventIdArray = schedule.sessions.reduce(
      (acc, curr) => (curr.startEventId ? [...acc, curr.startEventId] : acc),
      [] as StartEventId[]
    )

    if (_.uniq(eventIdArray).length > 1) {
      throw Error('startEventIds should be the same for all sessions')
    } else {
      return eventIdArray[0]
    }
  }

  const saveSession = async (sessionId: string) => {
    onSave()
  }

  //setting new state
  const updateData = (schedule: Schedule) => {
    setSchedule(schedule)
    onUpdate(schedule)
  }

  //updating the schedule part
  const updateSessionsWithStartEventId = (
    sessions: StudySession[],
    startEventId: StartEventId
  ) => {
    return sessions.map(s => ({...s, startEventId}))
  }

  const scheduleUpdateFn = (action: SessionScheduleAction) => {
    const sessions = actionsReducer(schedule.sessions, action)
    const newSchedule = {...schedule, sessions}
    updateData(newSchedule)
  }

  if (_.isEmpty(schedule.sessions)) {
    return (
      <Box textAlign="center" mx="auto">
        <ErrorDisplay>
          You need to create sessions before creating the schedule
        </ErrorDisplay>
      </Box>
    )
  }

  return (
    <Box>
      {schedulerErrors.length > 0 && (
        <Alert
          onClose={() => setIsErrorAlert(false)}
          severity="error"
          style={{
            backgroundColor: '#EE6070',
            color: 'black',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            textAlign: 'center',
          }}>
          Please fix the errors below before continuing
        </Alert>
      )}

      <NavigationPrompt when={hasObjectChanged} key="prompt">
        {({onConfirm, onCancel}) => (
          <ConfirmationDialog
            isOpen={hasObjectChanged}
            type={'NAVIGATE'}
            onCancel={onCancel}
            onConfirm={onConfirm}
          />
        )}
      </NavigationPrompt>

      <Box textAlign="left" key="content">
        {/* <ObjectDebug data={timeline} label=""></ObjectDebug> */}
        <div className={classes.scheduleHeader} key="intro">
          <FormControlLabel
            classes={{label: classes.labelDuration}}
            label="Study duration:"
            style={{fontSize: '14px'}}
            labelPlacement="start"
            control={
              <Duration
                onChange={e =>
                  updateData({...schedule, duration: e.target.value})
                }
                durationString={schedule.duration || ''}
                unitLabel="study duration unit"
                numberLabel="study duration number"
                unitData={DWsEnum}></Duration>
            }
          />
          {hasObjectChanged && !saveLoader && (
            <SaveButton isFloatingSave={true} onClick={() => onSave()}>
              Save changes
            </SaveButton>
          )}
        </div>
        <Box bgcolor="#fff" p={2} mt={3} key="scheduler">
          <Timeline
            token={token}
            version={version!}
            schedule={schedule}></Timeline>
          <div className={classes.studyStartDateContainer}>
            <StudyStartDate
              style={{
                marginTop: '16px',
              }}
              startEventId={
                getStartEventIdFromSchedule(schedule) as StartEventId
              }
              onChange={(startEventId: StartEventId) => {
                const sessions = updateSessionsWithStartEventId(
                  schedule.sessions,
                  startEventId
                )
                updateData({...schedule, sessions})
              }}
            />
          </div>
          {schedule.sessions.map((session, index) => (
            <Box
              mb={2}
              display="flex"
              key={session.guid}
              border={
                schedulerErrorState.get(`${session.name}-${index + 1}`)
                  ? `1px solid ${theme.palette.error.main}`
                  : ''
              }>
              <Box className={classes.assessments}>
                <AssessmentList
                  studySessionIndex={index}
                  studySession={session}
                  onChangePerformanceOrder={(
                    performanceOrder: PerformanceOrder
                  ) => {
                    const schedule = {...session, performanceOrder}

                    scheduleUpdateFn({
                      type: ActionTypes.UpdateSessionSchedule,
                      payload: {sessionId: session.guid!, schedule},
                    })
                  }}
                  performanceOrder={session.performanceOrder || 'sequential'}
                />
              </Box>
              {/* This is what is being displayed as the card */}
              <SchedulableSingleSessionContainer
                key={session.guid}
                studySession={session}
                onSaveSessionSchedule={() => saveSession(session.guid!)}
                onUpdateSessionSchedule={(schedule: SessionSchedule) => {
                  scheduleUpdateFn({
                    type: ActionTypes.UpdateSessionSchedule,
                    payload: {sessionId: session.guid!, schedule},
                  })
                }}
                sessionErrorState={schedulerErrorState.get(
                  `${session.name}-${index + 1}`
                )}></SchedulableSingleSessionContainer>
            </Box>
          ))}
        </Box>

        {children}
      </Box>
    </Box>
  )
}

export default Scheduler
