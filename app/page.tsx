"use client";

import { useState, useEffect, useCallback } from "react";

const CAPTCHA_WORDS: [string, string][] = [
  ["Qbiterc", "the"],
  ["faucet", "node"],
  ["solana", "hype"],
  ["crypto", "claim"],
  ["wallet", "free"],
  ["token", "send"],
  ["block", "chain"],
  ["phantom", "now"],
];

export default function Home() {
  const [captchaPair, setCaptchaPair] = useState<[string, string]>(["", ""]);
  const [captchaInput, setCaptchaInput] = useState("");
  const [solAddress, setSolAddress] = useState("");
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateCaptcha = useCallback(() => {
    const pair =
      CAPTCHA_WORDS[Math.floor(Math.random() * CAPTCHA_WORDS.length)];
    setCaptchaPair(pair);
    setCaptchaInput("");
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  async function handleClaim() {
    const addr = solAddress.trim();
    const userInput = captchaInput.trim().toLowerCase();
    const answer = (captchaPair[0] + " " + captchaPair[1]).toLowerCase();

    if (!addr) {
      setMsgOk(false);
      setMsg("Please enter your Solana wallet address.");
      return;
    }

    if (addr.length < 32 || addr.length > 44) {
      setMsgOk(false);
      setMsg(
        "That does not look like a valid Solana address. Please check and try again."
      );
      return;
    }

    if (!userInput || userInput !== answer) {
      setMsgOk(false);
      setMsg("Captcha incorrect. Please try again.");
      generateCaptcha();
      return;
    }

    // Call the backend API
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: addr }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsgOk(false);
        setMsg(data.error || "Something went wrong. Please try again.");
      } else {
        setMsgOk(true);
        setMsg(
          `Success! $0.05 worth of $HYPE sent to ${addr.slice(0, 6)}...${addr.slice(-4)}. TX: `
        );
        // We'll append the link in the render
        setMsg(
          `Success! $0.05 worth of $HYPE sent to ${addr.slice(0, 6)}...${addr.slice(-4)}. View on Solscan: ${data.explorer}`
        );
      }
    } catch {
      setMsgOk(false);
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
      generateCaptcha();
    }
  }

  return (
    <>
      <div id="topbar">hype-faucet.io</div>
      <div id="wrap">
        {/* Sidebar */}
        <div id="sidebar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/faucet.png"
            alt="Hype Faucet"
            width={110}
            style={{ marginBottom: 10, display: "block" }}
          />
          <div className="balance">$0 available</div>
          <div className="other-sites-label">Other Sites:</div>
          <a href="#">Solana.com</a>
          <a href="#">CoinGecko.com</a>
          <a href="#">Phantom.app</a>
        </div>

        {/* Main */}
        <div id="main">
          <h1>Free Hype</h1>
          <h2>Get Hype from the Hype Faucet</h2>
          <p>
            I&apos;m giving away Hype to each visitor; just solve the captcha
            then enter your Solana Receiving address and press Get Some:
          </p>

          <div className="notice">
            <strong>Note:</strong> Each wallet can claim <strong>once</strong>.
            Each network/IP can also claim <strong>once</strong>. Each claim
            sends <strong>$0.05 worth of $HYPE</strong> to your wallet.
          </div>

          {/* Captcha */}
          <div className="captcha-box">
            <div className="captcha-text">
              <span>{captchaPair[0]}</span>
              <span>{captchaPair[1]}</span>
            </div>
            <div className="captcha-bottom">
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Type the two words:"
              />
              <div className="captcha-icons">
                <span title="Refresh" onClick={generateCaptcha}>
                  ↻
                </span>
                <span title="Audio">🔊</span>
              </div>
              <div className="recaptcha-badge">
                <strong>reCAPTCHA</strong>
                stop spam.
                <br />
                read books.
              </div>
            </div>
          </div>

          {/* Address row */}
          <div className="address-row">
            <label>Your Solana Address:</label>
            <input
              type="text"
              value={solAddress}
              onChange={(e) => setSolAddress(e.target.value)}
              placeholder="Enter Solana wallet address"
            />
            <button
              className="btn-get"
              onClick={handleClaim}
              disabled={loading}
            >
              {loading ? "Sending..." : "Get Some!"}
            </button>
          </div>

          {/* Message */}
          <div id="msg" className={msgOk ? "ok" : ""}>
            {msg}
          </div>

          <hr />

          <h3>What is Hype?</h3>
          <p>
            Hype is a new kind of money on the Solana blockchain. It isn&apos;t
            created or controlled by a government (like dollars or euros) —
            it&apos;s created and controlled by anyone who wants to be part of
            the Hype network. Hype recently crossed Solana in price, making it
            one of the biggest stories in crypto right now. Visit{" "}
            <a href="#">Solana.com</a> for all the technical details.
          </p>

          <h3>How do I get a Solana Receiving Address?</h3>
          <p>
            Download and install the <a href="#">Phantom Wallet</a> from
            phantom.app. After setup, your Solana address will be shown at the
            top of the wallet. Copy it and paste it above.
          </p>

          <h3>What is the Hype Faucet token?</h3>
          <p>
            The <strong>Hype Faucet</strong> token is our own token on Solana.
            Holders of the Hype Faucet token get benefits and rewards in our
            ecosystem.
          </p>

          <h3>Is this legitimate?</h3>
          <p>
            Yes. We are distributing $0.05 worth of $HYPE per claim, per wallet,
            funded from the Hype Faucet treasury. This faucet exists to get Hype
            tokens into as many hands as possible during launch.
          </p>
        </div>
      </div>
    </>
  );
}
