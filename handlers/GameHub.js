const Guild = require('./Guild')
const delay = require('sleep-promise')
const logger = require('../utils/logger')
const fs = require('fs')
const path = require('path')

class GameHub extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig)
  }

  isValidEmbedMessage(message) {
    if (!message.embeds || message.embeds.length !== 1) return false

    const embed = message.embeds[0]

    if (!embed || !embed.title) return false

    const embedTitle = embed.title
    const expectedTitle = this.guildConfig.bot.message

    return embedTitle.includes(expectedTitle)
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0
    const configEndLevel = this.generalConfig.level?.end ?? 80

    const embed = message.embeds[0]
    if (!embed || !embed.fields) return false

    const levelField = embed.fields.find((f) => f.name.toLowerCase().includes('level range'))
    if (!levelField || !levelField.value) return false

    const regex = /(\d+)\s*-\s*(\d+)/g
    const match = regex.exec(levelField.value)

    if (!match) return false

    const startLevel = parseInt(match[1], 10)
    const endLevel = parseInt(match[2], 10)

    if (startLevel > endLevel) return false
    if (startLevel < configStartLevel || endLevel > configEndLevel) return false

    this.levels.push({ start: startLevel, end: endLevel })
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

    if (!this.isAllowedChannel(channel.id)) return
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
      logger.print(`[GameHub] ${emoji} Reacted to message: ${message.id}`)
    } catch (err) {
      logger.error(`[GameHub] ❌ Failed to react:`, err)
    }
  }
}

module.exports = GameHub
