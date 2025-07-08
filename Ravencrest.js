const Guild = require("./Guild");
const delay = require("sleep-promise");

class Ravencrest extends Guild {
  constructor(client, generalConfig, guildConfig) {
    super(client, generalConfig, guildConfig);
  }

  async isAllowedChannel(channel) {
    const regex = /-\d{1,2}-\d{1,2}$/;

    return regex.test(channel.name);
  }

  isValidEmbedMessage(message) {
    if (!message.embeds || message.embeds.length !== 1) return false;

    const embed = message.embeds[0];
    const expectedTitle = this.guildConfig.bot.message;

    return embed.title.includes(expectedTitle);
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
    const configStartLevel = this.generalConfig.level?.start ?? 0;
    const configEndLevel = this.generalConfig.level?.end ?? 80;

    // Get the channel name where the message was sent
    const channelName = message.channel?.name;
    if (!channelName) return false;

    // Use regex to match level range pattern (e.g., "level-60-80")
    const regex = /(\d{1,2})-(\d{1,2})/;
    const match = channelName.match(regex);

    if (!match) return false;

    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);

    this.levels.push({ start: start, end: end });

    return start < end || start > configStartLevel || end < configEndLevel;
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
    //   console.log(`[Ravencrest] ${emoji} Reacted to message: ${message.id}`);
    // } catch (err) {
    //   console.error(`[Ravencrest] ❌ Failed to react:`, err);
    // }
  }
}

module.exports = Ravencrest;
