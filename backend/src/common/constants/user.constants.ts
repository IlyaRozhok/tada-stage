export const USER_CONSTANTS = {
  // Age ranges
  AGE_RANGES: ["under-25", "25-34", "35-44", "45-54", "55+"] as const,

  // Work styles
  WORK_STYLES: ["Office", "Remote", "Hybrid", "Freelance"] as const,

  // Pet ownership
  PET_TYPES: ["none", "dog", "cat", "small-pets", "planning-to-get"] as const,

  // Smoking preferences
  SMOKING_PREFERENCES: [
    "no",
    "yes",
    "no-but-okay",
    "no-prefer-non-smoking",
    "no-preference",
  ] as const,

  // Ideal living environments
  IDEAL_LIVING_ENVIRONMENTS: [
    "quiet-professional",
    "social-friendly",
    "family-oriented",
    "student-lifestyle",
    "creative-artistic",
  ] as const,

  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,

  // Sort fields
  VALID_SORT_FIELDS: [
    "id",
    "email",
    "role",
    "status",
    "full_name",
    "created_at",
    "updated_at",
  ] as const,

  // Default status
  DEFAULT_STATUS: "active" as const,

  // Password requirements
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_SALT_ROUNDS: 10,
} as const;

export const PROFILE_CONSTANTS = {
  // Location preferences
  SECONDARY_LOCATIONS: [
    "kings-cross-st-pancras",
    "oxford-circus",
    "liverpool-street",
    "paddington",
    "waterloo",
    "victoria",
    "green-park",
    "bond-street",
    "baker-street",
    "canary-wharf",
    "london-bridge",
    "tottenham-court-road",
    "leicester-square",
    "piccadilly-circus",
    "euston",
    "no-preference",
  ] as const,

  COMMUTE_LOCATIONS: [
    "canary-wharf",
    "city-of-london",
    "westminster",
    "shoreditch",
    "kings-cross",
    "paddington",
    "south-bank",
    "mayfair",
    "holborn",
    "clerkenwell",
    "bermondsey",
    "stratford",
    "hammersmith",
    "croydon",
    "central-london",
    "no-preference",
  ] as const,

  // Property preferences
  FURNISHING_TYPES: [
    "furnished",
    "unfurnished",
    "part-furnished",
    "no-preference",
  ] as const,

  LET_DURATIONS: [
    "6-months",
    "12-months",
    "18-months",
    "24-months",
    "flexible",
  ] as const,

  PROPERTY_TYPES: ["flats", "houses"] as const,

  BUILDING_STYLES: ["btr", "co-living", "new-builds"] as const,

  HOUSE_SHARE_PREFERENCES: [
    "show-all",
    "only-house-shares",
    "no-house-shares",
  ] as const,

  DATE_FILTERS: [
    "any",
    "last-24-hours",
    "last-3-days",
    "last-7-days",
    "last-14-days",
    "last-21-days",
  ] as const,

  // Feature categories
  LIFESTYLE_FEATURES: [
    "gym",
    "pool",
    "garden",
    "rooftop",
    "spa",
    "cinema",
  ] as const,

  SOCIAL_FEATURES: [
    "communal-space",
    "rooftop",
    "events",
    "concierge",
  ] as const,

  WORK_FEATURES: ["co-working", "meeting-rooms", "high-speed-wifi"] as const,

  CONVENIENCE_FEATURES: ["parking", "storage", "laundry"] as const,

  PET_FRIENDLY_FEATURES: ["pet-park", "pet-washing", "pet-sitting"] as const,

  LUXURY_FEATURES: ["concierge", "spa", "cinema"] as const,
} as const;

