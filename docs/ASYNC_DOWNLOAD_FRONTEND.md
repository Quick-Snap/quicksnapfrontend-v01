# Async bulk download — frontend integration (direct API, no S3)

Backend builds ZIP on the server. At **100%** (`status: ready`), the client downloads via:

`GET /api/photos/my-photos/download/jobs/:jobId/download` (Bearer token, `responseType: 'blob'`).

There is **no** S3 upload step and **no** `/jobs/:id/url` presigned endpoint.

## API (`lib/api.ts`)

```ts
photoApi.createDownloadJob()     // POST /photos/my-photos/download/jobs
photoApi.getDownloadJob(jobId)   // GET  /photos/my-photos/download/jobs/:jobId
photoApi.cancelDownloadJob(jobId) // DELETE /photos/my-photos/download/jobs/:jobId
photoApi.downloadJobFile(jobId)  // GET  /photos/my-photos/download/jobs/:jobId/download → Blob
```

Remove `getDownloadJobUrl` if still present.

## UI (`DownloadProgressModal.tsx`)

1. Poll `getDownloadJob` every 2s while `queued` | `processing`; stop on `ready`, `failed`, or `cancelled`.
2. Progress = `processedPhotos / totalPhotos` (100% = ZIP built).
3. While `queued` | `processing`: red **Cancel download** → `cancelDownloadJob(jobId)` (DELETE).
4. When `status === 'cancelled'`: title "Download cancelled", packaging-stopped message, **Close** only.
5. When `status === 'ready'`:
   - Call `downloadJobFile(jobId)` → `createObjectURL` → `<a download>` click.
   - Show purple **Download ZIP** button (manual retry).
6. Do **not** show "Uploading to cloud" — that phase was removed.

Job statuses: `queued` | `processing` | `ready` | `failed` | `cancelled`

## My Photos page

- `handleDownloadAll` → `createDownloadJob()` → open modal with `jobId`.
- `NEXT_PUBLIC_API_URL` must point at the Express API (e.g. `https://api.quicksnap.online/api`).

## Test

1. Login → `/photos` → **Download All**.
2. Modal: count increases to 100%.
3. **Cancel**: click **Cancel download** → `DELETE .../jobs/{id}` → `status: cancelled` → close → **Download All** starts a new job.
4. **Complete**: at 100%, `ready` → auto download (or **Download ZIP**).
5. Network: `GET .../jobs/{id}/download` returns `application/zip` from **api host**, not S3.

## Deploy

- Deploy **backend** first (new `/download` route + no S3 upload in worker).
- Then deploy **frontend**.
