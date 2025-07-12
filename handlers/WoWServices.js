const Guild = require('./Guild')
const delay = require('sleep-promise')
const logger = require('../utils/logger')

class WoWServices extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig)
  }

  async isAllowedChannel(channel) {
    return channel.isThread?.() === true
  }

  isValidEmbedMessage(message) {
    return message.embeds?.length === 1
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0
    const configEndLevel = this.generalConfig.level?.end ?? 80

    const embed = message.embeds?.[0]
    if (!embed?.fields || embed.fields.length === 0) return false

    let start = null
    let end = null

    for (const field of embed.fields) {
      const name = field.name?.toLowerCase() || ''
      const value = +field.value

      // Look for fields like "Leveling", "Level", etc.
      if (name.includes('level')) {
        if (!start) {
          start = value
        } else {
          end = value
        }
      }
    }
    if (start >= end || start < configStartLevel || end > configEndLevel) {
      return false
    }

    this.levels.push({ start: start, end: end })

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

  async take(message) {
    const { channel, member, author } = message
    if (!channel || !member || !author) return

    if (this.guildConfig.status === 0) return

    if (!this.isAllowedChannel(channel)) return
    if (!this.isBot(author.id)) return
    if (!this.isValidEmbedMessage(message)) return

    this.levels = []

    if (!this.isValidLevelRange(message)) return

    const delaySeconds = this.guildConfig.timers?.delay ?? 0
    const delayMs = delaySeconds * 1000

    await delay(delayMs)

    if (this.generalConfig.state === 0) return

    const takeButton = message.components
      ?.flatMap((row) => row.components)
      .find((btn) => btn.label?.toLowerCase().includes('take'))

    if (!takeButton) return

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id
    }

    this.logOrderInfo(orderInfo)

    if (takeButton) {
      try {
        await message.clickButton(takeButton.customId)
        logger.print(
          `[WoW Services] Clicked button '${takeButton.label}' on message: ${message.id}`
        )
      } catch (err) {
        logger.error(`[WoW Services] ❌ Failed to click button:`, err)
      }
    } else {
      logger.error(`[WoW Services] No "take" button found on message: ${message.id}`)
    }
  }
}

module.exports = WoWServices
