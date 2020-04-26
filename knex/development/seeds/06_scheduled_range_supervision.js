const casual = require('casual')
const moment = require('moment')
const _ = require('lodash')

const path = require('path')
const root = path.join(__dirname, '..', '..', '..')
const config = require(path.join(root, 'config'))

casual.seed(config.seeds.seed)

exports.seed = async function(knex) {
  const [availableReservations, supervisors] = await Promise.all([
    knex('range_reservation')
      .select('id')
      .where({ available: true })
    , knex('supervisor')
      .select('user_id')
  ])

  process.stdout.write(`${availableReservations.length} schedules...`)
  const schedules = await Promise.all(availableReservations.map(({id}) => (
    casual.supervision(
      id
      , supervisors[casual.integer(0, supervisors.length - 1)].user_id))))
  console.log('done')

  process.stdout.write('Inserting...')
  await Promise.all(
    _.chunk(schedules, config.seeds.chunkSize)
      .map(async (scheduleBatch) => (
        knex('scheduled_range_supervision')
          .insert(scheduleBatch))))
  console.log('done')
}

casual.define('supervision', function(reservationId, supervisor) {
  const openingHour = casual.integer(0, 22)
  const closingHour = casual.integer(openingHour + 1, 23)

  const open = `${openingHour}:${casual.integer(0, 59)}:00`
  const close = `${closingHour}:${casual.integer(0, 59)}:00`
  const useSupervisor = !!casual.integer(0, 3)

  return {
    range_reservation_id: reservationId
    , supervisor_id: useSupervisor ? supervisor : null
    , open: open
    , close: close
  }
})
