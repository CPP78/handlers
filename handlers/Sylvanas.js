const Guild = require('./Guild')
const delay = require('sleep-promise')
const logger = require('../utils/logger')
const fs = require('fs')
const path = require('path')

class Sylvanas extends Guild {
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

    if (!this.isAllowedChannel(channel)) return
    if (!this.isBot(author.id)) return
    if (!this.isValidEmbedMessage(message)) return

    this.levels = []

    if (!this.isValidLevelRange(message)) return

    const delaySeconds = this.guildConfig.timers?.delay ?? 0
    const delayMs = delaySeconds * 1000

    const emoji = this.guildConfig.reaction

    if (!emoji) return

    await delay(delayMs)

    const configsPath = path.join(
      __dirname,
      '..',
      'resources',
      'app.asar.unpacked',
      'resources',
      'configs',
      'configs.json'
    )

    const generalConfig = JSON.parse(fs.readFileSync(configsPath, 'utf-8'))

    if (generalConfig.state === 0) return

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id
    }

    this.logOrderInfo(orderInfo)

    try {
      await message.react(emoji)
      logger.print(`[Sylvanas] ${emoji} Reacted to message: ${message.id}`)
    } catch (err) {
      logger.error(`[Sylvanas] ❌ Failed to react:`, err)
    }
  }
}

module.exports = Sylvanas
