import {BluDB, REPLBuilder, JSONBuilder} from "bludb"
const DB = new BluDB(
  JSONBuilder()
)

DB.default({
  tracking: []
}, key => {
  return key.startsWith("user/")
})

const ACTIVE_BUFFER = (((1000) * 60) * 0.5)

type TrackingType = ( "join" | "leave" | "start_speaking" | "stop_speaking" | "message" )

function msToTime(duration) {
  var milliseconds = Math.floor((duration % 1000) / 100),
    seconds: any = Math.floor((duration / 1000) % 60),
    minutes: any = Math.floor((duration / (1000 * 60)) % 60),
    hours: any = Math.floor((duration / ((1000 * 60) * 60)));

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

const UserStore = {
  _eventstore: {},
  get: async function (id: String) {
    var UserDB = await DB.fetch(`user/${id}`)
    return {data: UserDB.data, UserDB: UserDB}
  },
  track: async function(id: String, type: TrackingType, timestamp = Date.now()) {
    var {UserDB} = await this.get(id)
    UserDB.data.tracking.push({type, timestamp})
    await UserDB.write()
  },
  times: async function(id: (String | Object), isDB: boolean = false) {
    if (!isDB) {
      var UserDB = await DB.fetch(`user/${id}`)
    } else {
      var UserDB = id
    }

    var totalTime = 0  
    var activeTime = 0
    var inactiveTime = 0

    enum UserState {
      AWAY, // Not connected at all
      INACTIVE, // Connected, but not active
      MESSAGING, // Connected and actively messaging
      SPEAKING // Connected and actively speaking in VC
    }

    const chain_types = ["start_speaking", "message"]

    var trackingWithBuffers = []
    UserDB.data.tracking.sort((a, b) => {
      return (a.timestamp - b.timestamp)
    })
    UserDB.data.tracking.forEach(entry => {
      var chained_entry = UserDB.data.tracking.find(thisEntry => (chain_types.includes(thisEntry.type) && (thisEntry.timestamp > entry.timestamp) && (thisEntry.timestamp < (entry.timestamp + ACTIVE_BUFFER))))
      entry.chained_entry = chained_entry
      trackingWithBuffers.push(entry)
      switch (entry.type) {
        case "stop_speaking":
          trackingWithBuffers.push({type: "buffer_speaking", timestamp: (entry.timestamp + ACTIVE_BUFFER)})
        break;
        case "message":
          messageCount += 1
          trackingWithBuffers.push({type: "buffer_message", timestamp: (entry.timestamp + ACTIVE_BUFFER)})
        break;
      }
    })

    trackingWithBuffers.sort((a, b) => {
      return (a.timestamp - b.timestamp)
    })

    var currentState = UserState.AWAY
    var activeStartTimestamp = null
    var lastSpeakingTimestamp = null
    var lastMessageTimestamp = null
    var pendingSpeaking = false
    var pendingMessage = false
    var messageCount = 0
    var joinedTimestamp = null
    // console.log(trackingWithBuffers)

    if (trackingWithBuffers[trackingWithBuffers.length -1].type != "leave") {
      trackingWithBuffers.push({type: "leave", timestamp: Date.now()})
    }

    trackingWithBuffers.forEach(entry => {
      switch (entry.type) {
        case "join":
          if (joinedTimestamp == null) { joinedTimestamp = entry.timestamp }
        break;
        case "leave":
          if (joinedTimestamp != null) {
            totalTime += (entry.timestamp - joinedTimestamp)
            joinedTimestamp = null
          }
        break;
        case "start_speaking":
          if (activeStartTimestamp == null) { activeStartTimestamp = entry.timestamp }
          lastSpeakingTimestamp = entry.timestamp
          currentState = UserState.SPEAKING
        break;
        case "stop_speaking":
          if (entry.chained_entry == null) {
            var addedTime = (entry.timestamp - activeStartTimestamp)
            activeTime += addedTime
            console.log("+ Speaking: ", msToTime(addedTime))
            activeStartTimestamp = null
          }
        break;
        case "buffer_speaking":

        break;
        case "message":
          if (entry.chained_entry != null) {
            if (activeStartTimestamp == null) { activeStartTimestamp = entry.timestamp }
            lastMessageTimestamp = entry.timestamp
            if (currentState != UserState.SPEAKING) {currentState = UserState.MESSAGING}
          } else if (activeStartTimestamp != null) {
            var addedTime = (entry.timestamp - activeStartTimestamp)
            activeTime += addedTime
            console.log("+ Messaging: ", msToTime(addedTime))
            activeStartTimestamp = null
          }
        break;
        case "buffer_message":

        break;
      }
    })

    inactiveTime = (totalTime - activeTime)

    return {totalTime, activeTime, inactiveTime}
  },
  list: async function() {
    var keys = await DB.keys()

    var temp_arr = []
    await keys.awaitForEach(async key => {
      if (key.startsWith("user/")) {
        var id = key.split("/")[1]
        var {data} = await this.get(id)
        var times = await this.times({data}, true)
        temp_arr.push({id, data, times})
      }
    })

    temp_arr.sort((a, b) => {
      const calcVal = (obj) => {
        return ((obj.times.activeTime * 100) + obj.times.totalTime)
      }

      var a_val = calcVal(a)
      var b_val = calcVal(b)

      return (b_val - a_val)
    })

    var return_obj = {}
    temp_arr.forEach(keyValue => {
      return_obj[keyValue.id] = keyValue.data
    })

    return return_obj
  }
}

export default UserStore