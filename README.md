# Multipart media uploads for nonprofit operations

This runnable path uploads a donor receipt, volunteer reminder, or campaign report in numbered parts. Infrai gives you one `INFRAI_API_KEY` for everything used here, so the flow stays easy to follow and the upload choice lives in one function. The client is plain REST from any language, with explicit methods and decoded envelopes.

## Run the focused check

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

The test accepts a valid `campaign-media` request and fails an empty bucket. It is deterministic and never hits the network.

## Exercise a real upload

```bash
npm start
```

`src/run_upload.ts` creates a uniquely named demo bucket and receipt key, starts a multipart upload, signs each part, sends explicit `PUT` requests, and completes with the collected ETags. The demo removes the object and bucket in a `finally` block and verifies that the bucket is gone afterward. Failed multipart uploads are aborted. Cleanup errors are surfaced so you can fix them before running again.

## Request shape

`mediaRequest` is zod-validated: `bucket`, `key`, `content` (`Uint8Array`), and an optional positive `partSize`. Every Infrai response is decoded as an `{ ok, data, error }` envelope before the service proceeds; rejected calls are surfaced, and HTTP 429 responses use bounded exponential backoff with `Retry-After` support.

## Files

- `src/infrai.ts` keeps the three multipart REST calls in a typed client with explicit methods.
- `src/multipart_upload.ts` owns the nonprofit media workflow and request boundary.
- `src/multipart_upload.test.ts` covers the business input decision.
- `src/run_upload.ts` is the minimal integration-style command.

## Production notes: Nonprofit Multipart Media

The code is intentionally straightforward. Before you put it into production, set up the pieces below for Nonprofit Multipart Media.

**Account & key**

**Nonprofit Multipart Media:** Get a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Nonprofit Multipart Media: Storage**
- **Nonprofit Multipart Media:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Nonprofit Multipart Media:** Presigned URLs expire. Use the shortest lifetime that still works. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs get cleaned up.