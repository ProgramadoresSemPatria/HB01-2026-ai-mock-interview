import { ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: "Is the app free?",
    a: "Yes. Installing Hone costs nothing — it's the same Hone you use in the browser, with the same account and the same plan. Start free, no credit card.",
  },
  {
    q: "How much storage does it take?",
    a: "Very little. Hone is a web app, so there's no large download — your device keeps an icon and a small cache so it opens quickly. Your interviews and progress live in your account, not on the phone.",
  },
  {
    q: "Do I need an internet connection?",
    a: "Yes. The AI interviewer and feedback run live, so practice sessions need a connection — just like in the browser.",
  },
  {
    q: "How do I uninstall it?",
    a: "On iPhone or Android, press and hold the Hone icon and choose Remove App or Uninstall. On desktop, open Hone, then use the window menu and choose Uninstall. Your account and history stay intact.",
  },
  {
    q: "Is it safe?",
    a: "Yes. Hone runs inside your browser's security sandbox and is served over HTTPS from the same site you already use. Installing doesn't ask for contacts, location or any extra permissions.",
  },
];

export default function DownloadFaq() {
  return (
    <section
      aria-labelledby="download-faq-title"
      className="landing-section download-faq bg-paper-white px-6"
    >
      <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <p className="landing-tag mb-3">FAQ</p>
          <h2 id="download-faq-title" className="landing-heading">
            Questions, answered
          </h2>
        </div>

        <div className="border-t border-border-hairline">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              name="download-faq"
              className="group border-b border-border-hairline"
            >
              <summary className="manrope flex cursor-pointer items-center justify-between gap-6 rounded-md py-5 text-left text-[17px] font-medium text-ink-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jade/30">
                {q}
                <ChevronDown
                  size={20}
                  strokeWidth={1.5}
                  className="download-faq-chevron shrink-0 text-ash-gray transition-transform duration-200"
                  aria-hidden
                />
              </summary>
              <p className="manrope max-w-[60ch] pb-6 pr-8 text-[15px] leading-relaxed text-slate-gray">
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
