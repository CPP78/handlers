const Guild = require("./Guild");
const delay = require("sleep-promise");

class Sylvanas extends Guild {
  constructor(client, generalConfig, guildConfig) {
    super(client, generalConfig, guildConfig);
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
  // Log the order details in a nice format
  logOrderInfo(order) {
    console.log("🛒 Order Info:");
    console.log(`Guild:       ${order.guildName} (ID: ${order.guildId})`);
    console.log(`Message ID:  ${order.messageId}`);

    // Format the levels as [start-end, start-end, ...]
    if (this.levels && this.levels.length > 0) {
      const levelRanges = this.levels
        .map(({ start, end }) => `${start}-${end}`)
        .join(", ");
      console.log(`Levels:      [${levelRanges}]`);
    } else {
      console.log("Levels:     None");
    }

    console.log("────────────────────────────");
  }

  async take(message) {
    const { channel, member, author } = message;
    if (!channel || !member || !author) return;

    this.levels = [];

    if (this.guildConfig.status === 0) return;

    if (!this.isAllowedChannel(channel)) return;
    if (!this.isBot(author.id)) return;
    if (!this.isValidEmbedMessage(message)) return;
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
