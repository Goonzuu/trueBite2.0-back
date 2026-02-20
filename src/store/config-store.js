const { createDefaultConfig } = require("../lib/reservation-config");

const configs = new Map();

function getConfig(restaurantId) {
  if (!configs.has(restaurantId)) {
    configs.set(restaurantId, createDefaultConfig(restaurantId));
  }
  return configs.get(restaurantId);
}

function setConfig(restaurantId, config) {
  const next = { ...config, restaurantId };
  configs.set(restaurantId, next);
  return next;
}

module.exports = { getConfig, setConfig };