"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { css } from "./css";
import {
  CREDS,
  GAUGE_CONFIG,
  GAUGE_IDLE,
  HOTSPOT_POS,
  PALETTE_ATTR,
  REVIEWS,
  SERVICE_OPTIONS,
  SYSTEMS,
  type PaletteName,
  type SystemKey,
} from "./data";

// ---- Component-level configuration (was Claude Design editor props) ----
const PALETTE: PaletteName = "Graphite & Safety Orange";
const GAUGES_ANIMATE = true;
const DEFAULT_SERVICE = "Heavy-Duty Repair";

const INPUT_BASE =
  "width:100%;border:1px solid #c4bdae;background:#fff;padding:14px 15px;font-family:'IBM Plex Sans';font-size:15px;color:#16202b";
const INPUT_ERR =
  "width:100%;border:1px solid #c0392b;background:#fff;padding:14px 15px;font-family:'IBM Plex Sans';font-size:15px;color:#16202b;box-shadow:0 0 0 2px rgba(192,57,43,0.14)";

const MAX_PULL = 96;
const PULL_THRESHOLD = 42;

type Errors = Partial<Record<"firstName" | "phone" | "serviceNeeded", string>>;

function formatPhone(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return "(" + d.slice(0, 3) + ") " + d.slice(3);
  return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
}

export default function BookingPage() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorProg, setDoorProg] = useState(0);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [gaugeProgress, setGaugeProgress] = useState(0);
  const [selectedSystem, setSelectedSystem] = useState<SystemKey>("engine");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [makeModel, setMakeModel] = useState("");
  const [serviceNeeded, setServiceNeeded] = useState("");
  const [issue, setIssue] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [woNumber, setWoNumber] = useState("WO-4827");

  // Mutable refs for animation loops / drag tracking.
  const doorIv = useRef<ReturnType<typeof setInterval> | null>(null);
  const gaugeIv = useRef<ReturnType<typeof setInterval> | null>(null);
  const gaugesStarted = useRef(false);
  const pullStartY = useRef(0);
  const doorOpenRef = useRef(doorOpen);
  const doorProgRef = useRef(doorProg);
  const draggingRef = useRef(dragging);
  const pullRef = useRef(pull);
  doorOpenRef.current = doorOpen;
  doorProgRef.current = doorProg;
  draggingRef.current = dragging;
  pullRef.current = pull;

  const now = () =>
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  const animateDoor = useCallback((open: boolean) => {
    const target = open ? 1 : 0;
    const start = doorProgRef.current || 0;
    setDoorOpen(open);
    setDragging(false);
    if (Math.abs(target - start) < 0.001) {
      setDoorProg(target);
      return;
    }
    const dur = 1100;
    const t0 = now();
    if (doorIv.current) clearInterval(doorIv.current);
    doorIv.current = setInterval(() => {
      const p = Math.min(1, (now() - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setDoorProg(start + (target - start) * e);
      if (p >= 1 && doorIv.current) {
        clearInterval(doorIv.current);
        doorIv.current = null;
      }
    }, 16);
  }, []);

  const startGauges = useCallback(() => {
    if (gaugesStarted.current) return;
    gaugesStarted.current = true;
    const dur = 1700;
    const t0 = now();
    if (gaugeIv.current) clearInterval(gaugeIv.current);
    gaugeIv.current = setInterval(() => {
      const p = Math.min(1, (now() - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setGaugeProgress(e);
      if (p >= 1 && gaugeIv.current) {
        clearInterval(gaugeIv.current);
        gaugeIv.current = null;
      }
    }, 16);
  }, []);

  useEffect(() => {
    setWoNumber("WO-" + (Math.floor(Math.random() * 9000) + 1000));
    if (DEFAULT_SERVICE) setServiceNeeded((s) => s || DEFAULT_SERVICE);

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setGaugeProgress(1);
      setDoorProg(1);
      setDoorOpen(true);
      return;
    }

    const doorTimer = setTimeout(() => animateDoor(true), 820);

    if (!GAUGES_ANIMATE) {
      setGaugeProgress(1);
      return () => clearTimeout(doorTimer);
    }

    const kick = () => startGauges();
    window.addEventListener("scroll", kick, true);
    document.addEventListener("scroll", kick, true);
    const gaugeTimer = setTimeout(kick, 1100);

    return () => {
      clearTimeout(doorTimer);
      clearTimeout(gaugeTimer);
      window.removeEventListener("scroll", kick, true);
      document.removeEventListener("scroll", kick, true);
      if (doorIv.current) clearInterval(doorIv.current);
      if (gaugeIv.current) clearInterval(gaugeIv.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearErr = (key: keyof Errors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ---- Pull-chain drag handlers ----
  const onPullDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    pullStartY.current = e.clientY ?? 0;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      /* no-op */
    }
    setDragging(true);
    setPull(0);
  };
  const onPullMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const y = e.clientY ?? 0;
    setPull(Math.max(0, Math.min(MAX_PULL, y - (pullStartY.current || 0))));
  };
  const onPullUp = () => {
    if (!draggingRef.current) return;
    const fire = (pullRef.current || 0) >= PULL_THRESHOLD;
    const willOpen = !doorOpenRef.current;
    setDragging(false);
    setPull(0);
    if (fire) animateDoor(willOpen);
  };
  const onPullKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      animateDoor(!doorOpenRef.current);
    }
  };

  // ---- Booking submit ----
  const submit = () => {
    const errs: Errors = {};
    if (!firstName.trim()) errs.firstName = "Enter your first name";
    if (phone.replace(/\D/g, "").length < 10)
      errs.phone = "Enter a 10-digit phone number";
    if (!serviceNeeded) errs.serviceNeeded = "Choose a service";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitted(true);
    setErrors({});
  };
  const reset = () => {
    setSubmitted(false);
    setErrors({});
    setFirstName("");
    setLastName("");
    setPhone("");
    setYear("");
    setMakeModel("");
    setServiceNeeded("");
    setIssue("");
  };

  // ---- Derived view values ----
  const paletteAttr = PALETTE_ATTR[PALETTE] || "steel";
  const doorTransform = "translateY(" + (-112 * (doorProg || 0)).toFixed(2) + "%)";
  const doorSign = doorOpen ? "OPEN" : "CLOSED";
  const armed = pull >= PULL_THRESHOLD;
  const ringColor = armed ? "var(--go)" : "var(--brand-ring)";
  const ringGlow = armed
    ? "0 0 0 6px rgba(63,174,107,0.16), 0 0 18px rgba(63,174,107,0.55)"
    : "0 2px 6px rgba(0,0,0,0.4)";
  const ringSway = dragging ? "none" : "tdf-sway 3s ease-in-out infinite";
  const pullLabel = armed ? "RELEASE" : "PULL";
  const pullLabelColor = armed ? "var(--go)" : "var(--brand)";
  const pullCursor = dragging ? "grabbing" : "grab";
  const pullAria = doorOpen ? "Close the bay door" : "Open the bay door";
  const cordHeight = 60 + pull + "px";

  const idleOn = GAUGES_ANIMATE && gaugeProgress >= 1;
  const gaugeData = GAUGE_CONFIG.map((g, i) => {
    const frac = (g.value / g.max) * gaugeProgress;
    const deg = frac * 260;
    const angle = -130 + deg;
    return {
      label: g.label,
      needleTransform: "rotate(" + angle.toFixed(1) + "deg)",
      revAnim: idleOn ? GAUGE_IDLE[i].rev : "none",
      vibeAnim: idleOn ? GAUGE_IDLE[i].vibe : "none",
      arc:
        "var(--accent) 0 " +
        deg.toFixed(1) +
        "deg, rgba(255,255,255,0.07) " +
        deg.toFixed(1) +
        "deg 260deg, transparent 260deg 360deg",
    };
  });

  const sys = SYSTEMS[selectedSystem];
  const hotspots = (Object.keys(SYSTEMS) as SystemKey[]).map((k) => {
    const active = k === selectedSystem;
    const pos = HOTSPOT_POS[k];
    const dotStyle =
      "position:absolute;left:" +
      pos.left +
      ";top:" +
      pos.top +
      ";transform:translate(-50%,-50%);width:clamp(26px,6.4vw,36px);height:clamp(26px,6.4vw,36px);border-radius:50%;display:grid;place-items:center;cursor:pointer;font-family:'IBM Plex Mono';font-size:clamp(11px,2.5vw,13px);font-weight:600;z-index:3;" +
      "border:2px solid " +
      (active ? "var(--tech-hot)" : "var(--tech)") +
      ";" +
      "background:" +
      (active ? "rgba(239,90,77,0.92)" : "rgba(10,34,51,0.75)") +
      ";" +
      "color:" +
      (active ? "#fff" : "#9fe6f0") +
      ";" +
      "box-shadow:" +
      (active ? "0 0 0 7px rgba(239,90,77,0.18)" : "0 0 0 0 rgba(0,0,0,0)") +
      ";" +
      (active ? "" : "animation:tdf-pulse 2.6s ease-out infinite;");
    return { key: k, no: SYSTEMS[k].no, dotStyle };
  });

  const nameComma = firstName ? ", " + firstName.trim() : "";
  const fnStyle = errors.firstName ? INPUT_ERR : INPUT_BASE;
  const phStyle = errors.phone ? INPUT_ERR : INPUT_BASE;
  const svStyle = (errors.serviceNeeded ? INPUT_ERR : INPUT_BASE) + ";cursor:pointer";

  return (
    <div
      data-palette={paletteAttr}
      className="tdf-root"
      style={css(
        "max-width:100%;overflow-x:clip;background-color:var(--bg);background-image:repeating-linear-gradient(0deg,rgba(0,0,0,0.013) 0 1px,transparent 1px 4px),radial-gradient(circle at 30% 20%,rgba(0,0,0,0.016) 0 1px,transparent 2px),radial-gradient(circle at 70% 65%,rgba(0,0,0,0.013) 0 1px,transparent 2px);background-size:auto,11px 11px,17px 17px"
      )}
    >
      <span id="page-top" aria-hidden="true" style={css("display:block;height:0")} />
      <a href="#top" className="tdf-skip">
        Skip to content
      </a>
      {/* NAV */}
      <header
        style={css(
          "position:sticky;top:0;z-index:60;background:color-mix(in srgb, var(--panel) 96%, transparent);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,0.08)"
        )}
      >
        <nav
          className="tdf-nav"
          style={css(
            "max-width:1240px;margin:0 auto;padding:0 32px;height:74px;display:flex;align-items:center;justify-content:space-between;gap:24px"
          )}
        >
          <a
            href="#page-top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
              });
            }}
            style={css("display:flex;align-items:center;gap:12px")}
          >
            <svg
              width="38"
              height="38"
              viewBox="0 0 32 32"
              aria-hidden="true"
              style={css("flex:none;fill:var(--brand)")}
            >
              <rect width="32" height="32" rx="5" style={css("fill:var(--panel-3)")} />
              <circle cx="16" cy="16" r="12.3" />
              <circle cx="16" cy="16" r="9.6" style={css("fill:var(--panel-3)")} />
              <rect x="11.7" y="8.8" width="8.6" height="5.4" rx="1" />
              <rect x="11.7" y="10.6" width="8.6" height="0.7" style={css("fill:var(--panel-3)")} />
              <rect x="11.7" y="12" width="8.6" height="0.7" style={css("fill:var(--panel-3)")} />
              <polygon points="13.4,14.2 18.6,14.2 17.7,19.6 14.3,19.6" />
              <circle cx="16" cy="20.6" r="2.6" />
              <circle cx="16" cy="20.6" r="1.1" style={css("fill:var(--panel-3)")} />
            </svg>
            <span style={css("display:flex;flex-direction:column;line-height:1")}>
              <span
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:18px;letter-spacing:0.06em;color:#fff;text-transform:uppercase"
                )}
              >
                TEXAS DIESEL FLEETS
              </span>
              <span
                style={css(
                  "font-family:'IBM Plex Mono';font-size:10px;letter-spacing:0.32em;color:#8aa0b6;text-transform:uppercase;margin-top:3px"
                )}
              >
                EST. 2025 · MIDLAND, TX
              </span>
            </span>
          </a>
          <div style={css("display:flex;align-items:center;gap:34px")}>
            <div className="tdf-nav-links" style={css("display:flex;gap:30px")}>
              {[
                ["#diagnostic", "Diagnostic"],
                ["#about", "About"],
                ["#reviews", "Reviews"],
                ["#book", "Reserve a Bay"],
                ["#find", "Find Us"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="tdf-navlink"
                  style={css(
                    "font-size:14px;font-weight:500;color:#c6d2de;letter-spacing:0.02em"
                  )}
                >
                  {label}
                </a>
              ))}
            </div>
            <div
              className="tdf-nav-actions"
              style={css("display:flex;align-items:center;gap:18px")}
            >
              <a
                href="#book"
                className="tdf-cta"
                style={css(
                  "background:var(--brand);color:#fff;font-family:'Oswald';font-weight:600;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;padding:13px 22px"
                )}
              >
                Book Service
              </a>
            </div>
            {/* Compact icon actions — mobile only (replaces the bottom CTA bar) */}
            <div
              className="tdf-mobile-actions"
              style={css("display:none;align-items:center;gap:12px")}
            >
              <a
                href="tel:+18005550199"
                aria-label="Call the shop"
                className="tdf-iconbtn"
                style={css(
                  "flex:none;width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,0.28);display:grid;place-items:center;color:#fff"
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
              <a
                href="#book"
                aria-label="Book a service bay"
                className="tdf-iconbtn"
                style={css(
                  "flex:none;width:42px;height:42px;border-radius:50%;background:var(--brand);display:grid;place-items:center;color:#fff"
                )}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="m9 16 2 2 4-4" />
                </svg>
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* HERO with roll-up garage door */}
      <section
        id="top"
        style={css(
          "position:relative;background:var(--panel);color:#fff;overflow:hidden;min-height:640px"
        )}
      >
        <div
          aria-hidden="true"
          style={css(
            "position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,0.022) 0 2px,transparent 2px 22px)"
          )}
        />
        <div
          aria-hidden="true"
          style={css(
            "position:absolute;top:0;bottom:0;left:0;width:14px;background:linear-gradient(90deg,#21262d,#3c434c);z-index:4"
          )}
        />
        <div
          aria-hidden="true"
          style={css(
            "position:absolute;top:0;bottom:0;right:0;width:14px;background:linear-gradient(270deg,#21262d,#3c434c);z-index:4"
          )}
        />

        {/* HERO CONTENT */}
        <div
          className="tdf-hero-grid"
          style={css(
            "position:relative;z-index:1;max-width:1240px;margin:0 auto;padding:0 32px;display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center;min-height:640px"
          )}
        >
          <div className="tdf-hero-copy" style={css("padding:84px 0")}>
            <h1
              className="tdf-hero-h1"
              style={css(
                "font-family:'Oswald';font-weight:700;font-size:66px;line-height:1.01;letter-spacing:0.005em;text-transform:uppercase;text-wrap:balance"
              )}
            >
              Keep your
              <br />
              <span style={css("color:var(--pop)")}>rigs rolling.</span>
            </h1>
            <p
              style={css(
                "font-size:18px;line-height:1.6;color:#bcccdb;max-width:480px;margin:24px 0 36px"
              )}
            >
              Heavy-duty diesel repair, fleet maintenance, and DOT inspections for
              Midland and the Permian Basin.
            </p>
            <div style={css("display:flex;gap:16px;flex-wrap:wrap")}>
              <a
                href="#book"
                className="tdf-cta"
                style={css(
                  "background:var(--brand);color:#fff;font-family:'Oswald';font-weight:600;font-size:16px;letter-spacing:0.06em;text-transform:uppercase;padding:16px 30px"
                )}
              >
                Reserve a Bay
              </a>
              <a
                href="#diagnostic"
                className="tdf-ghost"
                style={css(
                  "border:1px solid rgba(255,255,255,0.28);color:#fff;font-family:'Oswald';font-weight:500;font-size:16px;letter-spacing:0.06em;text-transform:uppercase;padding:16px 30px"
                )}
              >
                Run the Diagnostic
              </a>
            </div>
          </div>
          <div
            style={css(
              "align-self:stretch;position:relative;display:flex;align-items:center"
            )}
          >
            <div
              style={css(
                "position:relative;width:100%;aspect-ratio:4/5;border:1px solid rgba(255,255,255,0.12);overflow:hidden"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/hero-inspection.jpg"
                alt="Diesel technician inspecting a truck underbody"
                style={css("width:100%;height:100%;object-fit:cover;display:block")}
              />
              <div
                aria-hidden="true"
                style={css(
                  "position:absolute;inset:0;box-shadow:inset 0 0 90px rgba(0,0,0,0.45);pointer-events:none"
                )}
              />
            </div>
          </div>
        </div>

        {/* THE GARAGE DOOR (overlay) */}
        <div
          style={{
            ...css(
              "position:absolute;inset:0;z-index:5;background:linear-gradient(90deg,rgba(0,0,0,0.4),rgba(0,0,0,0.04) 7%,rgba(0,0,0,0.04) 93%,rgba(0,0,0,0.4)),repeating-linear-gradient(180deg,#3c434c 0px,#3c434c 22px,#22272e 22px,#22272e 25px,#31373f 25px,#31373f 28px);box-shadow:inset 0 -10px 30px rgba(0,0,0,0.5),inset 0 8px 22px rgba(0,0,0,0.4)"
            ),
            transform: doorTransform,
          }}
        >
          <div
            style={css(
              "position:absolute;top:0;left:0;right:0;height:64px;display:flex;gap:8px;padding:14px 8px;background:repeating-linear-gradient(180deg,#3c434c 0 10px,#2a2f37 10px 12px)"
            )}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={css(
                  "flex:1;background:linear-gradient(160deg,#8fa7b6,#4a5b67);border:2px solid #1c2127;box-shadow:inset 0 1px 2px rgba(255,255,255,0.35),inset 0 -2px 4px rgba(0,0,0,0.3)"
                )}
              />
            ))}
          </div>
          <div
            style={css(
              "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;width:min(560px,80%)"
            )}
          >
            <div
              style={css(
                "display:inline-flex;align-items:center;gap:12px;background:var(--brand);padding:10px 22px;margin-bottom:18px;box-shadow:0 6px 0 rgba(0,0,0,0.3)"
              )}
            >
              <span
                style={css(
                  "width:11px;height:11px;border-radius:50%;background:var(--accent-glow);box-shadow:0 0 12px var(--accent-glow);animation:tdf-blink 1.6s ease-in-out infinite"
                )}
              />
              <span
                style={css(
                  "font-family:'Stardos Stencil';font-weight:700;font-size:18px;letter-spacing:0.2em;color:#fff;text-transform:uppercase"
                )}
              >
                Bay 01 · {doorSign}
              </span>
            </div>
            <div
              style={css(
                "font-family:'Stardos Stencil';font-weight:700;font-size:clamp(34px,6vw,62px);line-height:0.96;color:#cfd6dd;text-transform:uppercase;letter-spacing:0.04em;text-shadow:0 2px 0 #1a1f25"
              )}
            >
              Texas Diesel
              <br />
              Fleets
            </div>
            <div
              style={css(
                "margin-top:22px;font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.3em;color:#aeb6bf;text-transform:uppercase;animation:tdf-hint 2s ease-in-out infinite"
              )}
            >
              Grab the chain &amp; pull down to open the bay
            </div>
          </div>
          <div
            style={css(
              "position:absolute;bottom:42px;left:50%;transform:translateX(-50%);width:160px;height:16px;border-radius:8px;background:linear-gradient(180deg,#4a515a,#23282f);box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),0 4px 8px rgba(0,0,0,0.4)"
            )}
          />
        </div>

        {/* pull chain */}
        <div
          className="tdf-chain"
          style={css(
            "position:absolute;top:0;right:52px;z-index:7;display:flex;flex-direction:column;align-items:center;user-select:none;-webkit-user-select:none;width:40px"
          )}
        >
          <div
            style={{
              ...css(
                "width:3px;background:repeating-linear-gradient(180deg,#c9ccd1 0 4px,#8a8f96 4px 8px)"
              ),
              height: cordHeight,
            }}
          />
          <div
            onPointerDown={onPullDown}
            onPointerMove={onPullMove}
            onPointerUp={onPullUp}
            onPointerCancel={onPullUp}
            tabIndex={0}
            role="button"
            aria-label={pullAria}
            onKeyDown={onPullKey}
            style={{
              ...css(
                "width:30px;height:30px;border-radius:50%;border:4px solid;background:var(--panel);touch-action:none;transform-origin:top center;outline-offset:3px"
              ),
              borderColor: ringColor,
              cursor: pullCursor,
              boxShadow: ringGlow,
              animation: ringSway,
            }}
          />
          <div
            style={{
              ...css(
                "margin-top:9px;font-family:'IBM Plex Mono';font-size:10px;letter-spacing:0.24em;text-transform:uppercase;font-weight:600;white-space:nowrap"
              ),
              color: pullLabelColor,
            }}
          >
            {pullLabel}
          </div>
        </div>
      </section>

      {/* GAUGE CLUSTER */}
      <div
        aria-hidden="true"
        style={css(
          "height:13px;background:repeating-linear-gradient(45deg,var(--accent) 0 16px,#15202b 16px 32px)"
        )}
      />
      <section
        style={css(
          "background:linear-gradient(180deg,#d9dce0,#bfc4ca);background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.5) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(0,0,0,0.03) 0 1px,transparent 1px 4px);border-bottom:3px solid #9aa0a7"
        )}
      >
        <div style={css("max-width:1240px;margin:0 auto;padding:54px 32px 58px")}>
          <div
            style={css(
              "display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:40px;text-align:center"
            )}
          >
            <div
              style={css(
                "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:#7a818a"
              )}
            >
              Shop readout
            </div>
            <h2
              style={css(
                "font-family:'Oswald';font-weight:700;font-size:34px;line-height:1.04;text-transform:uppercase;color:#1f262d"
              )}
            >
              Why fleets trust us
            </h2>
          </div>
          <div
            className="tdf-gauge-grid"
            style={css(
              "display:grid;grid-template-columns:repeat(3,1fr);gap:30px;justify-items:center"
            )}
          >
            {gaugeData.map((gauge, i) => (
              <div
                key={i}
                style={css("display:flex;flex-direction:column;align-items:center;gap:16px")}
              >
                <div
                  style={css(
                    "position:relative;width:178px;height:178px;border-radius:50%;background:radial-gradient(circle at 50% 36%,#222831,#0c0f13);border:7px solid #0f1318;box-shadow:inset 0 5px 16px rgba(0,0,0,0.75),0 8px 20px rgba(0,0,0,0.3)"
                  )}
                >
                  <div
                    style={{
                      ...css(
                        "position:absolute;inset:12px;border-radius:50%;-webkit-mask:radial-gradient(circle,transparent 56%,#000 57%);mask:radial-gradient(circle,transparent 56%,#000 57%)"
                      ),
                      background: "conic-gradient(from 220deg," + gauge.arc + ")",
                    }}
                  />
                  <div
                    style={css(
                      "position:absolute;inset:16px;border-radius:50%;background:repeating-conic-gradient(from 220deg,rgba(255,255,255,0.55) 0 1deg,transparent 1deg 13deg);-webkit-mask:radial-gradient(circle,transparent 72%,#000 73% 82%,transparent 83%);mask:radial-gradient(circle,transparent 72%,#000 73% 82%,transparent 83%)"
                    )}
                  />
                  <div style={css("position:absolute;left:50%;top:50%;width:0;height:0")}>
                    <div
                      style={{
                        ...css("position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0"),
                        transform: gauge.needleTransform,
                      }}
                    >
                      <div
                        style={{
                          ...css("position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0"),
                          animation: gauge.revAnim,
                        }}
                      >
                        <div
                          style={{
                            ...css("position:absolute;left:0;top:0;width:0;height:0;transform-origin:0 0"),
                            animation: gauge.vibeAnim,
                          }}
                        >
                          <div
                            style={css(
                              "position:absolute;left:-3px;bottom:0;width:6px;height:62px;background:linear-gradient(180deg,var(--tech-hot),var(--brand));transform-origin:50% 100%;border-radius:3px 3px 1px 1px;box-shadow:0 0 8px rgba(239,90,77,0.5)"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={css(
                      "position:absolute;left:50%;top:50%;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 38% 34%,#3c424a,#11141a);transform:translate(-50%,-50%);border:2px solid #06080b;z-index:2"
                    )}
                  />
                </div>
                <div
                  style={css(
                    "font-family:'Oswald';font-weight:600;font-size:16px;letter-spacing:0.05em;text-transform:uppercase;color:#1f262d"
                  )}
                >
                  {gauge.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIAGNOSTIC */}
      <section
        id="diagnostic"
        style={css(
          "background:var(--panel-2);color:#fff;background-image:linear-gradient(rgba(79,208,224,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(79,208,224,0.045) 1px,transparent 1px);background-size:34px 34px"
        )}
      >
        <div style={css("max-width:1240px;margin:0 auto;padding:92px 32px")}>
          <div
            style={css(
              "display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:44px"
            )}
          >
            <div>
              <div
                style={css(
                  "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--tech);margin-bottom:14px"
                )}
              >
                Run the diagnostic
              </div>
              <h2
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:46px;line-height:1.04;text-transform:uppercase"
                )}
              >
                Point to the problem
              </h2>
            </div>
            <p
              style={css(
                "max-width:380px;font-size:16px;line-height:1.6;color:#9fb3c2"
              )}
            >
              Tap a part of the truck to see what we check, then send it to a bay.
            </p>
          </div>

          <div
            className="tdf-diag-grid"
            style={css(
              "display:grid;grid-template-columns:1.35fr 0.8fr;gap:36px;align-items:stretch"
            )}
          >
            <div
              style={css(
                "position:relative;border:1px solid rgba(79,208,224,0.3);background:rgba(8,28,42,0.5);padding:18px;overflow:hidden;display:flex;flex-direction:column;justify-content:center"
              )}
            >
              <div
                style={css(
                  "position:absolute;top:14px;left:18px;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.18em;color:var(--tech);opacity:0.8;z-index:2"
                )}
              >
                FIG.01 · TRACTOR-TRAILER · SIDE ELEVATION
              </div>
              <div
                style={css(
                  "position:absolute;bottom:14px;right:18px;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.18em;color:var(--tech);opacity:0.55"
                )}
              >
                TDF-SHOP · SCALE 1:24
              </div>
              <div
                aria-hidden="true"
                style={css(
                  "position:absolute;top:0;bottom:0;width:2px;background:linear-gradient(180deg,transparent,var(--tech),transparent);box-shadow:0 0 14px var(--tech);animation:tdf-scan 5.5s ease-in-out infinite;z-index:1"
                )}
              />
              <div style={css("position:relative;width:100%;aspect-ratio:900 / 360")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/semi-blueprint.png"
                  alt="Semi truck, side elevation"
                  style={css(
                    "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 7px rgba(79,208,224,0.4))"
                  )}
                />
                {hotspots.map((h) => (
                  <button
                    key={h.key}
                    type="button"
                    className="tdf-hotspot"
                    aria-label={"Show " + SYSTEMS[h.key].label + " details"}
                    aria-pressed={h.key === selectedSystem}
                    onClick={() => setSelectedSystem(h.key)}
                    style={css(h.dotStyle)}
                  >
                    {h.no}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={css(
                "background:var(--panel);border:1px solid rgba(79,208,224,0.3);padding:32px 30px;display:flex;flex-direction:column"
              )}
            >
              <div style={css("display:flex;align-items:center;gap:10px;margin-bottom:18px")}>
                <span
                  style={css(
                    "font-family:'Stardos Stencil';font-weight:700;font-size:13px;letter-spacing:0.18em;color:var(--panel-2);background:var(--tech);padding:4px 10px"
                  )}
                >
                  SYS {sys.no}
                </span>
                <span
                  style={css(
                    "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--tech)"
                  )}
                >
                  {sys.label}
                </span>
              </div>
              <h3
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:30px;line-height:1.05;text-transform:uppercase;color:#fff;margin-bottom:16px"
                )}
              >
                {sys.title}
              </h3>
              <p
                style={css(
                  "font-size:15.5px;line-height:1.7;color:#bcccdb;margin-bottom:28px"
                )}
              >
                {sys.body}
              </p>
              <a
                href="#book"
                className="tdf-cta"
                onClick={() => setServiceNeeded(sys.svc)}
                style={css(
                  "margin-top:auto;text-align:center;background:var(--brand);color:#fff;font-family:'Oswald';font-weight:600;font-size:15px;letter-spacing:0.07em;text-transform:uppercase;padding:15px 20px"
                )}
              >
                Send this fix to a bay →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={css("background:var(--bg-3)")}>
        <div
          className="tdf-about-grid"
          style={css(
            "max-width:1240px;margin:0 auto;padding:92px 32px;display:grid;grid-template-columns:0.9fr 1.1fr;gap:64px;align-items:center"
          )}
        >
          <div
            style={css(
              "position:relative;aspect-ratio:1/1;border:1px solid rgba(0,0,0,0.12);overflow:hidden"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/shop-engine.jpg"
              alt="Technician working on a diesel truck engine"
              style={css("width:100%;height:100%;object-fit:cover;display:block")}
            />
            <div
              aria-hidden="true"
              style={css(
                "position:absolute;inset:0;box-shadow:inset 0 0 80px rgba(0,0,0,0.35);pointer-events:none"
              )}
            />
          </div>
          <div>
            <div
              style={css(
                "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:var(--brand);margin-bottom:16px"
              )}
            >
              Who we are
            </div>
            <h2
              style={css(
                "font-family:'Oswald';font-weight:700;font-size:44px;line-height:1.05;text-transform:uppercase;color:var(--panel);margin-bottom:22px"
              )}
            >
              Tired of the runaround?
              <br />
              So were we.
            </h2>
            <p
              style={css(
                "font-size:17px;line-height:1.7;color:#4f5762;margin-bottom:18px"
              )}
            >
              We started Texas Diesel Fleet Services because we got tired of watching
              fleet owners get the runaround from big chain shops. We&apos;re locals. We
              live here, we work here, and we answer our own phone.
            </p>
            <p
              style={css(
                "font-size:17px;line-height:1.7;color:#4f5762;margin-bottom:34px"
              )}
            >
              No call center and no surprise charges. We tell you what&apos;s wrong, how
              long it takes, and what it costs before we start.
            </p>
            <div
              style={css(
                "display:grid;grid-template-columns:repeat(3,auto);gap:36px;justify-content:start"
              )}
            >
              {CREDS.map((cred) => (
                <div key={cred.label}>
                  <div
                    style={css(
                      "font-family:'Oswald';font-weight:700;font-size:30px;color:var(--brand)"
                    )}
                  >
                    {cred.num}
                  </div>
                  <div
                    style={css(
                      "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#7c838d;margin-top:4px"
                    )}
                  >
                    {cred.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section
        id="reviews"
        style={css(
          "position:relative;background:var(--panel);color:#fff;overflow:hidden"
        )}
      >
        <div
          aria-hidden="true"
          style={css(
            "position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,0.022) 0 2px,transparent 2px 22px)"
          )}
        />
        <div
          style={css("position:relative;max-width:1240px;margin:0 auto;padding:92px 32px")}
        >
          <div
            style={css(
              "display:flex;justify-content:space-between;align-items:flex-end;gap:30px;flex-wrap:wrap;margin-bottom:46px"
            )}
          >
            <div>
              <div
                style={css(
                  "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--pop);margin-bottom:14px"
                )}
              >
                Our reviews
              </div>
              <h2
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:46px;line-height:1.04;text-transform:uppercase"
                )}
              >
                What fleet owners say
              </h2>
            </div>
            <div
              style={css(
                "display:flex;align-items:center;gap:18px;border:1px solid rgba(255,255,255,0.16);padding:15px 22px"
              )}
            >
              <div
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:46px;line-height:0.85;color:var(--accent)"
                )}
              >
                4.9
                <span style={css("font-size:20px;color:#8aa0b6")}>/5</span>
              </div>
              <div>
                <div style={css("color:var(--accent);font-size:16px;letter-spacing:2px")}>
                  ★★★★★
                </div>
                <div
                  style={css(
                    "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8aa0b6;margin-top:5px"
                  )}
                >
                  280+ fleet reviews
                </div>
              </div>
            </div>
          </div>
          <div
            className="tdf-reviews-grid"
            style={css(
              "display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.1)"
            )}
          >
            {REVIEWS.map((rev) => (
              <div
                key={rev.name}
                style={css(
                  "background:var(--panel);padding:34px 30px;display:flex;flex-direction:column;gap:18px"
                )}
              >
                <div
                  style={css("display:flex;align-items:center;justify-content:space-between")}
                >
                  <div style={css("color:var(--accent);font-size:16px;letter-spacing:2px")}>
                    ★★★★★
                  </div>
                  <span
                    style={css(
                      "font-family:'IBM Plex Mono';font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#7e93a6"
                    )}
                  >
                    {rev.tag}
                  </span>
                </div>
                <p
                  style={css(
                    "flex:1;font-size:16.5px;line-height:1.7;color:#cddae6"
                  )}
                >
                  “{rev.quote}”
                </p>
                <div
                  style={css(
                    "display:flex;align-items:center;gap:13px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.09)"
                  )}
                >
                  <span
                    style={css(
                      "width:38px;height:38px;border:1.5px solid rgba(255,255,255,0.25);display:grid;place-items:center;flex:none"
                    )}
                  >
                    <span
                      style={css(
                        "width:13px;height:13px;background:var(--brand);transform:rotate(45deg)"
                      )}
                    />
                  </span>
                  <div>
                    <div
                      style={css(
                        "font-family:'Oswald';font-weight:600;font-size:16px;letter-spacing:0.03em;color:#fff;text-transform:uppercase"
                      )}
                    >
                      {rev.name}
                    </div>
                    <div
                      style={css(
                        "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.05em;color:#8aa0b6;margin-top:3px"
                      )}
                    >
                      {rev.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <div
        aria-hidden="true"
        style={css(
          "height:13px;background:repeating-linear-gradient(45deg,var(--accent) 0 16px,#15202b 16px 32px)"
        )}
      />
      <section
        id="book"
        style={css(
          "background-color:var(--bg-2);background-image:repeating-linear-gradient(0deg,rgba(0,0,0,0.02) 0 1px,transparent 1px 5px),radial-gradient(circle at 25% 30%,rgba(0,0,0,0.025) 0 1px,transparent 2px),radial-gradient(circle at 75% 70%,rgba(0,0,0,0.02) 0 1px,transparent 2px);background-size:auto,13px 13px,19px 19px"
        )}
      >
        <div style={css("max-width:1240px;margin:0 auto;padding:80px 32px")}>
          <div
            className="tdf-book-grid"
            style={css(
              "display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start"
            )}
          >
            {/* GET IN TOUCH */}
            <div>
              <div
                style={css(
                  "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:var(--brand);margin-bottom:16px"
                )}
              >
                Get in touch
              </div>
              <h2
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:clamp(40px,4.4vw,52px);line-height:1.0;text-transform:uppercase;color:var(--panel);max-width:400px"
                )}
              >
                Ready to get your rig rolling?
              </h2>
              <p
                style={css(
                  "font-size:16px;line-height:1.7;color:#5c6470;max-width:430px;margin:22px 0 38px"
                )}
              >
                Give us a call or fill out the form and we&apos;ll get back to you the same
                day. Straight answers, fair prices, no runaround.
              </p>
              <div style={css("display:flex;flex-direction:column;gap:24px")}>
                <div style={css("display:flex;align-items:flex-start;gap:16px")}>
                  <span
                    style={css(
                      "flex:none;width:50px;height:50px;border-radius:50%;background:var(--brand);display:grid;place-items:center;box-shadow:0 6px 15px rgba(0,0,0,0.13)"
                    )}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <div>
                    <div
                      style={css(
                        "font-family:'Oswald';font-weight:600;font-size:18px;letter-spacing:0.03em;text-transform:uppercase;color:var(--panel);margin-bottom:3px"
                      )}
                    >
                      Phone
                    </div>
                    <a
                      href="tel:+18005550199"
                      style={css("font-size:15.5px;color:#5c6470;line-height:1.55")}
                    >
                      (800) 555-0199
                    </a>
                  </div>
                </div>

                <div style={css("display:flex;align-items:flex-start;gap:16px")}>
                  <span
                    style={css(
                      "flex:none;width:50px;height:50px;border-radius:50%;background:var(--brand);display:grid;place-items:center;box-shadow:0 6px 15px rgba(0,0,0,0.13)"
                    )}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <polyline points="12 7 12 12 15 14" />
                    </svg>
                  </span>
                  <div>
                    <div
                      style={css(
                        "font-family:'Oswald';font-weight:600;font-size:18px;letter-spacing:0.03em;text-transform:uppercase;color:var(--panel);margin-bottom:3px"
                      )}
                    >
                      Hours
                    </div>
                    <div
                      style={css("font-size:15.5px;color:#5c6470;line-height:1.55")}
                    >
                      Mon–Sat · 6:00a – 8:00p&nbsp;&nbsp;|&nbsp;&nbsp;Sun · Closed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BUILDER */}
            <div>
              {!submitted && (
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  style={css("display:flex;flex-direction:column;gap:20px")}
                >
                  <div style={css("display:grid;grid-template-columns:1fr 1fr;gap:16px")}>
                    <div>
                      <label
                        htmlFor="bk-first"
                        style={css(
                          "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                        )}
                      >
                        First name
                      </label>
                      <input
                        id="bk-first"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Dale"
                        className="tdf-input"
                        aria-invalid={errors.firstName ? true : undefined}
                        aria-describedby={errors.firstName ? "bk-first-err" : undefined}
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          clearErr("firstName");
                        }}
                        style={css(fnStyle)}
                      />
                      {errors.firstName && (
                        <div
                          id="bk-first-err"
                          style={css(
                            "font-family:'IBM Plex Mono';font-size:11px;color:#c0392b;margin-top:6px;letter-spacing:0.03em"
                          )}
                        >
                          {errors.firstName}
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="bk-last"
                        style={css(
                          "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                        )}
                      >
                        Last name
                      </label>
                      <input
                        id="bk-last"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Bishop"
                        className="tdf-input"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={css(INPUT_BASE)}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="bk-phone"
                      style={css(
                        "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                      )}
                    >
                      Phone number
                    </label>
                    <input
                      id="bk-phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(512) 555-0148"
                      className="tdf-input"
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? "bk-phone-err" : undefined}
                      value={phone}
                      onChange={(e) => {
                        setPhone(formatPhone(e.target.value));
                        clearErr("phone");
                      }}
                      style={css(phStyle)}
                    />
                    {errors.phone && (
                      <div
                        id="bk-phone-err"
                        style={css(
                          "font-family:'IBM Plex Mono';font-size:11px;color:#c0392b;margin-top:6px;letter-spacing:0.03em"
                        )}
                      >
                        {errors.phone}
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="bk-service"
                      style={css(
                        "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                      )}
                    >
                      Service needed
                    </label>
                    <select
                      id="bk-service"
                      className="tdf-input"
                      aria-invalid={errors.serviceNeeded ? true : undefined}
                      aria-describedby={
                        errors.serviceNeeded ? "bk-service-err" : undefined
                      }
                      value={serviceNeeded}
                      onChange={(e) => {
                        setServiceNeeded(e.target.value);
                        clearErr("serviceNeeded");
                      }}
                      style={css(svStyle)}
                    >
                      <option value="">Select a service…</option>
                      {SERVICE_OPTIONS.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.serviceNeeded && (
                      <div
                        id="bk-service-err"
                        style={css(
                          "font-family:'IBM Plex Mono';font-size:11px;color:#c0392b;margin-top:6px;letter-spacing:0.03em"
                        )}
                      >
                        {errors.serviceNeeded}
                      </div>
                    )}
                  </div>
                  <div style={css("display:grid;grid-template-columns:130px 1fr;gap:16px")}>
                    <div>
                      <label
                        htmlFor="bk-year"
                        style={css(
                          "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                        )}
                      >
                        Year
                      </label>
                      <input
                        id="bk-year"
                        type="text"
                        inputMode="numeric"
                        placeholder="2019"
                        className="tdf-input"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        style={css(INPUT_BASE)}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bk-makemodel"
                        style={css(
                          "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                        )}
                      >
                        Make &amp; model
                      </label>
                      <input
                        id="bk-makemodel"
                        type="text"
                        placeholder="Peterbilt 579"
                        className="tdf-input"
                        value={makeModel}
                        onChange={(e) => setMakeModel(e.target.value)}
                        style={css(INPUT_BASE)}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="bk-issue"
                      style={css(
                        "display:block;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--panel);margin-bottom:8px"
                      )}
                    >
                      Describe the issue
                    </label>
                    <textarea
                      id="bk-issue"
                      rows={4}
                      placeholder="Low power under load, check-engine light, coolant leak…"
                      className="tdf-input"
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      style={css(
                        "width:100%;border:1px solid #c4bdae;background:#fff;padding:14px 15px;font-family:'IBM Plex Sans';font-size:15px;color:#16202b;resize:vertical;line-height:1.5"
                      )}
                    />
                  </div>
                  <button
                    type="submit"
                    className="tdf-submit"
                    style={css(
                      "width:100%;background:var(--brand);color:#fff;font-family:'Oswald';font-weight:600;font-size:18px;letter-spacing:0.08em;text-transform:uppercase;padding:18px;border:none;cursor:pointer;box-shadow:0 6px 0 var(--brand-dark)"
                    )}
                  >
                    Request service →
                  </button>
                </form>
              )}

              {submitted && (
                <div
                  style={css(
                    "position:relative;overflow:hidden;background:var(--panel);color:#fff;border:1px solid rgba(79,208,224,0.18)"
                  )}
                >
                  <div
                    aria-hidden="true"
                    style={css(
                      "position:absolute;inset:0;background-image:linear-gradient(rgba(79,208,224,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(79,208,224,0.05) 1px,transparent 1px);background-size:30px 30px;pointer-events:none"
                    )}
                  />
                  <div
                    style={css(
                      "position:relative;display:flex;align-items:center;gap:11px;padding:14px 30px;background:linear-gradient(180deg,rgba(63,174,107,0.2),rgba(63,174,107,0.06));border-bottom:1px solid rgba(63,174,107,0.4)"
                    )}
                  >
                    <span
                      style={css(
                        "width:11px;height:11px;border-radius:50%;background:var(--go);box-shadow:0 0 12px var(--go);animation:tdf-pulse 2.6s ease-out infinite;flex:none"
                      )}
                    />
                    <span
                      style={css(
                        "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#bdeccd"
                      )}
                    >
                      Job filed · on the dispatch board
                    </span>
                  </div>
                  <div
                    style={css(
                      "position:relative;padding:42px 30px 38px;display:flex;flex-direction:column;align-items:flex-start;gap:20px"
                    )}
                  >
                    <h3
                      style={css(
                        "font-family:'Oswald';font-weight:700;font-size:38px;line-height:1.02;text-transform:uppercase"
                      )}
                    >
                      You&apos;re on the board{nameComma}
                    </h3>
                    <p
                      style={css(
                        "font-size:16px;line-height:1.7;color:#bcccdb;max-width:460px"
                      )}
                    >
                      We&apos;ve got your work order. A service writer calls within the
                      hour to lock in your bay time.
                    </p>
                    <div style={css("display:flex;flex-wrap:wrap;gap:10px")}>
                      <div
                        style={css(
                          "display:flex;align-items:center;gap:8px;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.1em;color:#cfe7ef;padding:9px 13px;border:1px solid rgba(79,208,224,0.32);background:rgba(8,28,42,0.55)"
                        )}
                      >
                        <span style={css("color:#8aa0b6")}>WORK ORDER</span>
                        <strong style={css("color:var(--accent);font-weight:700")}>
                          {woNumber}
                        </strong>
                      </div>
                      <div
                        style={css(
                          "display:flex;align-items:center;gap:8px;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.1em;color:#cfe7ef;padding:9px 13px;border:1px solid rgba(79,208,224,0.32);background:rgba(8,28,42,0.55)"
                        )}
                      >
                        CALLBACK ≤ 1 HR
                      </div>
                      <div
                        style={css(
                          "display:flex;align-items:center;gap:8px;font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.1em;color:#cfe7ef;padding:9px 13px;border:1px solid rgba(79,208,224,0.32);background:rgba(8,28,42,0.55)"
                        )}
                      >
                        BAY ASSIGNED ON ARRIVAL
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={reset}
                      className="tdf-ghost"
                      style={css(
                        "margin-top:8px;background:none;border:1px solid rgba(255,255,255,0.4);color:#fff;font-family:'Oswald';font-weight:600;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;padding:13px 24px;cursor:pointer"
                      )}
                    >
                      Write another order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FIND THE SHOP */}
      <section
        id="find"
        style={css(
          "background:var(--panel-2);color:#fff;background-image:linear-gradient(rgba(79,208,224,0.045) 1px,transparent 1px),linear-gradient(90deg,rgba(79,208,224,0.045) 1px,transparent 1px);background-size:34px 34px"
        )}
      >
        <div style={css("max-width:1240px;margin:0 auto;padding:92px 32px")}>
          <div style={css("margin-bottom:44px")}>
            <div
              style={css(
                "font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.26em;text-transform:uppercase;color:var(--tech);margin-bottom:14px"
              )}
            >
              Find the shop
            </div>
            <h2
              style={css(
                "font-family:'Oswald';font-weight:700;font-size:46px;line-height:1.04;text-transform:uppercase"
              )}
            >
              Pull off Industrial Ave
            </h2>
          </div>
          <div
            className="tdf-find-grid"
            style={css(
              "display:grid;grid-template-columns:1.4fr 0.8fr;gap:36px;align-items:stretch"
            )}
          >
            <div
              style={css(
                "position:relative;border:1px solid rgba(79,208,224,0.3);overflow:hidden;min-height:380px;background:var(--panel-2)"
              )}
            >
              <iframe
                title="Map to Texas Diesel Fleets — 3800 W Industrial Ave, Midland, TX"
                src="https://maps.google.com/maps?q=3800+W+Industrial+Ave,+Midland,+TX+79701&z=15&output=embed"
                style={css("position:absolute;inset:0;width:100%;height:100%;border:0;display:block")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div
                style={css(
                  "position:absolute;left:18px;bottom:18px;z-index:2;display:flex;align-items:center;gap:12px;background:var(--panel);color:#fff;padding:13px 16px;border:1px solid rgba(79,208,224,0.4);box-shadow:0 12px 28px rgba(0,0,0,0.45)"
                )}
              >
                <span
                  style={css(
                    "flex:none;width:36px;height:36px;border-radius:50%;background:var(--brand);display:grid;place-items:center"
                  )}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <div style={css("line-height:1.3")}>
                  <div
                    style={css(
                      "font-family:'Oswald';font-weight:700;font-size:14px;letter-spacing:0.04em;text-transform:uppercase"
                    )}
                  >
                    Texas Diesel Fleets
                  </div>
                  <div
                    style={css(
                      "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.03em;color:#9fb3c2"
                    )}
                  >
                    3800 W Industrial Ave · Midland, TX
                  </div>
                </div>
              </div>
            </div>
            <div
              style={css(
                "background:var(--panel);border:1px solid rgba(79,208,224,0.3);padding:34px 30px;display:flex;flex-direction:column;gap:22px"
              )}
            >
              <div>
                <div
                  style={css(
                    "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--tech);margin-bottom:9px"
                  )}
                >
                  Address
                </div>
                <div
                  style={css(
                    "font-family:'Oswald';font-weight:600;font-size:21px;line-height:1.2;text-transform:uppercase"
                  )}
                >
                  3800 W Industrial Ave
                  <br />
                  Midland, TX 79701
                </div>
              </div>
              <div>
                <div
                  style={css(
                    "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--tech);margin-bottom:9px"
                  )}
                >
                  Hours
                </div>
                <div style={css("font-size:15px;line-height:1.7;color:#bcccdb")}>
                  Mon–Sat · 6:00a – 8:00p
                  <br />
                  Sunday · Closed
                </div>
              </div>
              <div>
                <div
                  style={css(
                    "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--tech);margin-bottom:9px"
                  )}
                >
                  Phone
                </div>
                <a
                  href="tel:+18005550199"
                  style={css("font-family:'Oswald';font-weight:600;font-size:21px;color:#fff")}
                >
                  (800) 555-0199
                </a>
              </div>
              <a
                href="https://maps.google.com/?q=3800+W+Industrial+Ave,+Midland,+TX+79701"
                target="_blank"
                rel="noopener"
                className="tdf-cta"
                style={css(
                  "margin-top:auto;text-align:center;background:var(--brand);color:#fff;font-family:'Oswald';font-weight:600;font-size:15px;letter-spacing:0.07em;text-transform:uppercase;padding:15px 20px"
                )}
              >
                Get directions →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="tdf-foot" style={css("background:var(--panel-3);color:#bcccdb")}>
        <div
          className="tdf-footer-grid"
          style={css(
            "max-width:1240px;margin:0 auto;padding:64px 32px 30px;display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px"
          )}
        >
          <div>
            <div style={css("display:flex;align-items:center;gap:12px;margin-bottom:18px")}>
              <svg
                width="34"
                height="34"
                viewBox="0 0 32 32"
                aria-hidden="true"
                style={css("flex:none;fill:var(--brand)")}
              >
                <circle cx="16" cy="16" r="12.3" />
                <circle cx="16" cy="16" r="9.6" style={css("fill:var(--panel-3)")} />
                <rect x="11.7" y="8.8" width="8.6" height="5.4" rx="1" />
                <rect x="11.7" y="10.6" width="8.6" height="0.7" style={css("fill:var(--panel-3)")} />
                <rect x="11.7" y="12" width="8.6" height="0.7" style={css("fill:var(--panel-3)")} />
                <polygon points="13.4,14.2 18.6,14.2 17.7,19.6 14.3,19.6" />
                <circle cx="16" cy="20.6" r="2.6" />
                <circle cx="16" cy="20.6" r="1.1" style={css("fill:var(--panel-3)")} />
              </svg>
              <span
                style={css(
                  "font-family:'Oswald';font-weight:700;font-size:18px;letter-spacing:0.06em;color:#fff;text-transform:uppercase"
                )}
              >
                Texas Diesel Fleets
              </span>
            </div>
            <p style={css("font-size:15px;line-height:1.6;max-width:320px")}>
              Heavy-duty diesel repair, fleet maintenance, and DOT inspections. Locally
              owned in Midland, TX since 2025.
            </p>
          </div>
          <div>
            <div
              style={css(
                "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6d8298;margin-bottom:16px"
              )}
            >
              Shop
            </div>
            <div style={css("display:flex;flex-direction:column;gap:10px;font-size:15px")}>
              <a href="#diagnostic">Diagnostic</a>
              <a href="#about">About</a>
              <a href="#reviews">Reviews</a>
              <a href="#book">Reserve a Bay</a>
            </div>
          </div>
          <div>
            <div
              style={css(
                "font-family:'IBM Plex Mono';font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6d8298;margin-bottom:16px"
              )}
            >
              Contact
            </div>
            <div style={css("display:flex;flex-direction:column;gap:10px;font-size:15px")}>
              <span
                style={css("color:#fff;font-family:'Oswald';font-size:18px;font-weight:600")}
              >
                (800) 555-0199
              </span>
              <span>
                3800 W Industrial Ave
                <br />
                Midland, TX 79701
              </span>
              <span>Mon–Sat · 6a–8p</span>
            </div>
          </div>
        </div>
        <div style={css("border-top:1px solid rgba(255,255,255,0.08)")}>
          <div
            style={css(
              "max-width:1240px;margin:0 auto;padding:20px 32px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-family:'IBM Plex Mono';font-size:12px;letter-spacing:0.06em;color:#6d8298"
            )}
          >
            <span>© 2026 Texas Diesel Fleets, LLC</span>
            <span>DOT-certified · ASE master techs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
