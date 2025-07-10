const Guild = require("./Guild");
const delay = require("sleep-promise");
const logger = require("../utils/logger");
// new update
class Celestial extends Guild {
  constructor(generalConfig, guildConfig) {
    super(generalConfig, guildConfig);
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
    if (!embed || !embed.fields) return false;

    const titleField = embed.fields.find(
      (field) => field.name.toLowerCase() === "title"
    );

    if (!titleField || !titleField.value) return false;

    const regex = /(\d+)\s*-\s*(\d+)/;
    const match = titleField.value.match(regex);

    if (!match) return false;

    const startLevel = parseInt(match[1], 10);
    const endLevel = parseInt(match[2], 10);

    if (startLevel > endLevel) return false;
    if (startLevel < configStartLevel || endLevel > configEndLevel)
      return false;

    this.levels.push({ start: startLevel, end: endLevel });

    return true;
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

    if (!this.isAllowedChannel(channel.id)) return;
    if (!this.isBot(author.id)) return;
    if (!this.isValidEmbedMessage(message)) return;

    this.levels = [];

    if (!this.isValidLevelRange(message)) return;

    const delaySeconds = this.generalConfig.timers?.delay ?? 0;
    const delayMs = delaySeconds * 1000;

    await delay(delayMs);

    if (this.generalConfig.status === 0) return;

    const takeButton = message.components
      ?.flatMap((row) => row.components)
      .find((btn) => btn.label?.toLowerCase().includes("take"));

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
    //       `[Celestial] Clicked button '${takeButton.label}' on message: ${message.id}`
    //     );
    //   } catch (err) {
    //     console.error(`[Celestial] ❌ Failed to click button:`, err);
    //   }
    // } else {
    //   console.log(`[Celestial] No "take" button found on message: ${message.id}`);
    // }
  }
}

module.exports = Celestial;
