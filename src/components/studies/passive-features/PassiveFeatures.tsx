import {Box, Switch} from '@material-ui/core'
import {makeStyles} from '@material-ui/core/styles'
import React from 'react'
import motion from '../../../assets/passive-features/recorders_motion.svg'
import noise from '../../../assets/passive-features/recorders_noise.svg'
import weather from '../../../assets/passive-features/recorders_weather.svg'
import {latoFont, ThemeType} from '../../../style/theme'
import {
  BackgroundRecorders,
  StudyBuilderComponentProps,
} from '../../../types/types'
import {MTBHeadingH3} from '../../widgets/Headings'

const useStyles = makeStyles((theme: ThemeType) => ({
  root: {
    backgroundColor: '#fefefe',

    padding: theme.spacing(6, 6, 7, 6),
    textAlign: 'left',
  },

  intro: {
    marginBottom: theme.spacing(2),
    lineHeight: '18px',
    width: '85%',
  },
  featureHeading: {
    fontFamily: latoFont,
    fontSize: '21px',
    fontWeight: 700,
  },

  section: {
    backgroundColor: '#F6F6F6',
    borderRadius: '10px',
    marginTop: theme.spacing(2),
    padding: theme.spacing(3, 6, 5, 6),
  },
  featureTable: {
    borderSpacing: theme.spacing(8, 0),
    margin: theme.spacing(0, -8, 0, -8),
    borderCollapse: 'separate',

    '& th': {
      fontFamily: latoFont,
      fontSize: '15px',
      height: theme.spacing(5),
      verticalAlign: 'top',
      fontWeight: 'bold',
    },
    '& td': {
      verticalAlign: 'top',
    },
  },

  toggle: {
    marginLeft: theme.spacing(1.5),
  },
}))

type recorderTypeKeys = keyof BackgroundRecorders
export type RecorderInfo = {
  [K in recorderTypeKeys]: {
    value: boolean
    title: string
    description: string
    burden: string
    frequency: string
    img: string
  }
}

const sensors: Partial<RecorderInfo> = {
  motion: {
    description:
      'Motion Sensors Description about this background recorder and its use of accelerameter and gyro',
    title: 'Motion Sensors',
    frequency: 'When using the app.',
    img: motion,
    burden: 'Uses battery capacity and requires more frequent battery charge.',
    value: false,
  },
  microphone: {
    description:
      'Noise can be distracting. The phone microphone can record background noise, which is converted into a measure of decibels relative to full scale. Recordings are not kept.',
    frequency: 'When performing App activities.',
    title: 'Background Noise',
    img: noise,
    burden: 'Uses battery capacity and requires more frequent battery charge.',

    value: false,
  },
  weather: {
    description:
      "The phone GPS indicates phone location that can be used to collect data about weather and air quality at that location. The GPS data isn't stored to maintain participant's privacy.",
    frequency: 'When using the App',
    title: 'Weather and Air Pollution',
    img: weather,
    burden: 'Uses battery capacity and requires more frequent battery charge.',

    value: false,
  },
}

export interface PassiveFeaturesProps {
  features?: BackgroundRecorders
}

const PassiveFeatures: React.FunctionComponent<
  PassiveFeaturesProps & StudyBuilderComponentProps
> = ({
  features,
  onUpdate,

  children,
}: PassiveFeaturesProps & StudyBuilderComponentProps) => {
  const classes = useStyles()

  const PFSection = ({
    recorderType,
    value = false,
    callbackFn,
  }: {
    recorderType: keyof BackgroundRecorders
    value?: boolean
    callbackFn: Function
  }): JSX.Element => {
    if (!recorderType) {
      return <></>
    }

    return (
      <div className={classes.section}>
        <Box display="flex" mb={5}>
          <img
            src={sensors[recorderType]!.img}
            alt={sensors[recorderType]!.title}
            style={{marginRight: 'auto'}}
          />

          <span className={classes.featureHeading}>
            {sensors[recorderType]!.title}
          </span>
          <div className={classes.toggle}>
            <Switch
              color="primary"
              checked={value}
              onChange={e => callbackFn(e.target.checked)}></Switch>
          </div>
        </Box>
        <table className={classes.featureTable}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Frequency</th>
              <th>User Burden</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{width: '40%'}}>
                {sensors[recorderType]!.description}
              </td>
              <td style={{width: '20%'}}>{sensors[recorderType]!.frequency}</td>
              <td>{sensors[recorderType]!.burden}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      <div className={classes.root}>
        <MTBHeadingH3 className={classes.intro}>
          Mobile Toolbox lets you add optional contextual/sensor monitoring to
          your study. This can be used to assess the impact of environmental
          factors on test performance.
        </MTBHeadingH3>
        <MTBHeadingH3 className={classes.intro}>
          When adding monitoring, please consider the impact on the
          participant's experience and potential added burden.
        </MTBHeadingH3>
        <MTBHeadingH3 className={classes.intro}>
          Participants can turn optional monitoring on/off at any time.
        </MTBHeadingH3>
        <PFSection
          recorderType={'motion'}
          value={features?.motion}
          callbackFn={(e: boolean) => {
            const result = {...features, motion: e}
            onUpdate({...features, motion: e})
          }}></PFSection>
        <PFSection
          recorderType={'microphone'}
          value={features?.microphone}
          callbackFn={(e: boolean) => {
            onUpdate({...features, microphone: e})
          }}></PFSection>
        <PFSection
          recorderType={'weather'}
          value={features?.weather}
          callbackFn={(e: boolean) => {
            onUpdate({...features, weather: e})
          }}></PFSection>
      </div>
      {children}
    </>
  )
}

export default PassiveFeatures
