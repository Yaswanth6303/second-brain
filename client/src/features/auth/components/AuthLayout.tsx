import type { ReactNode } from "react";
import { Link } from "react-router";

const segBtn = (on: boolean) =>
  `rounded-[9px] p-2 text-center font-semibold no-underline ${on ? "bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,.12)]" : "text-muted"}`;

// The prototype's split auth screen: brand panel on the left, form on the right.
export function AuthLayout({ mode, children }: { mode: "login" | "signup"; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="bg-panel text-panel-ink flex flex-col gap-[18px] p-[clamp(24px,5vw,56px)]">
        <div className="font-display flex items-center gap-2.5 px-2 text-[1.15rem] font-bold">
          <span className="bg-mark text-mark-ink grid size-8 flex-none place-items-center rounded-[9px] text-base">
            <i className="bi bi-bookmarks-fill" />
          </span>
          Second Brain
        </div>
        <h1 className="text-panel-ink mt-auto max-w-[14ch] text-[clamp(1.7rem,3.6vw,2.9rem)] leading-[1.05] lg:mt-[8vh]">
          Keep every link{" "}
          <mark className="bg-mark text-mark-ink rounded-md px-[.15em]">worth coming back to</mark>.
        </h1>
        <p className="m-0 max-w-[44ch] opacity-85">
          Paste a link, name it and tag it. Send it to one friend or a whole group, then see who
          finished it.
        </p>
        <ul
          aria-hidden="true"
          className="mt-4 mb-auto hidden max-w-[420px] list-none flex-col gap-2.5 p-0 lg:flex"
        >
          {[
            ["Article · saved 06 Oct · 00:40", "How to Do Great Work", ""],
            ["Video · on Priya's watchlist", "But what is a neural network?", "ml-7"],
            ["Podcast · Weekend Watch Club · 2 of 3 finished", "How I Built This", "ml-14"],
          ].map(([stamp, title, indent]) => (
            <li
              key={title}
              className={`bg-panel-card flex flex-col gap-1 rounded-xl px-3.5 py-3 ${indent}`}
            >
              <span className="stamp text-panel-ink! opacity-70">{stamp}</span>
              <b className="font-display font-semibold">{title}</b>
            </li>
          ))}
        </ul>
      </section>
      <section className="grid place-items-center px-4 py-8">
        <div className="flex w-full max-w-[420px] flex-col gap-5">
          <nav
            className="bg-surface-2 grid grid-cols-2 gap-1 rounded-xl p-1"
            aria-label="Log in or sign up"
          >
            <Link
              to="/login"
              className={segBtn(mode === "login")}
              aria-current={mode === "login" ? "page" : undefined}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className={segBtn(mode === "signup")}
              aria-current={mode === "signup" ? "page" : undefined}
            >
              Sign up
            </Link>
          </nav>
          {children}
        </div>
      </section>
    </div>
  );
}

export function FormHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-[calc(1.275rem+.3vw)] xl:text-2xl">{title}</h2>
      <p className="meta mb-0">{sub}</p>
    </div>
  );
}

export function FormAlert({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="bg-danger/10 text-danger rounded-[10px] px-3 py-2.5 text-[0.9rem]">
      {children}
    </div>
  );
}
