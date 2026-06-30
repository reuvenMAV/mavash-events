"use client";

type GoogleSignInButtonProps = {
  redirectTo?: string;
  label?: string;
  enabled?: boolean;
};

export function GoogleSignInButton({
  redirectTo = "/dashboard",
  label = "המשך עם Google",
  enabled = true,
}: GoogleSignInButtonProps) {
  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-charcoal/15 bg-charcoal/[0.02] px-4 py-3 text-center text-xs text-charcoal/50">
        התחברות עם Google — הגדר <code dir="ltr">GOOGLE_CLIENT_ID</code> ב-Vercel (ראה{" "}
        <code>docs/GOOGLE_AUTH.md</code>)
      </div>
    );
  }

  const href = `/api/auth/google?next=${encodeURIComponent(redirectTo)}`;

  return (
    <a
      href={href}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-charcoal/15 bg-white py-3 text-charcoal shadow-sm transition hover:bg-charcoal/5"
    >
      <GoogleLogo />
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.522 0-10-4.478-10-10s4.478-10 10-10c2.523 0 4.817.943 6.564 2.473l6.066-6.066C33.64 9.64 29.076 8 24 8 14.059 8 6 16.059 6 26s8.059 18 18 18 18-8.059 18-18c0-1.215-.122-2.39-.389-3.517z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.523 0 4.817.943 6.564 2.473l6.066-6.066C33.64 9.64 29.076 8 24 8 16.318 8 9.656 13.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a10.96 10.96 0 0 1-3.746 5.546l.003-.002 6.19 5.238C42.022 35.026 44 30.638 44 26c0-1.215-.122-2.39-.389-3.517z"
      />
    </svg>
  );
}
