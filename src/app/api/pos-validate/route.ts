import { NextResponse } from "next/server";

// Real POS API validation endpoints
const POS_VALIDATORS: Record<string, (fields: Record<string, string>) => Promise<{ ok: boolean; message: string }>> = {

    // ── SQUARE ── (Easiest to validate — public API, instant key)
    square: async (fields) => {
        const token = fields.posApiKey;
        const locationId = fields.posLocationId;

        if (!token || !locationId) return { ok: false, message: "Access Token and Location ID are required." };

        try {
            // Try to fetch location info using the provided token
            const res = await fetch(`https://connect.squareup.com/v2/locations/${locationId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Square-Version": "2024-01-18",
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                const data = await res.json();
                const locName = data.location?.name || "Unknown";
                return { ok: true, message: `Connected to "${locName}" via Square.` };
            }

            if (res.status === 401) return { ok: false, message: "Invalid Access Token. Check your Square Developer Dashboard." };
            if (res.status === 404) return { ok: false, message: "Location ID not found. Verify the Location ID in your Square Dashboard." };

            return { ok: false, message: `Square returned error ${res.status}. Please verify your credentials.` };
        } catch (e: any) {
            return { ok: false, message: `Network error: ${e.message}. Check your internet connection.` };
        }
    },

    // ── CLOVER ── 
    clover: async (fields) => {
        const token = fields.posApiKey;
        const merchantId = fields.posLocationId;

        if (!token || !merchantId) return { ok: false, message: "API Token and Merchant ID are required." };

        try {
            // Clover API - fetch merchant info
            const res = await fetch(`https://api.clover.com/v3/merchants/${merchantId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                const data = await res.json();
                const name = data.name || "Unknown";
                return { ok: true, message: `Connected to "${name}" via Clover.` };
            }

            if (res.status === 401) return { ok: false, message: "Invalid API Token. Generate a new token from your Clover Developer Dashboard." };
            if (res.status === 404) return { ok: false, message: "Merchant ID not found. Check your Clover account settings." };

            return { ok: false, message: `Clover returned error ${res.status}. Verify your credentials.` };
        } catch (e: any) {
            return { ok: false, message: `Network error: ${e.message}` };
        }
    },

    // ── TOAST ── (Requires OAuth — we validate format only, real connection needs partner approval)
    toast: async (fields) => {
        const apiKey = fields.posApiKey;
        const guid = fields.posLocationId;

        if (!apiKey || !guid) return { ok: false, message: "API Key and Restaurant GUID are required." };

        // Toast uses OAuth2 — partner program required
        // Validate key format at minimum
        if (apiKey.length < 20) return { ok: false, message: "API Key seems too short. Toast keys are typically 32+ characters." };
        if (guid.length < 10) return { ok: false, message: "Restaurant GUID seems too short. Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" };

        // Try Toast API (requires partner credentials)
        try {
            const res = await fetch(`https://ws-api.toasttab.com/restaurants/v1/restaurants/${guid}`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Toast-Restaurant-External-ID": guid,
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                return { ok: true, message: "Toast connection verified successfully." };
            }
            if (res.status === 401 || res.status === 403) {
                return { ok: false, message: "Authentication failed. Toast requires Partner Program approval. Apply at doc.toasttab.com." };
            }
            return { ok: false, message: `Toast returned ${res.status}. Ensure you have Partner Program access.` };
        } catch (e: any) {
            return { ok: false, message: "Could not reach Toast API. This POS requires Partner Program enrollment." };
        }
    },

    // ── LIGHTSPEED ──
    lightspeed: async (fields) => {
        const clientId = fields.posApiKey;
        const clientSecret = fields.posSecretKey;

        if (!clientId || !clientSecret) return { ok: false, message: "Client ID and Client Secret are required." };
        if (clientId.length < 10) return { ok: false, message: "Client ID seems too short." };
        if (clientSecret.length < 10) return { ok: false, message: "Client Secret seems too short." };

        // Lightspeed uses OAuth2 — try token exchange
        try {
            const res = await fetch("https://cloud.lightspeedapp.com/oauth/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
            });

            if (res.ok) return { ok: true, message: "Lightspeed credentials verified." };
            if (res.status === 401) return { ok: false, message: "Invalid Client ID or Secret. Check your Lightspeed Developer Dashboard." };
            return { ok: false, message: `Lightspeed returned ${res.status}. Verify your credentials.` };
        } catch (e: any) {
            return { ok: false, message: `Could not reach Lightspeed API: ${e.message}` };
        }
    },

    // ── REVEL ──
    revel: async (fields) => {
        const apiKey = fields.posApiKey;
        const apiSecret = fields.posSecretKey;
        const estId = fields.posLocationId;

        if (!apiKey || !apiSecret) return { ok: false, message: "API Key and API Secret are required." };
        if (!estId) return { ok: false, message: "Establishment ID is required." };

        // Revel uses key/secret header auth
        try {
            const res = await fetch(`https://api.revelsystems.com/enterprise/Establishment/${estId}/`, {
                headers: {
                    "API-KEY": apiKey,
                    "API-SECRET": apiSecret,
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) return { ok: true, message: "Revel Systems connection verified." };
            if (res.status === 401 || res.status === 403) return { ok: false, message: "Invalid API credentials. Check Revel Management Console → Settings → API Keys." };
            return { ok: false, message: `Revel returned ${res.status}. Verify your credentials.` };
        } catch (e: any) {
            return { ok: false, message: `Could not reach Revel API: ${e.message}` };
        }
    },
};

export async function POST(req: Request) {
    try {
        const { posProvider, fields } = await req.json();

        if (!posProvider || posProvider === "manual") {
            return NextResponse.json({ ok: false, message: "No POS selected." }, { status: 400 });
        }

        const validator = POS_VALIDATORS[posProvider];
        if (!validator) {
            return NextResponse.json({ ok: false, message: `Unsupported POS: ${posProvider}` }, { status: 400 });
        }

        const result = await validator(fields);
        return NextResponse.json(result, { status: result.ok ? 200 : 422 });
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: `Validation error: ${e.message}` }, { status: 500 });
    }
}
