import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HablaBeat — Support",
  description: "Get help with HablaBeat.",
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

const card: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #ece6fb",
  borderRadius: 14,
  padding: "22px 24px",
  marginBottom: 20,
}

export default function SupportPage() {
  return (
    <main style={{ background: "#faf8ff", minHeight: "100vh" }}>
      <div style={wrap}>
        <p style={{ marginBottom: 4 }}>
          <a href="/" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>
            ← HablaBeat
          </a>
        </p>
        <h1 style={{ fontSize: "2rem", margin: "12px 0 4px" }}>HablaBeat Support</h1>
        <p style={{ color: "#6b7280", marginTop: 0 }}>Learn Spanish through music. We&apos;re here to help.</p>

        <div style={card}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Need help?</h2>
          <p>
            Questions, problems, or feedback about HablaBeat? Email us — we read every message and
            aim to reply within 2 business days.
          </p>
          <a
            href="mailto:cassidyarobinson@gmail.com?subject=HablaBeat%20Support"
            style={{
              display: "inline-block",
              background: "#7c3aed",
              color: "#fff",
              textDecoration: "none",
              padding: "12px 22px",
              borderRadius: 10,
              fontWeight: 700,
              marginTop: 6,
            }}
          >
            Email Support
          </a>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", marginTop: 12 }}>
            cassidyarobinson@gmail.com
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Frequently asked questions</h2>

          <p style={{ fontWeight: 700, marginBottom: 2 }}>How do I play?</p>
          <p style={{ color: "#4b5563", marginTop: 0 }}>
            Pick a song, then tap <strong>¡Vamos!</strong> to play the bubble-pop game or the 🎤 mic
            button to sing along with the lyrics. Catch the right Spanish words to score.
          </p>

          <p style={{ fontWeight: 700, marginBottom: 2 }}>Is there a cost?</p>
          <p style={{ color: "#4b5563", marginTop: 0 }}>
            HablaBeat is free. There are no ads and no accounts.
          </p>

          <p style={{ fontWeight: 700, marginBottom: 2 }}>Does it work offline?</p>
          <p style={{ color: "#4b5563", marginTop: 0 }}>
            The songs are bundled in the app, so the games work without a connection. Some extra
            content may need internet.
          </p>

          <p style={{ fontWeight: 700, marginBottom: 2 }}>Is my progress saved?</p>
          <p style={{ color: "#4b5563", marginTop: 0 }}>
            Yes — your scores, coins, and preferences are stored on your device. They&apos;re removed
            if you delete the app.
          </p>

          <p style={{ fontWeight: 700, marginBottom: 2 }}>How do I report a bug or request a feature?</p>
          <p style={{ color: "#4b5563", marginTop: 0 }}>
            Email us at cassidyarobinson@gmail.com with what you expected, what happened, and your
            device model if relevant.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0 }}>Privacy</h2>
          <p>
            HablaBeat doesn&apos;t collect personal data. Read the full{" "}
            <a href="/privacy" style={{ color: "#7c3aed" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </main>
  )
}
