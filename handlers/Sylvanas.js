const Guild = require("./Guild");
const delay = require("sleep-promise");
const logger = require("../utils/logger");

class Sylvanas extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig);
  }

  async isAllowedChannel(channel) {
    return channel.isThread?.() === true;
  }

  isValidEmbedMessage(message) {
    return message.embeds?.length === 1;
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0;
    const configEndLevel = this.generalConfig.level?.end ?? 80;

    const embed = message.embeds?.[0];
    if (!embed?.fields || embed.fields.length === 0) return false;

    const regex = /(\d+)\s*-\s*(\d+)/;

    for (const field of embed.fields) {
      const name = field.name?.toLowerCase() || "";
      const value = field.value;

      // Look for fields like "Leveling", "Level", etc.
      if (name.includes("level")) {
        const match = value.match(regex);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = parseInt(match[2], 10);

          if (
            start <= end &&
            start >= configStartLevel &&
            end <= configEndLevel
          ) {
            this.levels.push({ start: start, end: end });
            return true;
          }
        }
      }
    }

    return false;
  }
  logOrderInfo(order) {
    const levelRanges =
      this.levels && this.levels.length > 0
        ? this.levels.map(({ start, end }) => `${start}-${end}`).join(", ")
        : "None";

    logger.print(`🛒 Order Info:
Guild:       ${order.guildName} (ID: ${order.guildId})
Message ID:  ${order.messageId}
Levels:      [${levelRanges}]`);
  }

  async take(message) {
    const { channel, member, author } = message;
    if (!channel || !member || !author) return;

    if (this.guildConfig.status === 0) return;

    if (!this.isAllowedChannel(channel)) return;
    if (!this.isBot(author.id)) return;
    if (!this.isValidEmbedMessage(message)) return;

    this.levels = [];

    if (!this.isValidLevelRange(message)) return;

    const delaySeconds = this.generalConfig.timers?.delay ?? 0;
    const delayMs = delaySeconds * 1000;

    const emoji = this.guildConfig.reaction;

    if (!emoji) return;

    await delay(delayMs);

    if (this.generalConfig.status === 0) return;

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id,
    };

    this.logOrderInfo(orderInfo);

    // try {
    //   await message.react(emoji);
    //   console.log(`[Sylvanas] ${emoji} Reacted to message: ${message.id}`);
    // } catch (err) {
    //   console.error(`[Sylvanas] ❌ Failed to react:`, err);
    // }
  }
}

module.exports = Sylvanas;
