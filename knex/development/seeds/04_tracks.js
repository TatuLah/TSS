const path = require('path')
const root = path.join(__dirname, '..', '..', '..')
const config = require(path.join(root, 'config'))

const _ = require('lodash')
const casual = require('casual')

casual.seed(config.seeds.seed)

exports.seed = async function(knex) {
  const ranges = config.seeds.ranges
  const tracks = config.seeds.tracks
  const total = ranges * tracks
  process.stdout.write(
    `${ranges} ranges * ${tracks} tracks = ${total} tracks...`)

  const _tracks = _.flatten(
    await Promise.all(
      (await knex('range')
       .select('id'))
        .map(async ({id}) => casual.range(id))))
  console.log('done')
  process.stdout.write('Inserting...')
  await Promise.all(
    _.chunk(_tracks, config.seeds.chunkSize)
      .map(async (trackChunk) => knex('track').insert(trackChunk)))
  console.log('done')
}

casual.define('track_description', function() {
  const names = [
    'Pistol'
    , 'Shotgun'
    , 'Rifle'
    , 'Indoor'
  ]

  const distances = [
    '10m'
    , '25m'
    , '50m'
    , '100m'
    , '150m'
    , '200m'
    , '300m'
  ]

  const name = names[casual.integer(0, names.length - 1)]
  const distance = distances[casual.integer(0, distances.length - 1)]
  return `${name} ${distance}`
})

casual.define('range', async function(rangeId) {
  const tracks = config.seeds.tracks
  return _.times(tracks, (i) => ({
    range_id: rangeId
    , name: `Shooting Track ${i}`
    , description: casual.track_description
  }))
})
