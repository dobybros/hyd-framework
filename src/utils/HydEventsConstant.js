/*
 * @Author: ZerroRt
 * @lastEditors: ZerroRt
 * @Date: 2020-11-23 11:25:54
 * @LastEditTime: 2020-11-23 14:10:42
 * @FilePath: \hyd-framework\src\utils\HydEventsConstant.js
 */
const events = {
  SYNC_ONSHAREDATA: 'SYNC_ONSHAREDATA',
  GET_SYNCINITDATA: 'GET_SYNCINITDATA'
}

const hydEventsPrefix = 'hyd_events'

function getEvents(scope) {
  let returnEvents = {}
  let scopePrefix = scope.constructor.name
  Object.keys(events).forEach(event => {
    returnEvents[event] = `${hydEventsPrefix}_${scopePrefix}_${event}`
  })

  return returnEvents
  
}

module.exports = {
  getEvents
}