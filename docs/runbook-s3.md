# S3 knowledge-base runbook

## Symptom

The app answers from model knowledge instead of the bare acts, and logs look like:

```
[s3] bare-acts/bharatiya-nyaya-sanhita/full.txt unavailable: InvalidAccessKeyId (HTTP 403)
```

The legal benchmark also reports `lookup_error` and `n/a` for citation precision,
because the verifier cannot reach the knowledge base.

## Diagnose

```bash
npm run check:s3
```

The script reads the BNS full text with the same `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET_NAME` as the app. It
prints the credential shape (never the secret) and a hint for the common failure
classes.

## Fix

1. In AWS IAM, create or rotate an access key for a principal with read access:
   - `s3:GetObject` on `arn:aws:s3:::lawbite-app-storage/bare-acts/*`
   - `s3:ListBucket` on `arn:aws:s3:::lawbite-app-storage` only if you use prefix
     listing
2. Update these values in `.env.local` **and** in the Vercel project settings:
   - `AWS_REGION` (must match the bucket's region)
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `S3_BUCKET_NAME`
3. Redeploy production.
4. Run `npm run check:s3` locally. Then trigger the **Deployed smoke** workflow
   or call the chat endpoint and confirm the response includes S3-backed act
   context.
5. Run the legal benchmark:
   ```bash
   npm run eval:legal -- --base https://law-bite.vercel.app --limit 10
   ```
6. Only after a clean verification run, publish the full benchmark result.
7. Disable the old IAM key after the new key is confirmed in production.

## Common errors

| Error | Meaning | Action |
| --- | --- | --- |
| `InvalidAccessKeyId` | The key ID is not recognized. | Rotate the key; update both local and Vercel values. |
| `SignatureDoesNotMatch` | The secret does not match the key. | Re-copy both values; do not mix old and new. |
| `AccessDenied` | The principal cannot read the object. | Grant `s3:GetObject` on `bare-acts/*`. |
| `NoSuchBucket` | The bucket name is wrong. | Check `S3_BUCKET_NAME`. |
| `PermanentRedirect` | The bucket is in another region. | Set `AWS_REGION` to the bucket's region. |
| `TimeoutError` | Network or endpoint problem. | Check egress, VPC endpoints, and firewall rules. |

## Safety

- Never commit `.env.local` or paste the secret key into an issue.
- The app only reads from S3; do not grant write or delete permissions.
- If a key was exposed, disable it before investigating the cause.
- Do not mark benchmark rows as reviewed or publish an accuracy score just
  because S3 is reachable. Review status and benchmark results are separate.
