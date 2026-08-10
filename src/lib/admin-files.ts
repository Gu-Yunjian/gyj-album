type DeletePhotoParams = {
  album: string | null;
  filename: string | null;
};

export async function parseDeletePhotoRequest(
  request: Request
): Promise<DeletePhotoParams> {
  let bodyAlbum: string | null = null;
  let bodyFilename: string | null = null;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    bodyAlbum = typeof body.album === 'string' ? body.album : null;
    bodyFilename = typeof body.filename === 'string' ? body.filename : null;
  } catch {
    // Fall back to query parameters for older admin clients.
  }

  const { searchParams } = new URL(request.url);
  return {
    album: bodyAlbum || searchParams.get('album'),
    filename: bodyFilename || searchParams.get('filename'),
  };
}
