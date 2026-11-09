import {z} from "zod";
import {infrai} from "./infrai.js";

export const mediaRequest = z.object({bucket: z.string().min(1), key: z.string().min(1), content: z.instanceof(Uint8Array), partSize: z.number().int().positive().default(5 * 1024 * 1024)});
export type MediaRequest = z.infer<typeof mediaRequest>;

export async function uploadMedia(input: MediaRequest, onBucketCreated?: () => void) {
  const request = mediaRequest.parse(input);
  await infrai.storage.bucket.create({name: request.bucket});
  onBucketCreated?.();
  const started = await infrai.storage.multipart.create(request.bucket, {key: request.key});
  try {
    const parts: Array<{part_number: number; etag: string}> = [];
    for (let offset = 0, number = 1; offset < request.content.length; offset += request.partSize, number++) {
      const signed = await infrai.storage.multipart.presign_part(started.upload_id, number);
      const response = await fetch(signed.url, {method: "PUT", body: request.content.slice(offset, offset + request.partSize)});
      if (!response.ok) throw new Error(`part ${number} upload failed`);
      parts.push({part_number: number, etag: response.headers.get("ETag") ?? ""});
    }
    return await infrai.storage.multipart.complete(started.upload_id, {parts});
  } catch (error) {
    await infrai.storage.multipart.abort(started.upload_id);
    throw error;
  }
}
