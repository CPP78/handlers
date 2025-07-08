const Guild = require("./Guild");
const delay = require("sleep-promise");

class Exwow extends Guild {
  constructor(client, generalConfig, guildConfig) {
    super(client, generalConfig, guildConfig);
  }

  isValidEmbedMessage(message) {
    if (!message.embeds || message.embeds.length !== 1) return false;

    const embedTitle = message.embeds[0].title || "";
    const expectedTitle = this.guildConfig.bot.message || "";

    return embedTitle.includes(expectedTitle);
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0;
    const configEndLevel = this.generalConfig.level?.end ?? 80;

    const embed = message.embeds[0];
    if (!embed || !embed.description) return false;

    const regex = /\*\*Level Range:\*\*\s*(\d+)\s*-\s*(\d+)/;
    const match = embed.description.match(regex);

    if (!match) return false;

    const startLevel = parseInt(match[1], 10);
    const endLevel = parseInt(match[2], 10);

    if (startLevel > endLevel) return false;
    if (startLevel < configStartLevel || endLevel > configEndLevel)
      return false;

    this.levels.push({ start: startLevel, end: endLevel });

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

  async take(message) {
    const { channel, member, author } = message;
    if (!channel || !member || !author) return;

    this.levels = [];

    if (this.guildConfig.status === 0) return;

    if (!this.isAllowedChannel(channel.id)) return;
    if (!this.isBot(author.id)) return;
    if (!this.isValidEmbedMessage(message)) return;
    if (!this.isValidLevelRange(message)) return;

    const delaySeconds = this.generalConfig.timers?.delay ?? 0;
    const delayMs = delaySeconds * 1000;

    const emoji = this.guildConfig.reaction;

    if (emoji) return;

    await delay(delayMs);

    if (this.generalConfig.status === 0) return;

    const takeButton = message.components
      ?.flatMap((row) => row.components)
      .find((btn) => btn.label?.toLowerCase().includes("join"));

    if (!takeButton) return;

    // Log the order info before reacting
    const orderInfo = {
      guildId: message.guild.id,
      guildName: message.guild.name,
      messageId: message.id,
    };

    this.logOrderInfo(orderInfo);

    // if (takeButton) {
    //   try {
    //     await takeButton.click();
    //     console.log(
    //       `[Exwow
    // ] Clicked button '${takeButton.label}' on message: ${message.id}`
    //     );
    //   } catch (err) {
    //     console.error(`[Exwow
    // ] ❌ Failed to click button:`, err);
    //   }
    // } else {
    //   console.log(`[Exwow
    // ] No "take" button found on message: ${message.id}`);
    // }
  }
}

module.exports = Exwow;
