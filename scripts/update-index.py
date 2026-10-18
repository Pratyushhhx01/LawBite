import boto3
import json

s3 = boto3.client("s3")

# Get current index
resp = s3.get_object(Bucket="lawbite-app-storage", Key="bare-acts/_index.json")
index = json.loads(resp["Body"].read())

# Add tort-law if not present
if "tort-law" not in index:
    index.append("tort-law")
    index.sort()
    s3.put_object(
        Bucket="lawbite-app-storage",
        Key="bare-acts/_index.json",
        Body=json.dumps(index, indent=2, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )
    print(f"Added tort-law to _index.json. Total acts: {len(index)}")
else:
    print("tort-law already in _index.json")
