console.log("Initializing...")

import 'dotenv/config'

import { joinVoiceChannel } from '@discordjs/voice'
import { Client, GuildMember, VoiceChannel } from 'discord.js-selfbot-v13'
const client = new Client()
import UserStore from './user_storage'

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

client.on('ready', async () => {
  console.log(`${client.user.username} is ready!`)

  UserStore.list().then(result => {
    var userIds = Object.keys(result)
    userIds.forEach(async userId => {
      UserStore.track(userId, "stop_speaking")
      UserStore.track(userId, "leave")
    })
  })

  client.on("voiceStateUpdate", async (oldState, newState) => {
    var oldStateInVC = (oldState?.channelId == process.env["voice_channel"])
    var newStateInVC = (newState?.channelId == process.env["voice_channel"])
    var userId = (newState.user.id || oldState.user.id)

    if (oldStateInVC && newStateInVC) {
      console.log(`• Me already in the VC as fuck`)
      // console.log(`• ${userId} already in VC...`)
      // await UserStore.track(userId, "join")
    } // Already in VC

    if (!oldStateInVC && newStateInVC) { // Joined VC
      console.log(`+ ${userId} joined VC`)
      await UserStore.track(userId, "join")
    }

    if (oldStateInVC && !newStateInVC) { // Left VC
      console.log(`- ${userId} left VC`)
      await UserStore.track(userId, "leave")
    }
  })

  client.on("messageCreate", async msg => {
    var userId = msg.author.id
    var isInVC = msg?.member?.voice?.channelId == process.env["voice_channel"]
    if (isInVC && msg.channelId == process.env["voice_channel"]) {
      await UserStore.track(userId, "message")
      console.log("tracked 'message' event for ", userId)
    }

    if (msg.content == "!calculateTimes") {
      var result = await UserStore.times(userId)
      console.log(`Total Time: ${msToTime(result.totalTime)}`)
      console.log(`Active Time: ${msToTime(result.activeTime)}`)
      console.log(`Inactive Time: ${msToTime(result.inactiveTime)}`)
    }

    if (msg.content == "!list") {
      var userstores = await UserStore.list()
      console.log(userstores)
    }
  })

  var connection = await joinVC()

  client.channels.fetch(process.env["voice_channel"]).then((channel: VoiceChannel) => {
    Array.from(channel.members.keys()).forEach(async (userId: string) => {
      console.log(`• ${userId} already in VC...`)
      await UserStore.track(userId, "join")
    })
  })

  // Array.from(connection.receiver.speaking.users.keys()).forEach(async userId => {
  //   console.log(`• ${userId} already in VC...`)
  //   await UserStore.track(userId, "join")
  // })

  connection.receiver.speaking.on("start", async userId => {
    await UserStore.track(userId, "start_speaking")
    console.log("tracked 'start_speaking' event for ", userId)
  })
  
  connection.receiver.speaking.on("end", async userId => {
    await UserStore.track(userId, "stop_speaking")
    console.log("tracked 'stop_speaking' event for ", userId)
  })
})

async function joinVC() {
  var guild = await client.guilds.fetch(process.env["guild"])

  const connection = joinVoiceChannel({
    channelId: process.env["voice_channel"],
    guildId: process.env["guild"],
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false
  })

  return connection
}

client.login(process.env["token"])

export default client