import type { ReactNode } from "react";

interface Props {
  code: string;
  title: string;
  serial?: string;
  classification?: string;
  stamp?: ReactNode;
}

// 公文抬头：每一屏都是一份「注意力劳动管理局」签发的文书
export default function Masthead({
  code,
  title,
  serial,
  classification = "公开",
  stamp,
}: Props) {
  return (
    <header className="rule-double pb-4">
      <div className="flex items-start justify-between gap-4 pt-4">
        <div className="min-w-0">
          <p className="text-[15px] tracking-[0.45em] text-bone">VIBETOK</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-ash">
            注意力劳动管理局 · Bureau of Attention-Labor
          </p>
        </div>
        <span className="shrink-0 border border-line px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-ash">
          密级 {classification}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.28em] text-faint">
            文书编号 {code}
          </p>
          <h1 className="mt-1 truncate text-base tracking-[0.16em] text-bone">
            {title}
          </h1>
          {serial && (
            <p className="mt-1 font-mono text-[10px] tracking-[0.15em] text-faint figure">
              档案序列 {serial}
            </p>
          )}
        </div>
        {stamp && <div className="shrink-0 pb-1">{stamp}</div>}
      </div>
    </header>
  );
}
