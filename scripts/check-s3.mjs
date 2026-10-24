import { config } from "dotenv";
import {
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

config({ path: ".env.local", quiet: true });

const region = process.env.AWS_REGION || "ap-south-1";
const bucket = process.env.S3_BUCKET_NAME || "lawbite-app-storage";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const key =
  process.env.S3_CHECK_KEY || "bare-acts/bharatiya-nyaya-sanhita/full.txt";

const missing = [];
if (!accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
if (!secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY");

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Set them in .env.local and in the Vercel project settings.");
  process.exit(1);
}

const looksLikePlaceholder = (value) =>
  /your|example|replace|placeholder|xxxx/i.test(value);

console.log(`Region: ${region}`);
console.log(`Bucket: ${bucket}`);
console.log(`Key:    ${key}`);
console.log(
  `Access key: length=${accessKeyId.length} prefix=${accessKeyId.slice(0, 4)} placeholder=${looksLikePlaceholder(accessKeyId) ? "yes" : "no"}`,
);
console.log(
  `Secret key: length=${secretAccessKey.length} placeholder=${looksLikePlaceholder(secretAccessKey) ? "yes" : "no"}`,
);

const client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

function explain(error) {
  const name = error instanceof Error ? error.name : "UnknownError";
  const status = error?.$metadata?.httpStatusCode;
  const code = error?.Code || error?.code;

  const hints = {
    InvalidAccessKeyId:
      "The access key ID is not recognized. Rotate it in IAM, then update AWS_ACCESS_KEY_ID in .env.local and Vercel.",
    SignatureDoesNotMatch:
      "The secret does not match the access key. Re-copy both values from IAM.",
    AccessDenied:
      "The IAM principal cannot read this object. Grant s3:GetObject on arn:aws:s3:::<bucket>/bare-acts/*.",
    NoSuchBucket:
      "The bucket name is wrong. Check S3_BUCKET_NAME and the bucket's region.",
    PermanentRedirect:
      "The bucket lives in a different region. Set AWS_REGION to the bucket's actual region.",
    CredentialsProviderError:
      "No usable credentials were found. Check the environment variables and the instance role.",
    TimeoutError:
      "The request timed out. Check network egress, VPC endpoints, and firewall rules.",
    ECONNREFUSED:
      "The connection was refused. Check network egress and the S3 endpoint.",
  };

  return {
    name,
    status,
    code,
    hint:
      hints[name] ||
      hints[code] ||
      "Check the AWS credentials, IAM policy, bucket name, and region.",
  };
}

try {
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const bytes = await response.Body?.transformToByteArray();
  console.log(
    `\nOK: read s3://${bucket}/${key} (${bytes?.byteLength ?? "unknown"} bytes)`,
  );
} catch (error) {
  const detail = explain(error);
  console.error(
    `\nFAILED: ${detail.name}${detail.status ? ` (HTTP ${detail.status})` : ""}${detail.code ? ` [${detail.code}]` : ""}`,
  );
  console.error(detail.hint);
  process.exitCode = 1;
}
