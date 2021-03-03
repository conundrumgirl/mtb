import { callEndpoint } from '../helpers/utility'
import constants from '../types/constants'
import {
  EditableParticipantData,
  ParticipantAccountSummary,
  StringDictionary
} from '../types/types'

export const CLINIC_EVENT_ID = 'clinic_visit'
const IS_TEST: boolean = true

async function getClinicVisitsForParticipants(
  studyIdentifier: string,
  token: string,
  participantId: string[],
) {
  //transform ids into promises
  const promises = participantId.map(async pId => {
    const endpoint = constants.endpoints.events
      .replace(':studyId', studyIdentifier)
      .replace(':userId', pId)

    const apiCall = await callEndpoint<{ items: any[] }>(
      endpoint,
      'GET',
      { type: 'clinic_visit' },
      token,
    )
    return { participantId: pId, apiCall: apiCall }
  })

  //execute promises and reduce array to dictionary object
  return Promise.all(promises).then(result => {
    const items = result.reduce((acc, item) => {
      //only need clinic visits
      const clinicVisitEvents = item.apiCall.data.items.filter(
        event => event.eventId === 'custom:clinic_visit',
      )

      const clinicVisitDate = clinicVisitEvents?.length
        ? clinicVisitEvents[0].timestamp
        : ''

      return { ...acc, [item.participantId]: clinicVisitDate }
    }, {})
    return items
  })
}








//gets all pages for participants
async function getAllParticipants(studyIdentifier: string, token: string) {
  const pageSize = 50
  const result = await getParticipants(studyIdentifier, token, pageSize, 0)
  const pages = Math.ceil(result.total / pageSize)
  if (pages < 2) {
    return result
  }

  const queries: Promise<any>[] = []
  for (let i = 0; i < pages; i++) {
    queries.push(
      getParticipants(studyIdentifier, token, pageSize, i * pageSize),
    )
  }
  return Promise.all(queries).then(result => {
    console.log(result)
    const allItems = [].concat.apply(
      [],
      result.map(i => i.items),
    )

    return { items: allItems, total: result[0].total }
  })
}

async function getParticipants(
  studyIdentifier: string,
  token: string,
  pageSize: number,
  offsetBy: number,
) {
  const endpoint = constants.endpoints.participantsSearch.replace(
    ':id',
    studyIdentifier,
  )

  const data = {
    pageSize: pageSize,
    offsetBy: offsetBy,
    noneOfGroups: IS_TEST ? undefined : ['test_user'],
  }

  const result = await callEndpoint<{
    items: ParticipantAccountSummary[]
    total: number
  }>(endpoint, 'POST', data, token)
  return { items: result.data.items, total: result.data.total }
}

async function getParticipantWithId(
  studyIdentifier: string,
  token: string,
  partipantID: string,
) {
  const endpoint = constants.endpoints.participant.replace(
    ':id',
    studyIdentifier,
  )
  try {
    const result = await callEndpoint<ParticipantAccountSummary>(
      `${endpoint}/${partipantID}`,
      'GET',
      {},
      token,
    )
    return result.data
  } catch (e) {
    // If the participant is not found, return null.
    if (e.statusCode === 404) {
      return null
    }
    throw new Error(e)
  }
}

async function deleteParticipant(
  studyIdentifier: string,
  token: string,
  participantId: string,
): Promise<string> {
  const endpoint = `${constants.endpoints.participant.replace(
    ':id',
    studyIdentifier,
  )}/${participantId}`

  const result = await callEndpoint<{ identifier: string }>(
    endpoint,
    'DELETE',
    {},
    token,
  )
  return result.data.identifier
}

async function getEnrollments(studyIdentifier: string, token: string) {
  const endpoint = `${constants.endpoints.enrollments.replace(
    ':studyId',
    studyIdentifier,
  )}?enrollmentFilter=all`

  const result = await callEndpoint<{ items: any }>(endpoint, 'GET', {}, token)
  debugger
  return result.data.items
}

async function withdrawParticipant(
  studyIdentifier: string,
  token: string,
  participantId: string,
  note?: string,
): Promise<string> {
  const endpoint = `${constants.endpoints.enrollments.replace(
    ':studyId',
    studyIdentifier,
  )}/${participantId}${
    note ? 'withdrawalNote=' + encodeURIComponent(note) + '' : ''
  }`

  const result = await callEndpoint<{ identifier: string }>(
    endpoint,
    'DELETE',
    {},
    token,
  )

  return result.data.identifier
}

/*async function updateParticipantGroup(
  studyIdentifier: string,
  token: string,
  participantId: string,
  dataGroups: string[]

): Promise<string> {
  const endpoint = `${constants.endpoints.participant.replace(
    ':id',
    studyIdentifier,

  )}/${participantId}`
  const data= {

    dataGroups:dataGroups 
  }


  const result = await callEndpoint<{identifier: string}>(
    endpoint,
    'DELETE',
    {},
    token,
  )
  return result.data.identifier
}*/

async function addParticipant(
  studyIdentifier: string,
  token: string,
  options: EditableParticipantData,
): Promise<string> {
  const endpoint = constants.endpoints.participant.replace(
    ':id',
    studyIdentifier,
  )
  const data: StringDictionary<any> = {
    appId: constants.constants.APP_ID,

    dataGroups: IS_TEST ? ['test_user'] : undefined,
  }
  if (options.phone) {
    data.phone = options.phone
  }
  if (options.externalId) {
    data.externalIds = { [studyIdentifier]: options.externalId }
  }

  const result = await callEndpoint<{ identifier: string }>(
    endpoint,
    'POST',
    data,
    token,
  )

  const userId = result.data.identifier

  if (options.clinicVisitDate) {
    const endpoint = constants.endpoints.events
      .replace(':studyId', studyIdentifier)
      .replace(':userId', userId)
    const data = {
      eventId: CLINIC_EVENT_ID,
      timestamp: new Date(options.clinicVisitDate).toISOString(),
    }

    await callEndpoint<{ identifier: string }>(endpoint, 'POST', data, token)
  }

  return userId
}
async function updateParticipant(
  studyIdentifier: string,
  token: string,
  participantId: string,
  options: EditableParticipantData,
): Promise<string> {
  // update notes
  const endpoint = `${constants.endpoints.participant.replace(
    ':id',
    studyIdentifier,
  )}/${participantId}`

  const data = {
    notes: options.notes,
  }

  await callEndpoint<ParticipantAccountSummary>(endpoint, 'POST', data, token)

  // update events
  let eventEndpoint = constants.endpoints.events
    .replace(':studyId', studyIdentifier)
    .replace(':userId', participantId)

  if (options.clinicVisitDate) {
    const endpoint = constants.endpoints.events
      .replace(':studyId', studyIdentifier)
      .replace(':userId', participantId)
    const data = {
      eventId: CLINIC_EVENT_ID,
      timestamp: new Date(options.clinicVisitDate).toISOString(),
    }

    await callEndpoint<{ identifier: string }>(endpoint, 'POST', data, token)
  } else {
    console.log('deleting')
    eventEndpoint = eventEndpoint + CLINIC_EVENT_ID
    await callEndpoint<{ identifier: string }>(endpoint, 'DELETE', {}, token)
  }

  return participantId
}

async function getRequestInfoForParticipant(
  studyIdentifier: string,
  token: string,
  participantId: string,
) {
  //transform ids into promises

  const endpoint = constants.endpoints.requestInfo
    .replace(':studyId', studyIdentifier)
    .replace(':userId', participantId)

  const info = await callEndpoint<{ signedInOn: any }>(
    endpoint,
    'GET',
    {},
    token,
  )
  return info.data
}

const ParticipantService = {
  addParticipant,
  deleteParticipant,
  getAllParticipants,
  getClinicVisitsForParticipants,
  getEnrollments,
  getParticipantWithId,
  getParticipants,
  getRequestInfoForParticipant,
  updateParticipant,
  withdrawParticipant,
}

export default ParticipantService
