import JSZip from "jszip";

export async function createAppZip(
  appSlug: string,
  files: Array<{ path: string; content: string }>
): Promise<Buffer> {
  const zip = new JSZip();
  const folder = zip.folder(appSlug);

  if (!folder) {
    throw new Error("Failed to create zip folder");
  }

  for (const file of files) {
    const relativePath = file.path.startsWith(appSlug + "/")
      ? file.path.slice(appSlug.length + 1)
      : file.path;
    folder.file(relativePath, file.content);
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return buffer;
}
