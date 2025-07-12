const Guild = require('./Guild')
const delay = require('sleep-promise')
const logger = require('../utils/logger')

class Ravencrest extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig)
  }

  async isAllowedChannel(channel) {
    const regex = /-\d{1,2}-\d{1,2}$/

    return regex.test(channel.name)
  }

  isValidEmbedMessage(message) {
    if (!message.embeds || message.embeds.length !== 1) return false

    const embed = message.embeds[0]

    if (!embed) return false

    const embedTitle = embed.title || ''

    const expectedTitle = this.guildConfig.bot.message

    return embedTitle.includes(expectedTitle)
  }

  // isValidLevelRange(message) {
  //   const configStartLevel = this.generalConfig.level?.start ?? 0;
  //   const configEndLevel = this.generalConfig.level?.end ?? 80;

  //   const embed = message.embeds?.[0];
  //   if (!embed?.title) return false;

  //   const regex = /(\d{1,2})\s*-\s*(\d{1,2})/;
  //   const match = embed.title.match(regex);

  //   if (!match) return false;

  //   const start = parseInt(match[1], 10);
  //   const end = parseInt(match[2], 10);

  //   this.levels.push({ start: start, end: end });

  //   return start <= end && start >= configStartLevel && end <= configEndLevel;
  // }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0
    const configEndLevel = this.generalConfig.level?.end ?? 80

    // Get the channel name where the message was sent
    const channelName = message.channel?.name
    if (!channelName) return false

    // Use regex to match level range pattern (e.g., "level-60-80")
    const regex = /(\d{1,2})-(\d{1,2})/
    const match = channelName.match(regex)

    if (!match) return false

    const start = parseInt(match[1], 10)
    const end = parseInt(match[2], 10)

    this.levels.push({ start: start, end: end })

    return start < end || start > configStartLevel || end < configEndLevel
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

    this.levels = []

    if (this.guildConfig.status === 0) return

    if (!this.isAllowedChannel(channel)) return
    if (!this.isBot(author.id)) return
    if (!this.isValidEmbedMessage(message)) return
    if (!this.isValidLevelRange(message)) return

    const delaySeconds = this.guildConfig.timers?.delay ?? 0
    const delayMs = delaySeconds * 1000

    const emoji = this.guildConfig.reaction

    if (!emoji) return

    await delay(delayMs)

    if (this.generalConfig.state === 0) return

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id
    }

    this.logOrderInfo(orderInfo)

    try {
      await message.react(emoji)
      logger.print(`[Ravencrest] ${emoji} Reacted to message: ${message.id}`)
    } catch (err) {
      logger.error(`[Ravencrest] ❌ Failed to react:`, err)
    }
  }
}

module.exports = Ravencrest
