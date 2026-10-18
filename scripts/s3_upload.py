"""Shared S3 upload helpers for knowledge base scripts."""
import json, os, sys, pathlib

try:
    import boto3
except ImportError:
    print("Run: pip install boto3"); sys.exit(1)

env_path = pathlib.Path(__file__).resolve().parent.parent / ".env.local"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k.strip(), v)

BUCKET = os.environ.get("S3_BUCKET_NAME", "lawbite-app-storage")
REGION = os.environ.get("AWS_REGION", "ap-south-1")

s3 = boto3.client("s3", region_name=REGION,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"))


def put_json(key, data):
    s3.put_object(Bucket=BUCKET, Key=key,
        Body=json.dumps(data, ensure_ascii=False, indent=2),
        ContentType="application/json")


def put_text(key, text):
    s3.put_object(Bucket=BUCKET, Key=key, Body=text, ContentType="text/plain")


def create_act(act_id, title, sections, source="compiled"):
    p = f"bare-acts/{act_id}"
    put_json(f"{p}/index.json", {"id": act_id, "title": title, "totalSections": len(sections), "source": source})
    put_json(f"{p}/_sections.json", [{"section": s["section"], "title": s["title"]} for s in sections])
    full = "\n\n".join(f"Section {s['section']}. {s['title']}\n{s['text']}" for s in sections)
    put_text(f"{p}/full.txt", full)
    for s in sections:
        put_json(f"{p}/sections/{s['section']}.json", s)
    print(f"  [OK] {act_id} ({len(sections)} sections)")
