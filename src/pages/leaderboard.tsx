import { css, cx, keyframes, Style } from 'hono/css'
import UserStore from '../user_storage'
import client from '../discord'

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

const LeaderboardEntry = async ({userId, times, ind}) => {
  const LeaderboardEntryStyle = css`
  display: grid;
  background: #353535;
  padding: 15px;
  margin: 15px;
  width: calc(100vw - 30px - 30px - 15px);
  grid-template-columns: 80px 80px auto 160px;
  gap: 15px;
  border-radius: 30px;
  align-items: center;
  `
  const LeaderboardEmblemStyle = css`
  width: 60px;
  height 60px;
  margin: 10px;
  `
  const LeaderboardEntryAvatarStyle = css`
  border-radius: 50%;
  width: 80px;
  height 80px;
  `
  const LeaderboardEntryUsernameStyle = css`
  font-size: 32px;
  margin: 0px;
  `
  const LeaderboardEntryTimeStyle = css`
  font-size: 32px;
  margin: 0px;
  `

  const Emblems = {
    "0": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f947.png",
    "1": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f948.png",
    "2": "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f949.png",
  }

  times = await UserStore.times({data: times}, true)

  var userObj = await client.users.fetch(userId)
  var displayName = userObj.displayName

  var emblem = (Emblems[String(ind)] || "")

  return (
    <div class={LeaderboardEntryStyle}>
      <img class={LeaderboardEmblemStyle} src={emblem} alt={userObj.username}></img>
      <img class={LeaderboardEntryAvatarStyle} src={userObj.displayAvatarURL({size: 512, format: "png"})} alt={userObj.username}></img>
      <p class={LeaderboardEntryUsernameStyle}>{displayName}</p>
      <p class={LeaderboardEntryTimeStyle}>{msToTime(times.totalTime)}</p>
    </div>
  )
}

const Leaderboard = async () => {
  const LeaderboardStyle = css`
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  top: calc(64px + 15px);
  `

  var users = await UserStore.list()

  return (
    <div class={LeaderboardStyle}>
      {Object.keys(users).map((userId, ind) => {
        var times = users[userId]
        return (<LeaderboardEntry userId={userId} times={times} ind={ind}/>)
      })}
    </div>
  )
}

export default Leaderboard