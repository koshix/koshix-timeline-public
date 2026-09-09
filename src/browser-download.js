export function downloadBlob(
  blob,
  filename,
  revokeDelayMs = 0
) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    revokeDelayMs
  );
}
