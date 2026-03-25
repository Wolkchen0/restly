interface WelcomeEmailProps {
    restaurantName: string;
    email: string;
    loginUrl: string;
}

export function WelcomeEmail({ restaurantName, email, loginUrl }: WelcomeEmailProps): string {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);
    const trialEndFormatted = trialEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Restly</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER / LOGO -->
          <tr>
            <td align="center" style="padding:0 0 32px 0;">
              <div style="display:inline-block;background:linear-gradient(135deg,#1a1506,#2a2008);border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:14px 28px;">
                <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#E8C96E;">✦ Restly</span>
              </div>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background:#141420;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

              <!-- Gold top bar -->
              <div style="height:4px;background:linear-gradient(90deg,#C9A84C,#E8C96E,#C9A84C);"></div>

              <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 40px 32px;">

                <!-- Greeting emoji -->
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="font-size:52px;line-height:1;">🎉</div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                      Welcome to Restly,<br/>
                      <span style="background:linear-gradient(135deg,#E8C96E,#C9A84C);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${restaurantName}!</span>
                    </h1>
                  </td>
                </tr>

                <!-- Subtitle -->
                <tr>
                  <td align="center" style="padding-bottom:32px;">
                    <p style="margin:0;font-size:16px;color:#8b8b9e;line-height:1.6;max-width:440px;">
                      Your AI-powered restaurant manager is ready. You have <strong style="color:#E8C96E;">30 days free</strong> to explore everything Restly can do.
                    </p>
                  </td>
                </tr>

                <!-- Trial badge -->
                <tr>
                  <td align="center" style="padding-bottom:36px;">
                    <div style="display:inline-block;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.3);border-radius:50px;padding:10px 24px;">
                      <span style="font-size:13px;font-weight:700;color:#E8C96E;letter-spacing:0.5px;">
                        ⏳ FREE TRIAL · Ends ${trialEndFormatted}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Features list -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:8px;">
                      <tr>
                        <td style="padding:0;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            ${[
            ["🤖", "AI Manager Chatbot", "Ask about guests, stock & scheduling in plain English"],
            ["👤", "Guest Intelligence", "Full guest profiles from OpenTable, synced automatically"],
            ["📦", "Live Inventory", "Real-time stock alerts from Toast POS before service"],
            ["📅", "Smart Scheduling", "Time-off requests via Google Forms, conflict detection"],
        ].map(([icon, title, desc]) => `
                            <tr>
                              <td style="padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.05);">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="36" style="vertical-align:top;padding-top:2px;">
                                      <span style="font-size:20px;">${icon}</span>
                                    </td>
                                    <td>
                                      <div style="font-size:14px;font-weight:700;color:#ffffff;margin-bottom:2px;">${title}</div>
                                      <div style="font-size:12px;color:#6b6b7e;">${desc}</div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>`).join("")}
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#C9A84C,#E8C96E);color:#1a1000;font-size:16px;font-weight:800;text-decoration:none;border-radius:12px;padding:16px 40px;letter-spacing:0.3px;">
                      Open Your Dashboard →
                    </a>
                  </td>
                </tr>

                <!-- Account info -->
                <tr>
                  <td align="center" style="padding-bottom:0;">
                    <p style="margin:0;font-size:13px;color:#4a4a5e;">
                      Logged in as: <span style="color:#8b8b9e;">${email}</span>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- 3 QUICK STEPS -->
          <tr>
            <td style="padding:24px 0 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <p style="margin:0;font-size:13px;font-weight:700;color:#4a4a5e;text-transform:uppercase;letter-spacing:1px;">GET STARTED IN 3 STEPS</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        ${[
            ["1", "Connect OpenTable", "Settings → paste your API credentials"],
            ["2", "Connect Toast POS", "Settings → add your POS API key"],
            ["3", "Ask the AI anything", "Open the chat and ask about tonight"],
        ].map(([num, title, desc]) => `
                        <td width="33%" style="padding:0 6px;vertical-align:top;">
                          <div style="background:#141420;border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:18px 14px;text-align:center;">
                            <div style="width:32px;height:32px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.25);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px;">
                              <span style="font-size:13px;font-weight:800;color:#C9A84C;">${num}</span>
                            </div>
                            <div style="font-size:13px;font-weight:700;color:#ffffff;margin-bottom:4px;">${title}</div>
                            <div style="font-size:11px;color:#4a4a5e;line-height:1.5;">${desc}</div>
                          </div>
                        </td>`).join("")}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <p style="margin:0 0 8px;font-size:12px;color:#2e2e3e;">
                © 2026 Restly · AI Restaurant Management Platform
              </p>
              <p style="margin:0;font-size:11px;color:#2e2e3e;">
                CCPA/CPRA Compliant · Built for California Restaurants
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
