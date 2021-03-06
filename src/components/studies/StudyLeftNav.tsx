import {Box, Drawer, IconButton, makeStyles} from '@material-ui/core'
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft'
import ChevronRightIcon from '@material-ui/icons/ChevronRight'
import clsx from 'clsx'
import React, {FunctionComponent} from 'react'
import {ThemeType} from '../../style/theme'
import SideBarListItem from '../widgets/SideBarListItem'
import {
  hoverNavIcons,
  normalNavIcons,
  SECTIONS as sectionLinks,
  StudySection,
} from './sections'

const drawerWidth = 212
const useStyles = makeStyles((theme: ThemeType) => ({
  root: {
    margin: 0,
    padding: 0,
    listStyle: 'none',

    '& li': {
      padding: theme.spacing(10, 0),
      fontSize: 18,
    },
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(6),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(6),
    },
  },
  list: {
    margin: '0',
    padding: '0',
    position: 'relative',
    listStyle: 'none',
  },
  drawerPaper: {
    fontSize: '14px',
    position: 'static',
    border: 'none',
    backgroundColor: '#F2F2F2',
    height: 'auto',
    boxShadow:
      '0px 3px 3px -2px rgba(0,0,0,0.2), 0px 3px 4px 0px rgba(0,0,0,0.14), 0px 1px 8px 0px rgba(0,0,0,0.12)',
  },
  navIcon: {
    marginRight: theme.spacing(2),
    width: '48px',
    height: '48px',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  navIconImageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  listItems: {
    padding: theme.spacing(0),
  },
  listItemCollapsed: {
    marginLeft: theme.spacing(-0.5),
  },
  disabledElement: {
    opacity: 0.3,
  },
}))

type StudyLeftNavOwnProps = {
  currentSection?: StudySection
  id?: string
  open: boolean
  onToggle: Function
  onNavigate: Function
  disabled: boolean
}

type StudyLeftNavProps = StudyLeftNavOwnProps

const StudyLeftNav: FunctionComponent<StudyLeftNavProps> = ({
  id,
  open,
  onToggle,
  onNavigate,
  currentSection = 'sessions-creator',
  disabled,
}) => {
  const classes = useStyles()

  const [currentHoveredElement, setCurrentHoveredElement] = React.useState(-1)

  function typeOfIcon(index: number, sectionPath: string) {
    if (index === currentHoveredElement || sectionPath === currentSection) {
      return hoverNavIcons
    } else {
      return normalNavIcons
    }
  }

  const toggleDrawer = () => {
    onToggle()
  }

  return (
    <Drawer
      variant="permanent"
      elevation={1}
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open,
      })}
      classes={{
        paper: clsx(classes.drawerPaper, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        }),
      }}>
      <Box textAlign="right" height="48px" bgcolor="#FAFAFA">
        <IconButton
          onClick={toggleDrawer}
          style={{borderRadius: 0, width: '48px', height: '100%'}}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      <ul
        className={classes.list}
        style={{pointerEvents: disabled ? 'none' : 'all'}}>
        {sectionLinks.map((sectionLink, index) => (
          <div
            onMouseOver={() => setCurrentHoveredElement(index)}
            onMouseOut={() => setCurrentHoveredElement(-1)}
            key={sectionLink.path}>
            <SideBarListItem
              key={sectionLink.path}
              isOpen={open}
              isActive={sectionLink.path === currentSection}
              onClick={() => onNavigate(sectionLink.path)}
              styleProps={classes.listItems}
              inStudyBuilder={true}>
              <div
                className={clsx(
                  classes.navIconImageContainer,
                  sectionLink.path === currentSection &&
                    !open &&
                    classes.listItemCollapsed
                )}>
                <img
                  src={typeOfIcon(index, sectionLink.path)[index]}
                  className={clsx(
                    classes.navIcon,
                    disabled &&
                      sectionLink.path !== 'session-creator' &&
                      classes.disabledElement
                  )}
                  alt={sectionLink.name}
                />
                <span
                  className={clsx(
                    disabled &&
                      sectionLink.path !== 'session-creator' &&
                      classes.disabledElement
                  )}>
                  {sectionLink.name}
                </span>
              </div>
            </SideBarListItem>
          </div>
        ))}
      </ul>
    </Drawer>
  )
}

export default StudyLeftNav
