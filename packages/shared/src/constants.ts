export const PLAN_LIMITS = {
  free: {
    maxInboxes: 1,
    maxMailsPerMonth: 100,
    maxHtmlChecksPerMonth: 20,
    maxAttachmentSizeBytes: 10 * 1024 * 1024, // 10 MB
    mailRetentionDays: 7,
    maxOrgMembers: 3,
  },
} as const;

export const SMTP_CONFIG = {
  maxMessageSizeBytes: 25 * 1024 * 1024, // 25 MB
  maxRatePerSecond: 10,
  port: 2525,
} as const;

export const VALIDATION_CONFIG = {
  linkCheck: {
    timeoutMs: 10_000,
    maxRedirects: 5,
    slowThresholdMs: 3_000,
  },
  imageCheck: {
    oversizeThresholdBytes: 1 * 1024 * 1024, // 1 MB
  },
  spamCheck: {
    imageRatioThreshold: 0.6, // > 60% images = warning
  },
  htmlFetch: {
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    timeoutMs: 30_000,
  },
} as const;

export const SCORE_THRESHOLDS = {
  green: { maxErrors: 0, maxWarnings: 3 },
  yellow: { maxErrors: 2 },
  // anything above yellow is red
} as const;
