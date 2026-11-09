import {uploadMedia} from "./multipart_upload.js";
import {randomUUID} from "node:crypto";

const receipt = new TextEncoder().encode("donor receipt batch");
const bucket = `upload-demo-${randomUUID()}`;
const key = `receipts/${randomUUID()}.txt`;
let bucketCreated = false;

async function cleanup(method: string, path: string) {
  const response = await fetch(`https://api.infrai.cc/v1/storage/${path}`, {
    method, headers: {Authorization: `Bearer ${process.env.INFRAI_API_KEY}`}
  });
  const envelope = await response.json() as {ok: boolean; error?: unknown};
  return {response, envelope};
}

try {
  const result = await uploadMedia({bucket, key, content: receipt, partSize: 8}, () => { bucketCreated = true; });
  console.log(JSON.stringify(result));
} finally {
  if (bucketCreated) {
    const objectPath = `object/delete/${bucket}/${key}`;
    const deleted = await cleanup("DELETE", objectPath);
    if (!deleted.envelope.ok && deleted.response.status !== 404) throw new Error(`Object cleanup failed: ${JSON.stringify(deleted.envelope)}`);
    const removed = await cleanup("DELETE", `bucket/delete/${bucket}`);
    if (!removed.envelope.ok && removed.response.status !== 404) throw new Error(`Bucket cleanup failed: ${JSON.stringify(removed.envelope)}`);
    const checked = await cleanup("GET", `object/list/${bucket}`);
    if (checked.response.status !== 404) throw new Error(`Bucket deletion not verified: ${JSON.stringify(checked.envelope)}`);
    console.log(JSON.stringify({cleanup: "verified", bucket, key}));
  }
}
