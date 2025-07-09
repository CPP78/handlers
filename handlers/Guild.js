const logger = require("../utils/logger");

class Guild {
  constructor(client, generalConfig, guildConfig) {
    this.client = client;
    this.generalConfig = generalConfig;
    this.guildConfig = guildConfig;
    this.levels = [];
    logger.print(`⚔️ Guild handler loaded for ${guildConfig.name}`);
  }

  async take(message) {
    throw new Error("Method 'take' must be implemented by subclass");
  }

  isValidEmbedMessage() {
    throw new Error("Method 'take' must be implemented by subclass");
  }

  isBot(authorId) {
    const botId = this.guildConfig.bot.id;

    if (!botId) return false;

    return authorId === botId;
  }

  isAllowedCategory(categoryId) {
    if (
      !Array.isArray(this.guildConfig.categories) ||
      this.guildConfig.categories.length === 0
    ) {
      return true;
    }
    return this.guildConfig.categories.includes(categoryId);
  }

  isAllowedChannel(channelId) {
    if (
      !Array.isArray(this.guildConfig.channels) ||
      this.guildConfig.channels.length === 0
    ) {
      return false;
    }

    return this.guildConfig.channels.includes(channelId);
  }

  checkRole(member, roleIdentifier) {
    return member.roles.cache.some(
      (role) => role.id === roleIdentifier || role.name === roleIdentifier
    );
  }

  checkAllowedRoles(member) {
    const allowedRoles = this.guildConfig.roles;

    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return false;
    }

    return allowedRoles.some((roleName) => this.checkRole(member, roleName));
  }

  hasMentionedRole(message) {
    if (
      !Array.isArray(this.guildConfig.roles) ||
      this.guildConfig.roles.length === 0
    ) {
      return false;
    }

    return message.mentions.roles.some((role) =>
      this.guildConfig.mentions.includes(role.name)
    );
  }

  isValidLevelRange(message) {
    const configStartLevel = this.generalConfig.level?.start ?? 0;
    const configEndLevel = this.generalConfig.level?.end ?? 80;

    const content = message.content.replace(/<@&\d+>/g, "");

    const separators = this.guildConfig.separators || ["-"];

    const escapedSeparators = separators.map((sep) =>
      sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );

    const sepPattern = `[${escapedSeparators.join("")}]+`;

    const regex = new RegExp(`(\\d+)\\s*${sepPattern}\\s*(\\d+)`, "g");

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

      console.log(this.levels);
    }

    return true;
  }
}

module.exports = Guild;
