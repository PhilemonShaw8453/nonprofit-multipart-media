import assert from "node:assert/strict";
import {mediaRequest} from "./multipart_upload.js";

const parsed = mediaRequest.parse({bucket: "campaign-media", key: "reminders/a.txt", content: new Uint8Array([1, 2]), partSize: 1});
assert.equal(parsed.partSize, 1);
assert.throws(() => mediaRequest.parse({bucket: "", key: "x", content: new Uint8Array()}));
console.log("request boundary: valid media accepted; empty bucket rejected");
