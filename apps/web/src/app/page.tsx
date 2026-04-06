import { CopyButton } from "@/components/copy-button";

export default function LandingPage() {
  return (
    <div className="selection:bg-cyan-500/30">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#131315]/60 backdrop-blur-xl shadow-[0_20px_50px_-12px_rgba(6,182,212,0.08)]">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center gap-2 text-xl font-bold text-white font-[Inter]">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[#131315] text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                mail
              </span>
            </div>
            MailFail
          </div>
          <div className="hidden md:flex gap-8 items-center font-['Space_Grotesk'] text-sm uppercase tracking-widest">
            <a
              className="text-cyan-400 border-b-2 border-cyan-400 pb-1"
              href="#features"
            >
              Features
            </a>
            <a
              className="text-zinc-400 hover:text-white transition-colors"
              href="#how-it-works"
            >
              How It Works
            </a>
            <a
              className="text-zinc-400 hover:text-white transition-colors"
              href="#validation"
            >
              Validation
            </a>
            <a
              className="text-zinc-400 hover:text-white transition-colors"
              href="#comparison"
            >
              Comparison
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/johannesosterkamp/mailfail"
              className="text-zinc-400 hover:text-cyan-300 transition-all duration-300"
              aria-label="View on GitHub"
            >
              <span className="material-symbols-outlined">terminal</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full -z-10" />
            <h1 className="text-6xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] mb-6">
              Catch every email.{" "}
              <span className="text-cyan-400">Validate</span> before you ship.
            </h1>
            <p className="text-xl text-zinc-400 mb-10 max-w-lg leading-relaxed">
              Stop sending test emails to real inboxes. MailFail catches every
              email your app sends during development — with built-in validation
              for links, images, spam, HTML, and accessibility.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#install"
                className="bg-gradient-to-br from-cyan-400 to-cyan-600 text-[#003640] font-bold px-8 py-4 rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-transform"
              >
                Get Started
              </a>
              <a
                href="https://github.com/johannesosterkamp/mailfail"
                className="bg-[#2a2a2c] text-zinc-300 border border-[#3d494c]/20 px-8 py-4 rounded-xl hover:bg-[#39393b] hover:text-white transition-colors"
              >
                View on GitHub
              </a>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-transparent blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative bg-[#0e0e10] border border-[#3d494c]/30 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-[#1c1b1d] px-4 py-2 flex items-center gap-2 border-b border-[#3d494c]/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="text-[10px] font-['JetBrains_Mono'] text-zinc-500 ml-4">
                  zsh — 80x24
                </div>
              </div>
              <div className="p-6 font-['JetBrains_Mono'] text-sm leading-relaxed">
                <div className="flex gap-3 mb-4">
                  <span className="text-cyan-400">$</span>
                  <span className="text-zinc-200">npx mailfail</span>
                </div>
                <div className="text-zinc-300 mb-4">
                  &nbsp;&nbsp;MailFail v1.0.0
                </div>
                <div className="text-zinc-400 mb-1">
                  &nbsp;&nbsp;SMTP&nbsp;&nbsp;→ localhost:2525
                </div>
                <div className="text-zinc-400 mb-4">
                  &nbsp;&nbsp;UI&nbsp;&nbsp;&nbsp;&nbsp;→{" "}
                  <span className="underline decoration-cyan-500/30">
                    http://localhost:3333
                  </span>
                </div>
                <div className="text-zinc-500 mb-1">
                  &nbsp;&nbsp;SMTP_HOST=localhost
                </div>
                <div className="text-zinc-500 mb-1">
                  &nbsp;&nbsp;SMTP_PORT=2525
                </div>
                <div className="text-zinc-500 mb-1">
                  &nbsp;&nbsp;SMTP_USER=dev
                </div>
                <div className="text-zinc-500 mb-4">
                  &nbsp;&nbsp;SMTP_PASS=dev
                </div>
                <div className="text-green-400 mb-2">
                  &nbsp;&nbsp;Ready to catch emails!
                </div>
                <div className="mt-2 text-zinc-600 animate-pulse">_</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="max-w-7xl mx-auto px-8 mt-48" id="features">
          <div className="text-center mb-20">
            <h2 className="text-zinc-500 font-['Space_Grotesk'] uppercase tracking-[0.3em] text-sm mb-4">
              Core Engine
            </h2>
            <h3 className="text-4xl font-bold text-white font-[Inter] tracking-tight">
              Built for development speed.
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Zero Config */}
            <div className="bg-[#1c1b1d] p-8 rounded-xl border border-[#3d494c]/10 hover:border-cyan-500/20 transition-colors group">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-cyan-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-[Inter]">
                Zero Config
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                No Docker, no databases, no cloud subscriptions. Just a single
                command to start catching emails locally.
              </p>
            </div>
            {/* Email Validation */}
            <div className="bg-[#1c1b1d] p-8 rounded-xl border border-[#3d494c]/10 hover:border-cyan-500/20 transition-colors group">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-cyan-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  fact_check
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-[Inter]">
                Email Validation
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Auto-check broken links, image alt tags, spam scores, and HTML
                accessibility issues in every outgoing mail.
              </p>
            </div>
            {/* Real-Time */}
            <div className="bg-[#1c1b1d] p-8 rounded-xl border border-[#3d494c]/10 hover:border-cyan-500/20 transition-colors group">
              <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span
                  className="material-symbols-outlined text-cyan-400"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  sync
                </span>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 font-[Inter]">
                Real-Time UI
              </h4>
              <p className="text-zinc-400 leading-relaxed">
                Powered by Server-Sent Events (SSE) for an instant, responsive
                UI that updates the moment an email is sent.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          className="max-w-7xl mx-auto px-8 mt-48 py-24 bg-[#0e0e10] rounded-[2rem] border border-[#3d494c]/10"
          id="how-it-works"
        >
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white font-[Inter] tracking-tight">
              The Three-Step Workflow
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-8">
            <div className="relative text-center lg:text-left">
              <div className="text-6xl font-bold text-zinc-800 font-['Space_Grotesk'] mb-4">
                01
              </div>
              <h5 className="text-xl font-bold text-white mb-2">Install</h5>
              <p className="text-zinc-500">
                Run{" "}
                <code className="text-cyan-300 bg-[#2a2a2c] px-1.5 py-0.5 rounded">
                  npx mailfail
                </code>{" "}
                to start catching emails instantly.
              </p>
            </div>
            <div className="relative text-center lg:text-left">
              <div className="text-6xl font-bold text-zinc-800 font-['Space_Grotesk'] mb-4">
                02
              </div>
              <h5 className="text-xl font-bold text-white mb-2">Configure</h5>
              <p className="text-zinc-500">
                Update your app&apos;s SMTP settings to point to localhost on
                port 2525.
              </p>
            </div>
            <div className="relative text-center lg:text-left">
              <div className="text-6xl font-bold text-zinc-800 font-['Space_Grotesk'] mb-4">
                03
              </div>
              <h5 className="text-xl font-bold text-white mb-2">Send</h5>
              <p className="text-zinc-500">
                Trigger any email action and watch it pop up in the MailFail
                dashboard instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Validation Detail Section */}
        <section
          className="max-w-7xl mx-auto px-8 mt-48 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
          id="validation"
        >
          <div>
            <h3 className="text-4xl font-bold text-white font-[Inter] tracking-tight mb-6">
              Validation Reports
            </h3>
            <p className="text-zinc-400 mb-8 leading-relaxed text-lg">
              Don&apos;t just catch emails — validate them. MailFail
              automatically scans your templates for common pitfalls that cause
              emails to end up in spam or look broken in different clients.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-zinc-300">
                <span className="material-symbols-outlined text-green-400 text-lg">
                  check_circle
                </span>
                Link sanity and redirect verification
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <span className="material-symbols-outlined text-green-400 text-lg">
                  check_circle
                </span>
                SpamAssassin score simulation
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <span className="material-symbols-outlined text-green-400 text-lg">
                  check_circle
                </span>
                HTML structure &amp; Accessibility audits
              </li>
            </ul>
          </div>
          <div className="bg-[#2a2a2c] rounded-2xl p-8 border border-[#3d494c]/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-sm font-['Space_Grotesk'] text-zinc-500 uppercase tracking-wider">
                  Analysis Result
                </span>
                <span className="text-2xl font-bold text-white">
                  Validation Report
                </span>
              </div>
              <div className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold font-['Space_Grotesk'] uppercase tracking-tighter">
                Needs Review
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-500 text-xl">
                      link
                    </span>
                  </div>
                  <span className="text-zinc-200 font-medium">Link Status</span>
                </div>
                <span className="text-xs font-['JetBrains_Mono'] text-green-500">
                  200 OK
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-500 text-xl">
                      image
                    </span>
                  </div>
                  <span className="text-zinc-200 font-medium">
                    Image Alt Tags
                  </span>
                </div>
                <span className="text-xs font-['JetBrains_Mono'] text-red-500">
                  2 MISSING
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-yellow-500 text-xl">
                      warning
                    </span>
                  </div>
                  <span className="text-zinc-200 font-medium">Spam Score</span>
                </div>
                <span className="text-xs font-['JetBrains_Mono'] text-yellow-500">
                  2.4 / 5.0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-500 text-xl">
                      html
                    </span>
                  </div>
                  <span className="text-zinc-200 font-medium">
                    HTML Structure
                  </span>
                </div>
                <span className="text-xs font-['JetBrains_Mono'] text-green-500">
                  VALID
                </span>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-[#3d494c]/20">
              <button className="w-full py-3 bg-[#0e0e10] text-zinc-300 rounded-xl hover:bg-[#39393b] transition-colors font-medium">
                View Detailed Log
              </button>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="max-w-7xl mx-auto px-8 mt-48" id="comparison">
          <div className="text-center mb-20">
            <h3 className="text-4xl font-bold text-white font-[Inter] tracking-tight">
              How we stack up
            </h3>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#3d494c]/10 bg-[#1c1b1d]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3d494c]/20">
                  <th className="p-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-zinc-500">
                    Feature
                  </th>
                  <th className="p-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-cyan-400 bg-cyan-500/5">
                    MailFail
                  </th>
                  <th className="p-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-zinc-500">
                    Mailtrap
                  </th>
                  <th className="p-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-zinc-500">
                    Mailpit
                  </th>
                  <th className="p-6 font-['Space_Grotesk'] text-xs uppercase tracking-widest text-zinc-500">
                    Mailhog
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-[#3d494c]/10">
                  <td className="p-6 text-white font-medium">Free &amp; Local</td>
                  <td className="p-6 bg-cyan-500/5">
                    <span className="material-symbols-outlined text-cyan-400">
                      check
                    </span>
                  </td>
                  <td className="p-6 text-zinc-600">Limited</td>
                  <td className="p-6">
                    <span className="material-symbols-outlined text-zinc-400">
                      check
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="material-symbols-outlined text-zinc-400">
                      check
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-[#3d494c]/10">
                  <td className="p-6 text-white font-medium">
                    Email Validation
                  </td>
                  <td className="p-6 bg-cyan-500/5">
                    <span className="material-symbols-outlined text-cyan-400">
                      check
                    </span>
                  </td>
                  <td className="p-6 text-zinc-600">&mdash;</td>
                  <td className="p-6 text-zinc-600">&mdash;</td>
                  <td className="p-6 text-zinc-600">&mdash;</td>
                </tr>
                <tr className="border-b border-[#3d494c]/10">
                  <td className="p-6 text-white font-medium">Real-Time UI</td>
                  <td className="p-6 bg-cyan-500/5">
                    <span className="material-symbols-outlined text-cyan-400">
                      check
                    </span>
                  </td>
                  <td className="p-6 text-zinc-600">Delayed</td>
                  <td className="p-6">
                    <span className="material-symbols-outlined text-zinc-400">
                      check
                    </span>
                  </td>
                  <td className="p-6 text-zinc-600">&mdash;</td>
                </tr>
                <tr className="border-b border-[#3d494c]/10">
                  <td className="p-6 text-white font-medium">Zero Config</td>
                  <td className="p-6 bg-cyan-500/5">
                    <span className="material-symbols-outlined text-cyan-400">
                      check
                    </span>
                  </td>
                  <td className="p-6 text-zinc-600">Account Req.</td>
                  <td className="p-6 text-zinc-600">Docker Req.</td>
                  <td className="p-6 text-zinc-600">Docker Req.</td>
                </tr>
                <tr>
                  <td className="p-6 text-white font-medium">
                    Active Development
                  </td>
                  <td className="p-6 bg-cyan-500/5 text-cyan-400 font-bold">
                    Vibrant
                  </td>
                  <td className="p-6 text-zinc-400">Stable</td>
                  <td className="p-6 text-zinc-400">Stable</td>
                  <td className="p-6 text-zinc-400">Legacy</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom CTA / Install */}
        <section className="max-w-7xl mx-auto px-8 mt-48" id="install">
          <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-[2.5rem] p-12 text-center relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/5 blur-[80px] group-hover:bg-cyan-500/10 transition-colors" />
            <h3 className="text-4xl font-extrabold text-white mb-6">
              Ready to catch emails?
            </h3>
            <p className="text-zinc-400 mb-10 max-w-lg mx-auto">
              Stop sending test emails to your real inbox. Get started with
              MailFail in seconds.
            </p>
            <div className="max-w-md mx-auto relative">
              <div className="bg-[#0e0e10] p-6 rounded-2xl flex items-center justify-between border border-[#3d494c]/20 ethereal-glow">
                <code className="font-['JetBrains_Mono'] text-cyan-300 text-lg">
                  npx mailfail
                </code>
                <CopyButton text="npx mailfail" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-[#131315] border-t border-zinc-800/20">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-white font-bold">MailFail</div>
          <div className="font-[Inter] text-sm text-zinc-500 flex flex-wrap justify-center gap-8">
            <span className="font-['Space_Grotesk'] uppercase tracking-widest text-xs">
              &copy; 2026 MailFail
            </span>
            <a
              className="hover:text-white transition-colors"
              href="https://johannesosterkamp.de"
            >
              Made by Johannes Osterkamp
            </a>
            <a
              className="hover:text-white transition-colors"
              href="https://github.com/johannesosterkamp/mailfail/blob/main/LICENSE"
            >
              MIT License
            </a>
          </div>
          <div className="flex gap-4">
            <a
              href="https://github.com/johannesosterkamp/mailfail"
              className="text-zinc-500 hover:text-cyan-400 transition-colors"
              aria-label="GitHub"
            >
              <span className="material-symbols-outlined">terminal</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
