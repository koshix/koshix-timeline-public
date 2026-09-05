import { useState } from "react";
import {
  buildVisiblePersonalExport,
  buildVisiblePublicExport,
} from "./visible-events-export";

function cleanCell(value) {
  return String(value ?? "")
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

function downloadUtf16Tsv(filename, header, rows) {
  const lines = [
    header.join("\t"),
    ...rows.map((row) =>
      row.map(cleanCell).join("\t")
    ),
  ];

  const text = lines.join("\r\n") + "\r\n";
  const bytes = new Uint8Array(2 + text.length * 2);

  // UTF-16LE BOM
  bytes[0] = 0xff;
  bytes[1] = 0xfe;

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    bytes[2 + i * 2] = code & 0xff;
    bytes[3 + i * 2] = code >> 8;
  }

  const blob = new Blob(
    [bytes],
    { type: "text/plain;charset=utf-16le" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function useVisibleEventsExport({
  visibleItems,
  gradeLabel,
}) {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const exportVisibleEventsTsv = (target = "auto") => {
    const visiblePublicItems = visibleItems.filter(
      (event) => event.primary !== "me"
    );
    const visiblePersonalItems = visibleItems.filter(
      (event) => event.primary === "me"
    );

    let exportTarget = target;

    if (exportTarget === "auto") {
      if (
        visiblePublicItems.length > 0 &&
        visiblePersonalItems.length > 0
      ) {
        setDownloadMenuOpen(true);
        return;
      }

      exportTarget =
        visiblePersonalItems.length > 0 ? "personal" : "public";
    }

    const now = new Date();
    const stamp =
      String(now.getFullYear()) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");

    if (
      exportTarget === "public" &&
      visiblePublicItems.length > 0
    ) {
      const { header, rows } = buildVisiblePublicExport(
        visiblePublicItems,
        gradeLabel
      );

      downloadUtf16Tsv(
        `koshix-timeline-visible-public-${stamp}.txt`,
        header,
        rows
      );
    }

    if (
      exportTarget === "personal" &&
      visiblePersonalItems.length > 0
    ) {
      const { header, rows } = buildVisiblePersonalExport(
        visiblePersonalItems,
        gradeLabel
      );

      downloadUtf16Tsv(
        `koshix-timeline-visible-personal-${stamp}.txt`,
        header,
        rows
      );
    }

    setDownloadMenuOpen(false);
  };

  return {
    downloadMenuOpen,
    exportVisibleEventsTsv,
  };
}
