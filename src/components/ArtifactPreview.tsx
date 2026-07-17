"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";

interface Props {
  taskId: string;
  artifactId: string;
  filename: string;
  sizeBytes: number | null;
}

const TEXT_EXT = /\.(md|txt|ts|tsx|js|jsx|json|py|html|css|csv|yml|yaml|sh|sql)$/i;

export default function ArtifactPreview({ taskId, artifactId, filename, sizeBytes }: Props) {
  const url = `/api/tasks/${taskId}/artifacts/${artifactId}`;
  const isText = TEXT_EXT.test(filename);
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!isText) return;
    fetch(url, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => setText(t.slice(0, 6000)))
      .catch(() => setText(null));
  }, [url, isText]);

  return (
    <div className="border border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2 text-xs">
        <span className="truncate">{filename}</span>
        <a href={url} download className="ml-3 shrink-0 underline opacity-70">
          下载 {sizeBytes != null ? `(${formatNumber(sizeBytes)}B)` : ""}
        </a>
      </div>
      {isText && (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words p-3 text-[11px] leading-relaxed opacity-80">
          {text ?? "读取中…"}
        </pre>
      )}
    </div>
  );
}
