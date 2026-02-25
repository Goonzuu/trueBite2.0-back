function createTimeRange(open = "12:00", close = "15:00") {
  return { open, close };
}

function createOpeningHours() {
  return {
    0: [],
    1: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    2: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    3: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    4: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:00")],
    5: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:30")],
    6: [createTimeRange("12:00", "15:00"), createTimeRange("19:00", "23:30")],
  };
}

function createArea(overrides = {}) {
  return {
    id: `area-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: "Interior",
    enabled: true,
    capacityPeople: 40,
    minPartySize: 1,
    maxPartySize: 8,
    ...overrides,
  };
}

function createDefaultConfig(restaurantId) {
  return {
    restaurantId,
    reservationsEnabled: false,
    reservationsPaused: false,
    wizardCompleted: false,
    openingHours: createOpeningHours(),
    areas: [
      createArea({ name: "Interior" }),
      createArea({ name: "Exterior", capacityPeople: 20 }),
    ],
    rules: {
      durationMinutes: 90,
      bufferMinutes: 10,
      maxPeoplePerReservation: 12,
      minAdvanceHours: 1,
    },
    confirmationMode: "auto",
  };
}

module.exports = { createDefaultConfig, createOpeningHours, createArea };