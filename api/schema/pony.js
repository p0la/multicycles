import { GraphQLObjectType, GraphQLList, GraphQLFloat, GraphQLString, GraphQLBoolean } from 'graphql'

import Pony from '@multicycles/pony'

import { VehicleType } from './vehicles'
import { ProviderType } from './providers'
import logger from '../logger'
import cache from '../cache'

const client = new Pony()

const PonyType = new GraphQLObjectType({
  name: 'Pony',
  description: 'A Pony bike',
  interfaces: () => [VehicleType],
  fields: {
    id: { type: GraphQLString },
    lat: { type: GraphQLFloat },
    lng: { type: GraphQLFloat },
    provider: { type: ProviderType },
    manualLocation: { type: GraphQLBoolean },
    reason: { type: GraphQLString },
    region: { type: GraphQLString },
    status: { type: GraphQLString },
    userId: { type: GraphQLString }
  }
})

const pony = {
  type: new GraphQLList(PonyType),
  async resolve({ lat, lng }, args, context, info) {
    try {
      const cached = await cache.get(`pony|${lat}|${lng}`)

      if (cached) {
        return cached
      }

      const result = await client.getBicyclesByLatLng({
        lat,
        lng
      })

      const formatedResult = result.filter(bike => bike.status === 'AVAILABLE').map(bike => ({
        id: bike.physicalId,
        lat: bike.latitude,
        lng: bike.longitude,
        provider: Pony.getProviderDetails(),
        manualLocation: bike.manualLocation,
        reason: bike.reason,
        region: bike.region,
        status: bike.status,
        userId: bike.userId
      }))

      cache.set(`pony|${lat}|${lng}`, formatedResult)
      return formatedResult
    } catch (e) {
      logger.exception(e, {
        tags: { provider: 'pony' },
        extra: {
          path: info.path,
          variable: info.variableValues,
          body: context.req.body
        }
      })

      return []
    }
  }
}

const provider = Pony.getProviderDetails()

export { PonyType, pony, provider }
