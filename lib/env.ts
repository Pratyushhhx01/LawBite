const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
];

// AI providers. Inception Labs (Mercury) is the default; NVIDIA is the
// automatic fallback. At least one must be present — the chat route rejects a
// request only when neither key is configured.
const aiProviderEnvVars = ["INCEPTION_API_KEY", "NVIDIA_API_KEY"];

const optionalEnvVars = [
  "TAVILY_API_KEY",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET_NAME",
];

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[ENV VALIDATION] Missing required environment variables: ${missing.join(", ")}`,
    );
    console.error(
      "[ENV VALIDATION] The application may not work correctly without these variables.",
    );
  }

  if (!aiProviderEnvVars.some((key) => process.env[key])) {
    console.error(
      `[ENV VALIDATION] No AI provider key configured. Set one of: ${aiProviderEnvVars.join(", ")}.`,
    );
  } else {
    const configured = aiProviderEnvVars.filter((key) => process.env[key]);
    if (configured.length < aiProviderEnvVars.length) {
      console.warn(
        `[ENV VALIDATION] Only these AI provider keys are set: ${configured.join(", ")}. The other provider cannot be used as a fallback.`,
      );
    }
  }

  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `[ENV VALIDATION] Missing optional environment variables: ${missingOptional.join(", ")}`,
    );
  }
}
