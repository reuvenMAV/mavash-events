"use client";

type FlowStep = "rsvp" | "thanks" | "blessing" | "photos" | "done";

const NAV = [
  { id: "rsvp" as const, label: "אישור הגעה", icon: "✓" },
  { id: "blessing" as const, label: "ברכה", icon: "💬" },
  { id: "photos" as const, label: "תמונות", icon: "📷" },
];

export function EventStepNav({
  step,
  canUseGuestSteps,
  accent,
  onSelect,
}: {
  step: FlowStep;
  canUseGuestSteps: boolean;
  accent: string;
  onSelect: (target: "rsvp" | "blessing" | "photos") => void;
}) {
  const active =
    step === "thanks" || step === "done"
      ? "photos"
      : step === "rsvp"
        ? "rsvp"
        : step;

  return (
    <nav
      className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-2 shadow-sm"
      aria-label="ניווט בין שלבי האורח"
    >
      {NAV.map((item) => {
        const locked = item.id !== "rsvp" && !canUseGuestSteps;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            disabled={locked}
            onClick={() => onSelect(item.id)}
            title={locked ? "זמין אחרי אישור הגעה" : undefined}
            className={`rounded-xl px-2 py-3 text-center text-xs transition sm:text-sm ${
              locked
                ? "cursor-not-allowed border border-dashed border-charcoal/15 text-charcoal/45"
                : isActive
                  ? "font-medium text-charcoal"
                  : "text-charcoal/60 hover:bg-charcoal/5"
            }`}
            style={isActive ? { backgroundColor: `${accent}22`, borderColor: accent } : undefined}
            aria-current={isActive ? "step" : undefined}
          >
            <span className="block text-base leading-none" aria-hidden>
              {item.icon}
            </span>
            <span className="mt-1 block">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
