/** Map missing static catalog paths to on-demand API that generates the JPEG. */
export function resolveDesignImageUrl(path: string): string {
  if (!path?.trim()) return path;

  if (path.startsWith("/api/catalog/maggam/")) return path;

  const fromAsset = path.match(
    /\/assets\/catalog\/maggam-(?:small|medium|big)\/(MAG-(?:S|M|B)-\d{4})\.jpg$/i
  );
  if (fromAsset) return `/api/catalog/maggam/${fromAsset[1]!.toUpperCase()}`;

  const fromUrl = path.match(
    /assets\/catalog\/maggam-(?:small|medium|big)\/(MAG-(?:S|M|B)-\d{4})\.jpg$/i
  );
  if (fromUrl) return `/api/catalog/maggam/${fromUrl[1]!.toUpperCase()}`;

  const codeOnly = path.match(/^(MAG-(?:S|M|B)-\d{4})$/i);
  if (codeOnly) return `/api/catalog/maggam/${codeOnly[1]!.toUpperCase()}`;

  return path;
}
