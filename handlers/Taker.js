const Guild = require('./Guild')
const delay = require('sleep-promise')
const logger = require('../utils/logger')

class Taker extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig)
  }

  logOrderInfo(order) {
    const levelRanges =
      this.levels && this.levels.length > 0
        ? this.levels.map(({ start, end }) => `${start}-${end}`).join(', ')
        : 'None'

    logger.print(`🛒 Order Info:
Guild:       ${order.guildName} (ID: ${order.guildId})
Message ID:  ${order.messageId}
Levels:      [${levelRanges}]`)
  }
  async take(message) {
    const { channel, member } = message
    if (!channel || !member) return

    if (this.guildConfig.status === 0) return

    if (!this.isAllowedChannel(channel.id)) return
    if (!this.checkAllowedRoles(member)) return
    if (!this.hasMentionedRole(message)) return

    this.levels = []

    if (!this.isValidLevelRange(message)) return

    const delaySeconds = this.generalConfig.timers?.delay ?? 0
    const delayMs = delaySeconds * 1000

    await delay(delayMs)

    console.log(this.generalConfig.status)

    if (this.generalConfig.state === 0) return

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id
    }

    this.logOrderInfo(orderInfo)

    const mssg = await channel.send('take')

    return { status: 'done', message: mssg }
  }
}

module.exports = Taker
