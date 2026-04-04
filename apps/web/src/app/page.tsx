import Link from "next/link";
import { ArrowRight, Mail, CheckCircle, Zap, Check } from "lucide-react";
import { BILLING_ENABLED } from "@mailfail/shared";

export default function LandingPage() {
  return (
    <div className="antialiased bg-white text-[#0A0A0A]">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="flex items-center justify-between px-6 h-14 max-w-7xl mx-auto">
          <div className="text-lg font-bold tracking-tighter text-neutral-900">MailFail</div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-neutral-900 font-semibold text-sm transition-colors" href="#features">Features</a>
            {BILLING_ENABLED && <a className="text-neutral-500 font-medium text-sm hover:text-neutral-900 transition-colors" href="#pricing">Pricing</a>}
            <a className="text-neutral-500 font-medium text-sm hover:text-neutral-900 transition-colors" href="#docs">Docs</a>
            <a className="text-neutral-500 font-medium text-sm hover:text-neutral-900 transition-colors" href="#how-it-works">How it works</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-neutral-900 text-sm font-medium transition-colors">
              Login
            </Link>
            <Link
              href="/dashboard"
              className="bg-neutral-900 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-neutral-800 transition-transform active:scale-95 duration-100"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
          style={{
            backgroundImage: "radial-gradient(#E5E5E5 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Stop sending test emails to real people
          </h1>
          <p className="text-xl text-neutral-500 max-w-2xl mx-auto mb-10">
            Get SMTP credentials in seconds. Catch every test email. Check for spam, broken links, and compatibility.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard"
              className="bg-neutral-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* SMTP Snippet */}
          <div className="max-w-xl mx-auto bg-neutral-50 border border-neutral-200 rounded-xl p-4 shadow-sm text-left">
            <div className="flex items-center gap-2 mb-3 border-b border-neutral-200 pb-2">
              <div className="w-3 h-3 rounded-full bg-neutral-200" />
              <div className="w-3 h-3 rounded-full bg-neutral-200" />
              <div className="w-3 h-3 rounded-full bg-neutral-200" />
              <span className="text-[10px] text-neutral-400 font-mono ml-2">.env</span>
            </div>
            <div className="font-mono text-sm space-y-1 text-neutral-700">
              <div><span className="text-neutral-400">SMTP_HOST</span>=smtp.mailfail.dev</div>
              <div><span className="text-neutral-400">SMTP_PORT</span>=2525</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-6">
                <Mail className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-bold mb-3">SMTP Catching</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Catch all outgoing emails with unique SMTP credentials for your inbox. Never worry about accidentally emailing real customers during development.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-6">
                <CheckCircle className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-bold mb-3">Smart Validation</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Automatic link checking, spam scoring, HTML validation, and accessibility audits. Ensure every email you send is perfect.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors">
              <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 text-neutral-600" />
              </div>
              <h3 className="text-lg font-bold mb-3">Real-Time Inbox</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Emails appear instantly via Server-Sent Events, no refresh needed. Experience a fluid workflow that keeps pace with your tests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Validation Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 tracking-tight">Ship emails with confidence</h2>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              Our validation engine automatically runs a suite of tests on every incoming email. From broken links to HTML structure and spam scores, we help you catch issues before your users do.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle className="w-5 h-5 text-green-500 fill-green-500" />
                Automatic HTML element audits
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle className="w-5 h-5 text-green-500 fill-green-500" />
                SpamAssassin™ scoring integration
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <CheckCircle className="w-5 h-5 text-green-500 fill-green-500" />
                Accessibility (WCAG) compliance check
              </li>
            </ul>
          </div>

          {/* Mock Validation Card */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
              </div>
              <span className="text-xs font-mono text-neutral-400">Validation Report: #8821</span>
            </div>
            <div className="p-8">
              <div className="space-y-6">
                {[
                  { label: "Links", badge: "✓ Pass", color: "text-green-600 bg-green-50 border-green-100" },
                  { label: "Images", badge: "✓ Pass", color: "text-green-600 bg-green-50 border-green-100" },
                  { label: "Spam Score", badge: "2/10 (Safe)", color: "text-neutral-900 font-mono" },
                  { label: "HTML Structure", badge: "1 warning", color: "text-amber-600 bg-amber-50 border-amber-100" },
                  { label: "Compatibility", badge: "3 info", color: "text-neutral-500 bg-neutral-50 border-neutral-100" },
                  { label: "Accessibility", badge: "✓ Pass", color: "text-green-600 bg-green-50 border-green-100" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between ${i < 5 ? "border-b border-neutral-100 pb-4" : ""}`}>
                    <span className="text-sm font-medium text-neutral-600">{item.label}</span>
                    <span className={`px-2 py-0.5 rounded text-xs border ${item.color}`}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      {BILLING_ENABLED && (
        <section id="pricing" className="py-24 bg-neutral-50/50">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight mb-4">Simple Pricing</h2>
              <p className="text-neutral-500">Scale your testing as you grow.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-8 flex flex-col hover:shadow-lg transition-shadow">
                <div className="mb-8">
                  <h3 className="font-bold text-xl mb-1">FREE</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tighter">$0</span>
                    <span className="text-neutral-400 text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {["1 Inbox", "100 emails / month", "20 HTML checks / month", "7-day retention"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-neutral-600">
                      <Check className="w-4 h-4 text-neutral-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className="w-full border border-neutral-900 py-3 rounded-lg font-bold text-sm hover:bg-neutral-900 hover:text-white transition-all text-center block"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro */}
              <div className="bg-neutral-900 text-white border border-neutral-800 rounded-2xl p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  Coming Soon
                </div>
                <div className="mb-8">
                  <h3 className="font-bold text-xl mb-1">PRO</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tighter">$19</span>
                    <span className="text-neutral-400 text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {["Unlimited inboxes", "Unlimited emails", "Unlimited HTML checks", "30-day retention"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-neutral-300">
                      <Check className="w-4 h-4 text-neutral-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="w-full bg-white text-neutral-900 py-3 rounded-lg font-bold text-sm hover:bg-neutral-100 transition-all">
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-neutral-50/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold tracking-tight mb-16 text-center">How it works</h2>
          <div className="space-y-12">
            {[
              {
                step: "1",
                title: "Sign up — get your inbox",
                description: "Sign up and your inbox is ready instantly. Copy your unique SMTP credentials from the dashboard.",
              },
              {
                step: "2",
                title: "Paste in your .env",
                description: "Swap your production SMTP credentials with the MailFail credentials. Your app sends emails to MailFail instead of real recipients.",
              },
              {
                step: "3",
                title: "Catch and inspect",
                description: "Every test email appears in your inbox in real-time. View HTML preview, check links, inspect headers, and see the full validation report.",
              },
              {
                step: "4",
                title: "Go to production",
                description: "When you're ready, swap the credentials back to your production provider. No code changes needed — just update your .env.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-neutral-900 text-white rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Docs / Quick Start */}
      <section id="docs" className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold tracking-tight mb-6 text-center">Quick Start</h2>
          <p className="text-neutral-500 text-center mb-12">Get up and running in under a minute.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* SMTP Config */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                SMTP Configuration
              </h3>
              <p className="text-neutral-500 text-sm mb-4">Add these environment variables to your project:</p>
              <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm text-neutral-300 space-y-1">
                <div><span className="text-neutral-500">EMAIL_SMTP_HOST=</span>localhost</div>
                <div><span className="text-neutral-500">EMAIL_SMTP_PORT=</span>2525</div>
                <div><span className="text-neutral-500">EMAIL_SMTP_USERNAME=</span><span className="text-amber-400">your-inbox-username</span></div>
                <div><span className="text-neutral-500">EMAIL_SMTP_PASSWORD=</span><span className="text-amber-400">your-inbox-password</span></div>
              </div>
            </div>

            {/* Nodemailer Example */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Nodemailer Example
              </h3>
              <p className="text-neutral-500 text-sm mb-4">Works with any SMTP client. Here's Nodemailer:</p>
              <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm text-neutral-300 space-y-1">
                <div><span className="text-blue-400">const</span> transport = nodemailer.createTransport({"{"}</div>
                <div className="pl-4">host: process.env.<span className="text-amber-400">EMAIL_SMTP_HOST</span>,</div>
                <div className="pl-4">port: process.env.<span className="text-amber-400">EMAIL_SMTP_PORT</span>,</div>
                <div className="pl-4">auth: {"{"}</div>
                <div className="pl-8">user: process.env.<span className="text-amber-400">EMAIL_SMTP_USERNAME</span>,</div>
                <div className="pl-8">pass: process.env.<span className="text-amber-400">EMAIL_SMTP_PASSWORD</span>,</div>
                <div className="pl-4">{"}"},</div>
                <div>{"}"});</div>
              </div>
            </div>
          </div>

          {/* Validation Checks */}
          <div className="mt-8 bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Validation Checks
            </h3>
            <p className="text-neutral-500 text-sm mb-6">Every email and HTML upload is automatically checked for:</p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name: "Link Check", desc: "Verifies all links are reachable, follows redirects, flags broken URLs" },
                { name: "Image Check", desc: "Tests image reachability, flags oversized files and missing dimensions" },
                { name: "Spam Score", desc: "Checks for unsubscribe links, image-to-text ratio, trigger words" },
                { name: "HTML Validation", desc: "Detects unclosed tags, missing alt attributes, deprecated elements" },
                { name: "Client Compatibility", desc: "Flags CSS not supported in Outlook, Gmail, Yahoo, Apple Mail" },
                { name: "Accessibility", desc: "WCAG contrast checks, heading structure, descriptive link text" },
              ].map((check) => (
                <div key={check.name} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <h4 className="font-semibold text-sm mb-1">{check.name}</h4>
                  <p className="text-neutral-500 text-xs leading-relaxed">{check.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* HTML Check */}
          <div className="mt-8 bg-white border border-neutral-200 rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Standalone HTML Check
            </h3>
            <p className="text-neutral-500 text-sm mb-4">
              Don't want to use SMTP? You can also validate HTML directly:
            </p>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Upload an .html file</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Paste raw HTML</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Fetch from a URL</li>
            </ul>
            <p className="text-neutral-400 text-xs mt-4">
              Perfect for validating newsletters, email templates, or transactional emails without setting up SMTP.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto py-12 px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-neutral-900">MailFail</span>
            <span className="text-xs text-neutral-500">© 2026 MailFail. Built for developers.</span>
          </div>
          <div className="flex items-center gap-6">
            <a className="text-xs text-neutral-500 hover:underline" href="#features">Features</a>
            <a className="text-xs text-neutral-500 hover:underline" href="#how-it-works">How it works</a>
            <a className="text-xs text-neutral-500 hover:underline" href="#docs">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
