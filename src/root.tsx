import { css, cx, keyframes, Style } from 'hono/css'
import LeaderboardPage from './pages/leaderboard'

var Pages = {
  "leaderboard": LeaderboardPage,
}

const Header = () => {
  const HeaderStyle = css`
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 100;
    background: var(--accent);
    border: none;
    width: 100%;
    height: 64px;
  `

  const HeaderSelectStyle = css`
    color: white;
    background: none;
    border: none;
    font-size: 32px;
    font-weight: bolder;
    margin-left: 15px;
  `

  function handleChange(e) {
    console.log(e.target.value)
  }

  return (
    <div class={HeaderStyle}>
      <select title="Current page" class={HeaderSelectStyle} onChange={handleChange}>
        {Object.keys(Pages).map(key => {
          return (<option value={key}>{key}</option>)
        })}
      </select>
    </div>
  )
}

const ACLURootStyle = css`
background: #151515;
--accent: #785db3;
font-family: "Rubik", sans-serif;
color: white;
font-weight: bolder;
margin: 0px;
`

const ACLURoot = () => {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet"/>

        <title>ACULT 1K HOUR VC WEB PANEL</title>

        <meta content="ACULT 1K HOUR VC WEB PANEL" property="og:title" />
	      <meta content="🟣 ‼ DOUBTERS STAY OUT ‼ 🟣" property="og:description" />
	      <meta name="theme-color" content="#785db3" />
        <meta name="msapplication-TileColor" content="#785db3" />
        <Style />
      </head>
      <body class={ACLURootStyle}>
        <Header />
        <LeaderboardPage />
      </body>
    </html>
  )
}

export default ACLURoot