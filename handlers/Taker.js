const Guild = require("./Guild");
const delay = require("sleep-promise");

class Taker extends Guild {
  constructor(client, generalConfig, guildConfig) {
    super(client, generalConfig, guildConfig);
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
    const { channel, member } = message;
    if (!channel || !member) return;

    this.levels = [];

    if (this.guildConfig.status === 0) return;

    if (!this.isAllowedChannel(channel.id)) return;
    if (!this.checkAllowedRoles(member)) return;
    if (!this.hasMentionedRole(message)) return;
    if (!this.isValidLevelRange(message)) return;

    const delaySeconds = this.generalConfig.timers?.delay ?? 0;
    const delayMs = delaySeconds * 1000;

    await delay(delayMs);

    if (this.generalConfig.status === 0) return;

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id,
    };

    this.logOrderInfo(orderInfo);

    // await channel.send("take");

    console.log("xxx");
  }
}

module.exports = Taker;
