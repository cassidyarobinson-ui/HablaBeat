import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HablaBeat — Privacy Policy",
  description: "How HablaBeat handles your data.",
}

const wrap: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  padding: "48px 22px 80px",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: "#1f2733",
  lineHeight: 1.6,
}

export default function PrivacyPage() {
  return (
    <main style={{ background: "#faf8ff", minHeight: "100vh" }}>
      <div style={wrap}>
        <p style={{ marginBottom: 4 }}>
          <a href="/" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>
            ← HablaBeat
          </a>
        </p>
        <h1 style={{ fontSize: "2rem", margin: "12px 0 4px" }}>HablaBeat Privacy Policy</h1>
        <p style={{ color: "#6b7280", marginTop: 0 }}>
          <strong>Last updated:</strong> May 22, 2026
        </p>

        <p>
          HablaBeat is a Spanish language learning app that teaches vocabulary through music-based
          games. This policy explains what data the app uses, where it goes, and what it doesn&apos;t do.
        </p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>What HablaBeat collects</h2>
        <p>
          <strong>Nothing personally identifying.</strong> HablaBeat does not require an account,
          login, email, or phone number. There is no tracking pixel, no advertising network, and no
          third-party analytics built in.
        </p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>What HablaBeat stores on your device</h2>
        <ul>
          <li>Game progress (which songs you&apos;ve played, scores, coins collected)</li>
          <li>Volume and game mode preferences (Slower / Normal / Key Words)</li>
        </ul>
        <p>This data lives only on your device. If you uninstall the app, it&apos;s gone.</p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>Audio and content</h2>
        <p>
          HablaBeat plays Spanish-language songs and shows lyric translations. The audio and lyrics
          are stored within the app or streamed from HablaBeat&apos;s servers.
        </p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>What HablaBeat accesses</h2>
        <ul>
          <li><strong>Internet connection</strong> — to load songs and game content</li>
          <li><strong>Device storage</strong> — to cache song timing data and progress</li>
        </ul>
        <p>HablaBeat does NOT access your microphone, camera, location, contacts, or photos.</p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>Children&apos;s privacy</h2>
        <p>
          HablaBeat is family-friendly and rated 4+. The app does not knowingly collect information
          from anyone, including children under 13. There are no chat features, no user-generated
          content, and no way for users to communicate with each other.
        </p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>Third-party services</h2>
        <p>
          HablaBeat uses Vercel for web hosting and Capacitor as the iOS wrapper framework. Neither
          receives any personal data about you from this app.
        </p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>Changes to this policy</h2>
        <p>
          If this policy changes, the updated version will be posted at the same URL with a new
          &quot;Last updated&quot; date.
        </p>

        <h2 style={{ fontSize: "1.25rem", marginTop: 32 }}>Contact</h2>
        <p>
          For privacy questions, email{" "}
          <a href="mailto:cassidyarobinson@gmail.com" style={{ color: "#7c3aed" }}>
            cassidyarobinson@gmail.com
          </a>
          .
        </p>

        <p style={{ color: "#9ca3af", fontSize: "0.9rem", marginTop: 40 }}>
          HablaBeat is built and maintained as an independent project to make Spanish language
          learning fun and accessible through music.
        </p>
      </div>
    </main>
  )
}
