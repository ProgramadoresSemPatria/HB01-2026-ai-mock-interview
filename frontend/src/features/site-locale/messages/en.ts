/**
 * English copy for the public site (landing + download). `pt.ts` must match
 * this shape exactly — `SiteMessages` is derived from it.
 *
 * Install steps use `{icon}` as the slot for the inline UI glyph.
 */
export const en = {
  common: {
    getStarted: "Get started",
    comingSoon: "Coming soon",
    homeAriaLabel: "Hone home",
    language: "Language",
    useInBrowser: "Use in browser",
  },
  nav: {
    ariaLabel: "Main navigation",
    product: "Product",
    howItWorks: "How it works",
    getTheApp: "Get the app",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  footer: {
    tagline: "Sharpen the thinking that interviews actually test.",
    groups: {
      product: "Product",
      company: "Company",
      legal: "Legal",
    },
    links: {
      features: "Features",
      demo: "Demo",
      about: "About",
      blog: "Blog",
      contact: "Contact",
      terms: "Terms",
      privacy: "Privacy",
    },
    rights: "Hone. All rights reserved.",
    builtFor: "Built for engineers who take their craft seriously.",
  },
  video: {
    playing: "Demo · Playing",
  },
  backedBy: {
    label: "Backed by",
    ariaLabel: "Backed by Borderless — opens borderlesscoding.com in a new tab",
  },
  hero: {
    titleStart: "Practice the interview that",
    titleEmphasis: "decides your career",
    subtitle:
      "Resume-aware AI mock interviews for software engineers — structured feedback, topic coverage, and the reps that stick.",
    score: {
      tag: "Interview score",
      delta: "↑ 12 pts vs last session",
    },
    topics: {
      tag: "Topic coverage",
      rows: [
        { topic: "System Design", level: "Strong" },
        { topic: "APIs", level: "Strong" },
        { topic: "Algorithms", level: "Review" },
        { topic: "Trade-offs", level: "Growing" },
        { topic: "Scalability", level: "Strong" },
      ],
    },
    feedback: {
      title: "Feedback",
      tag: "System Design · Ride share",
      body: "You framed the bottleneck clearly. Push deeper on consistency trade-offs before proposing shards.",
    },
    composerPlaceholder: "Ask anything…",
    activation: {
      tag: "Activation",
      delta: "↑ 5.5× vs last week",
    },
  },
  socialProof: {
    eyebrow: "Trusted by engineers at",
  },
  features: {
    title: "Sharpen engineering thinking",
    subtitle: "through AI mock interviews built for modern software engineers.",
    pillars: {
      resume: {
        tag: "Resume",
        title: "Built on your experience",
        description:
          "No generic question banks. Hone reads your resume against the role and ships interviews that probe the gaps that actually show up in loops.",
        cta: "Analyse my resume →",
        videoLabel:
          "Uploading a resume PDF in Hone and watching it finish processing",
      },
      session: {
        tag: "Practice",
        title: "Powered by live AI sessions",
        description:
          "Follow-ups that chase your reasoning — trade-offs, bottlenecks, and depth — so canned answers stop working.",
        cta: "Try a session →",
        videoLabel:
          "Choosing Entry level and 5 turns, then starting a live AI interview",
      },
      review: {
        tag: "Review",
        title: "Designed for real progress",
        description:
          "Topic coverage across 40+ domains, scores you can trust, and a report that shows exactly where to grind next.",
        cta: "See a sample report →",
        videoLabel:
          "Closing feedback and prioritized topics to review after a session",
      },
    },
  },
  chatDemo: {
    eyebrow: "Live demo",
    title: "See the interview in action",
    subtitle:
      "A real Hone session: you answer, and the AI interviewer digs into your reasoning with live follow-ups — just like a real loop.",
    recordedLabel: "Recorded from a real session",
    videoLabel:
      "A candidate answers a question and the AI interviewer streams its follow-up in a real Hone session",
  },
  interviewDemo: {
    sessionTag: "Interview session",
    labels: {
      role: "Role",
      company: "Company",
      difficulty: "Difficulty",
      duration: "Duration",
      focusAreas: "Focus Areas",
      context: "Context",
    },
    meta: {
      level: "Senior Level",
      role: "Backend Engineer",
      company: "Nubank",
      difficulty: "Senior",
      duration: "45 min (Mock)",
      focusAreas: "System Design, Distributed Systems, Scalability, Trade-offs",
    },
    candidate: "Candidate",
    interviewer: "AI Interviewer",
    timeLocale: "en-US",
    composePlaceholder: "Type your response…",
    composeHint: "Press Enter to send",
    sendAriaLabel: "Send message",
    initialMessages: [
      "Let's start with a system design question. Imagine you're building a distributed payment ledger at Nubank scale. How would you approach the consistency versus availability trade-off when a network partition occurs between two data centers?",
      "I'd lean toward strong consistency for financial transactions using a consensus protocol like Raft or Paxos for leader election. The trade-off is higher latency during partitions, but we avoid double-spend scenarios. For read-heavy paths, I'd use follower replicas with bounded staleness.",
      "Good framing. You mentioned leader election — how would you handle split-brain scenarios if the network partition lasts longer than your lease timeout? Walk me through your fencing strategy.",
    ],
    context: {
      idle: "Analyzing candidate response for consistency versus availability trade-offs.",
      typing: "Evaluating technical depth of distributed systems answer…",
      complete:
        "Demo complete. Create an account to run a full personalized interview.",
    },
    turns: [
      {
        aiResponse:
          "Solid answer on fencing tokens. Now let's go deeper — if you're using a quorum-based system, what happens when you lose exactly half your nodes? How do you decide whether to accept writes?",
        contextText:
          "Probing quorum mechanics and write acceptance policies under partial failures.",
      },
      {
        aiResponse:
          "You touched on partition tolerance. In practice, how would you design your observability layer to detect and alert on split-brain before it causes data corruption? What metrics would you track?",
        contextText:
          "Assessing observability design for distributed consensus failures.",
      },
      {
        aiResponse:
          "Last question — if product asks you to relax consistency for a non-critical read path, how would you document and communicate that trade-off to stakeholders who aren't technical?",
        contextText:
          "Evaluating communication of technical trade-offs to non-technical stakeholders.",
      },
      {
        aiResponse:
          "That wraps up this demo session. You've shown strong systems thinking. Ready to practice with your own résumé and tailored questions? Create a free account to start your first real AI mock interview.",
        contextText:
          "Demo complete. Create an account to run a full personalized interview.",
      },
    ],
  },
  previews: {
    eyebrow: "After every session",
    title: "You answer. It measures exactly where you stand.",
    dashboardTag: "Progress dashboard",
    feedbackTag: "Feedback report",
    report: {
      tag: "Session report",
      title: "System Design — Ride Share App",
      metrics: [
        { label: "Independent thinking", value: "High" },
        { label: "Canned answers", value: "0" },
        { label: "Reasoning validated", value: "100%" },
      ],
      strengthsTag: "Strengths",
      strengths: [
        "Articulated trade-offs without prompting",
        "Identified bottleneck in O(n²) approach",
        "Proposed horizontal scaling strategy",
      ],
      growthTag: "Growth areas",
      growthAreas: [
        "CAP theorem application in edge cases",
        "Latency vs. throughput framing",
        "Consensus algorithm depth",
      ],
    },
    dashboard: {
      performanceScore: "Performance score",
      sessions: "Sessions",
      topicCoverage: "Topic coverage",
      topics: [
        "System Design",
        "Algorithms",
        "Distributed Systems",
        "APIs & REST",
        "Data Modeling",
        "Scalability",
      ],
    },
  },
  quote: {
    title: "Why candidates switch to Hone",
    quote:
      "“You don't rise to the level of the interview. You fall to the level of your preparation.”",
    attribution: "— The philosophy behind Hone",
  },
  installApp: {
    title: "Install the Hone app",
    body: "Practice interviews anywhere. Add Hone to your phone or desktop in seconds.",
    points: [
      "Opens full screen, like a native app",
      "One tap from your home screen",
      "No app store, always up to date",
    ],
    getTheApp: "Get the app",
    howToInstall: "How to install",
  },
  cta: {
    title: "Try Hone free. First interview in under a minute.",
    body: "Connect your resume or explore in demo mode. No credit card.",
  },
  download: {
    hero: {
      platforms: "Hone for iPhone, Android & desktop",
      launchNotice:
        "The Hone app is launching soon. Early access is available below.",
      titleStart: "Practice interviews",
      titleEmphasis: "anywhere",
      subtitle:
        "Put Hone on your home screen. Resume-aware mock interviews, instant feedback and your study backlog — one tap away, full screen, no app store.",
    },
    phone: {
      caption:
        "Hone running as an installed app: a live, resume-aware system design interview on a phone, with session feedback and a study backlog.",
      topic: "System Design",
      progress: "Mid level · Question 3 of 6",
      live: "Live",
      interviewer: "AI Interviewer",
      question:
        "Your resume mentions a feed service at 2M DAU. How would you shard it without hot partitions?",
      answer:
        "Consistent hashing on user ID, then isolate celebrity keys into a fan-out-on-read path.",
      followUp: "Good. What breaks first when a celebrity posts",
      composer: "Type your answer…",
      feedbackTag: "Session feedback",
      feedbackBody: "Strong trade-off framing. Go deeper on cache invalidation.",
      backlogTag: "Study backlog",
      backlog: [
        { topic: "Cache invalidation", tag: "New" },
        { topic: "Rate limiting", tag: "Review" },
      ],
    },
    benefits: {
      eyebrow: "Why install",
      title: "The same Hone, built for the moments you actually have",
      items: [
        {
          title: "Full-screen focus",
          body: "No tabs, no address bar. Just you and the interviewer, like a native app.",
        },
        {
          title: "One tap from your home screen",
          body: "Squeeze in a round on the commute or between meetings without hunting for a tab.",
        },
        {
          title: "Light and fast",
          body: "A few taps to install, nothing heavy to download. Opens straight into your sessions.",
        },
        {
          title: "Works on every device",
          body: "iPhone, Android, Mac, Windows or Linux. Same account, same progress everywhere.",
        },
        {
          title: "No app store",
          body: "Install straight from your browser. No store account, no review queue.",
        },
        {
          title: "Always up to date",
          body: "Improvements land the next time you open it. Nothing to update by hand.",
        },
      ],
    },
    platforms: {
      eyebrow: "How to install",
      title: "Three steps on any device",
      intro: "Hone installs from your browser in under a minute. Pick your device.",
      introDetected:
        "Hone installs from your browser in under a minute. Pick your device — we've preselected the one you're on.",
      tablistLabel: "Choose your device",
      tabs: {
        ios: {
          label: "iPhone & iPad",
          hint: "Safari",
          note: "Using Chrome or another browser on iPhone? Open this page in Safari first for the most reliable install.",
        },
        android: {
          label: "Android",
          hint: "Chrome",
          note: "Samsung Internet works too: open the menu, then Add page to → Home screen.",
        },
        desktop: {
          label: "Desktop",
          hint: "Chrome, Edge, Safari",
          note: "Installed Hone opens in its own window and can be pinned to your dock or taskbar.",
        },
      },
    },
    steps: {
      ios: [
        {
          title: "Tap {icon} Share",
          detail:
            "In Safari, it sits in the toolbar at the bottom (or top on iPad).",
          glyphLabel: "Share",
        },
        {
          title: "Choose {icon} Add to Home Screen",
          detail: "Scroll the share sheet down if you don't see it right away.",
          glyphLabel: "Add",
        },
        {
          title: "Tap Add",
          detail: "Hone lands on your home screen and opens full screen.",
          glyphLabel: "",
        },
      ],
      android: [
        {
          title: "Open the {icon} menu in Chrome",
          detail: "Or tap the Install button on this page when it shows up.",
          glyphLabel: "Menu",
        },
        {
          title: "Tap Install app",
          detail: "Some versions call it Add to Home screen.",
          glyphLabel: "",
        },
        {
          title: "Confirm Install",
          detail: "Hone appears in your app drawer and on your home screen.",
          glyphLabel: "",
        },
      ],
      desktop: [
        {
          title: "Open Hone in Chrome or Edge",
          detail: "On a Mac with Safari, use File → Add to Dock instead.",
          glyphLabel: "",
        },
        {
          title: "Click {icon} in the address bar",
          detail: "No icon? Open the browser menu and look for Install Hone.",
          glyphLabel: "Install",
        },
        {
          title: "Click Install",
          detail:
            "Hone gets its own window, dock or taskbar icon, and shortcut.",
          glyphLabel: "",
        },
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions, answered",
      items: [
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
      ],
    },
    ctaBand: {
      title: "Your next interview rep is one tap away.",
      body: "Install Hone and keep practicing wherever you are. Free to start.",
    },
    installCta: {
      installed: "Hone is installed on this device.",
      openHone: "Open Hone",
      installHone: "Install Hone",
      fineprint: "Free · Installs in seconds · No app store",
      iosGuide: "Install on iPhone in 3 taps",
      addToHomeScreen: "Add to Home Screen",
      safariGuide: "Open this page in Safari",
      safariBody:
        "iPhone installs work best from Safari. Copy the link, paste it into Safari, then tap Share → Add to Home Screen.",
      safariNote:
        "On recent iOS versions some browsers also offer Add to Home Screen in their share menu.",
      androidGuide: "Install on Android",
      keepInBrowser: "Or keep using Hone in your browser",
      linkCopied: "Link copied",
      copyLink: "Copy link",
    },
  },
  installBanner: {
    title: "Install Hone",
    body: "Open your practice sessions in one tap, full screen.",
    installApp: "Install app",
    iosTap: "Tap",
    iosShare: "Share",
    iosThen: "in Safari, then",
    iosAddToHomeScreen: "Add to Home Screen",
    dismiss: "Dismiss install prompt",
  },
  comingSoonDialog: {
    title: "The Hone app is coming soon",
    body: "We're still building the installable app. In the meantime, Hone works great right in your browser — same account, same progress.",
    useInBrowser: "Use in browser",
    gotIt: "Got it",
  },
};

export type SiteMessages = typeof en;
