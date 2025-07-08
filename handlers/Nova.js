const Guild = require("./Guild");
const delay = require("sleep-promise");

class Nova extends Guild {
  constructor(client, generalConfig, guildConfig) {
    super(client, generalConfig, guildConfig);
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0;
    const configEndLevel = this.generalConfig.level?.end ?? 80;

    const content = message.content.replace(/<@&\d+>/g, "");

    const regex = new RegExp(`(\\d+)\\s*-\\s*(\\d+)`, "g");

    const levelRanges = [...content.matchAll(regex)];

    if (levelRanges.length === 0) {
      return false;
    }

    for (const match of levelRanges) {
      const startLevel = parseInt(match[1], 10);
      const endLevel = parseInt(match[2], 10);

      if (startLevel > endLevel) return false;

      if (startLevel < configStartLevel || endLevel > configEndLevel) {
        return false;
      }

      this.levels.push({ start: startLevel, end: endLevel });
    }

    return true;
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

  async take(message, prevOrder) {
    const { channel, member, author, guild } = message;
    if (!channel || !member || !guild) return;

    this.levels = [];

    if (this.guildConfig.status === 0) return;

    // ✅ Filter only whitelisted channels
    if (!this.isAllowedChannel(channel.id)) return;

    // ✅ Advertiser Message Handling
    if (this.checkAllowedRoles(member)) {
      if (!this.hasMentionedRole(message)) return;
      if (!this.isValidLevelRange(message)) return;

      // Log the order info before reacting
      const orderInfo = {
        guildId: message.guild.id,
        guildName: message.guild.name,
        messageId: message.id,
      };

      this.logOrderInfo(orderInfo);

      return {
        status: "pending",
      };
    }

    // ✅ Nova Bot Handling (Post-order)
    if (this.isBot(author.id)) {
      if (!prevOrder) return;

      const expectedBotMessage = this.guildConfig.bot.message;
      if (!expectedBotMessage) return;

      // ✅ Check if bot's message includes the expected string
      if (!message.content.includes(expectedBotMessage)) return;

      const delaySeconds = this.guildConfig.timers?.delay ?? 0;
      const delayMs = delaySeconds * 1000;
      await delay(delayMs);

      if (this.generalConfig.status === 0) return;

      // await channel.send("take");

      return { status: "done" };
    }
  }
}

module.exports = Nova;
