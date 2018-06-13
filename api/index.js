import Koa from 'koa'
import Router from 'koa-router'
import bodyparser from 'koa-bodyparser'
import cors from '@koa/cors'
import graphqlHTTP from 'koa-graphql'

import schema from './schema'
import logger from './logger'
import jwt from './jwt'

const app = new Koa()
const router = new Router()

router.all(
  '/v1',
  graphqlHTTP({
    schema,
    graphiql: process.env.NODE_ENV !== 'production',
    pretty: process.env.NODE_ENV !== 'production',
    formatError: error => ({
      message: error.message,
      locations: error.locations,
      stack: error.stack,
      path: error.path
    })
  })
)

app
  .use(cors())
  .use(bodyparser())
  .use(jwt)
  .use(function(ctx, next) {
    return next().catch(err => {
      if (err.status === 401) {
        ctx.status = 401
        ctx.body = {
          error: err.originalError ? err.originalError.message : err.message
        }
      } else {
        throw err
      }
    })
  })
  .use(router.routes())
  .use(router.allowedMethods())

app.on('error', err => {
  logger.exception(err)
})

app.listen(3000)
