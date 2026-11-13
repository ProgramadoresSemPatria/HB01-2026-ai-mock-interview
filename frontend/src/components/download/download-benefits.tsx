import {
  Maximize2,
  MonitorSmartphone,
  RefreshCw,
  Smartphone,
  Store,
  Zap,
} from "lucide-react";

const BENEFITS = [
  {
    Icon: Maximize2,
    title: "Full-screen focus",
    body: "No tabs, no address bar. Just you and the interviewer, like a native app.",
  },
  {
    Icon: Smartphone,
    title: "One tap from your home screen",
    body: "Squeeze in a round on the commute or between meetings without hunting for a tab.",
  },
  {
    Icon: Zap,
    title: "Light and fast",
    body: "A few taps to install, nothing heavy to download. Opens straight into your sessions.",
  },
  {
    Icon: MonitorSmartphone,
    title: "Works on every device",
    body: "iPhone, Android, Mac, Windows or Linux. Same account, same progress everywhere.",
  },
  {
    Icon: Store,
    title: "No app store",
    body: "Install straight from your browser. No store account, no review queue.",
  },
  {
    Icon: RefreshCw,
    title: "Always up to date",
    body: "Improvements land the next time you open it. Nothing to update by hand.",
  },
];

export default function DownloadBenefits() {
  return (
    <section
      aria-labelledby="download-benefits-title"
      className="landing-section bg-paper-white px-6"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-2xl">
          <p className="landing-tag mb-3">Why install</p>
          <h2 id="download-benefits-title" className="landing-heading">
            The same Hone, built for the moments you actually have
          </h2>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="landing-mist-card flex gap-4 !p-5 sm:block sm:!p-7"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-white text-jade shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:h-11 sm:w-11"
                aria-hidden
              >
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <h3 className="manrope pt-2 text-[17px] font-medium tracking-[-0.2px] text-ink-black sm:mt-6 sm:pt-0 sm:text-[19px]">
                  {title}
                </h3>
                <p className="manrope mt-1.5 text-[15px] leading-relaxed text-slate-gray sm:mt-2">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
