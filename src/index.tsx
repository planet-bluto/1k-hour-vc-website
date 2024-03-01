import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { css, cx, keyframes, Style } from 'hono/css'

import ACLURoot from './root'

const app = new Hono()

app.get('/', (c) => {
  return c.html(<ACLURoot />)
})

const port = 2258
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})
