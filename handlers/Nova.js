const Guild = require('./Guild')
const delay = require('sleep-promise')
const logger = require('../utils/logger')

class Nova extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig)
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0
    const configEndLevel = this.generalConfig.level?.end ?? 80

    const content = message.content.replace(/<@&\d+>/g, '')

    const regex = new RegExp(`(\\d+)\\s*-\\s*(\\d+)`, 'g')

    const levelRanges = [...content.matchAll(regex)]

    if (levelRanges.length === 0) {
      return false
    }

    for (const match of levelRanges) {
      const startLevel = parseInt(match[1], 10)
      const endLevel = parseInt(match[2], 10)

      if (startLevel > endLevel) return false

      if (startLevel < configStartLevel || endLevel > configEndLevel) {
        return false
      }

      this.levels.push({ start: startLevel, end: endLevel })
    }

    return true
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

  async take(message, prevOrder) {
    const { channel, member, author, guild } = message
    if (!channel || !member || !guild) return

    if (this.guildConfig.status === 0) return

    // ✅ Filter only whitelisted channels
    if (!this.isAllowedChannel(channel.id)) return

    // ✅ Advertiser Message Handling
    if (this.checkAllowedRoles(member)) {
      if (!this.hasMentionedRole(message)) return

      this.levels = []

      if (!this.isValidLevelRange(message)) return

      // Log the order info before reacting
      const orderInfo = {
        guildId: message.guild.id,
        guildName: message.guild.name,
        messageId: message.id
      }

      this.logOrderInfo(orderInfo)

      return {
        status: 'pending'
      }
    }

    // ✅ Nova Bot Handling (Post-order)
    if (this.isBot(author.id)) {
      if (!prevOrder) return

      const expectedBotMessage = this.guildConfig.bot.message
      if (!expectedBotMessage) return

      // ✅ Check if bot's message includes the expected string
      if (!message.content.includes(expectedBotMessage)) return

      const delaySeconds = this.guildConfig.timers?.delay ?? 0
      const delayMs = delaySeconds * 1000
      await delay(delayMs)

      if (this.generalConfig.status === 0) return

      const mssg = await channel.send('take')

      return { status: 'done', message: mssg }
    }
  }
}

module.exports = Nova
