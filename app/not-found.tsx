import Link from "next/link";
import { css } from "@/components/css";

export default function NotFound() {
  return (
    <main
      data-palette="graphite"
      style={css(
        "min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px;padding:48px 24px;background:var(--panel);color:#fff;background-image:repeating-linear-gradient(135deg,rgba(255,255,255,0.022) 0 2px,transparent 2px 22px)"
      )}
    >
      <div
        style={css(
          "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:var(--tech)"
        )}
      >
        Error 404 · bay not found
      </div>
      <h1
        style={css(
          "font-family:'Oswald';font-weight:700;font-size:clamp(56px,12vw,120px);line-height:0.95;text-transform:uppercase;margin:6px 0 0"
        )}
      >
        Wrong turn
      </h1>
      <p
        style={css(
          "font-size:17px;line-height:1.6;color:#bcccdb;max-width:440px;margin:12px 0 28px"
        )}
      >
        That page rolled out of the shop. Let&apos;s get you back to a bay that
        is actually open.
      </p>
      <Link
        href="/"
        className="tdf-cta"
        style={css(
          "background:var(--brand);color:#fff;font-family:'Oswald';font-weight:600;font-size:16px;letter-spacing:0.06em;text-transform:uppercase;padding:16px 30px;transition:background-color .2s ease,transform .12s ease"
        )}
      >
        Back to the shop
      </Link>
    </main>
  );
}
