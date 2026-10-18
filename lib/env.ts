const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "NVIDIA_API_KEY",
];

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

  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `[ENV VALIDATION] Missing optional environment variables: ${missingOptional.join(", ")}`,
    );
  }
}
