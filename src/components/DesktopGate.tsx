"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

// 桌面端闸门：注意力劳动是移动端仪式，宽屏一律钤「转交手机」公告 + 当前文书二维码
export default function DesktopGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [qr, setQr] = useState<string | null>(null);
  const [href, setHref] = useState("");
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    setBypass(sessionStorage.getItem("vt_desktop_bypass") === "1");
    const url = window.location.href;
    setHref(url);
    QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      errorCorrectionLevel: "M",
      color: { dark: "#111110ff", light: "#cdcabfff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, [pathname]);

  if (bypass) {
    return (
      <div className="mx-auto min-h-screen w-full lg:max-w-[430px] lg:border-x lg:border-line">
        {children}
      </div>
    );
  }

  return (
    <>
      {children}

      <div className="fixed inset-0 z-[60] hidden bg-ink lg:flex">
        <div className="m-auto w-full max-w-4xl px-10">
          <div className="rule-double pb-5">
            <div className="flex items-start justify-between gap-6 pt-5">
              <div>
                <p className="text-lg tracking-[0.5em] text-bone">VIBETOK</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ash">
                  注意力劳动管理局 · Bureau of Attention-Labor
                </p>
              </div>
              <span className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-ash">
                密级 公开
              </span>
            </div>
          </div>

          <div className="mt-10 flex items-center gap-12">
            <div className="max-w-md">
              <p className="text-[11px] uppercase tracking-[0.3em] text-faint">
                文书编号 X-00 · 移送通知
              </p>
              <h1 className="mt-3 text-2xl leading-relaxed tracking-[0.12em] text-bone">
                本仪式在桌面端不予受理。
              </h1>
              <p className="mt-5 text-sm leading-loose text-ash">
                注意力劳动须以手持终端完成。请以手机扫描右侧二维码，
                前往同一份文书继续供养你的 Agent。
              </p>
              <p className="mt-8 break-all border-l-2 border-seal pl-3 font-mono text-[11px] leading-relaxed text-faint">
                {href || "解析当前文书地址…"}
              </p>
              <div className="mt-8">
                <Seal />
              </div>
            </div>

            <div className="shrink-0">
              <div className="border border-line bg-paper p-4">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qr}
                    alt="转交手机二维码"
                    width={256}
                    height={256}
                    className="block h-64 w-64"
                  />
                ) : (
                  <div className="flex h-64 w-64 items-center justify-center text-xs text-faint">
                    生成二维码…
                  </div>
                )}
              </div>
              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.25em] text-faint">
                扫码转移 · 手机继续
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem("vt_desktop_bypass", "1");
                  setBypass(true);
                }}
                className="mt-6 block w-full border border-line px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-ash transition-colors hover:border-seal hover:text-bone"
              >
                本局特批 · 桌面端受理（受限视图）
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Seal() {
  return (
    <span className="stamp text-[11px]">
      <span>待移送</span>
      <span className="text-[8px] tracking-[0.15em] opacity-70">PENDING TRANSFER</span>
    </span>
  );
}
