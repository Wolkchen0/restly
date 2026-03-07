async function ask(question) {
    console.log(`\n🗣️ USER: ${question}`);
    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
        });

        if (!response.ok) {
            console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
            console.log(await response.text());
            return;
        }

        const text = await response.text();
        const lines = text.split('\n');

        // Very basic Vercel AI stream parser for the CLI testing
        let textOutput = '';
        for (const line of lines) {
            if (line.startsWith('0:')) {
                try { textOutput += JSON.parse(line.substring(2)) } catch (e) { }
            }
        }

        console.log(`🤖 AI: ${textOutput.trim() ? textOutput : 'No direct text. Streamed tools: ' + text.substring(0, 100) + '...'}`);
    } catch (e) {
        console.log(`❌ Error: ${e.message}`);
    }
}

async function runTests() {
    console.log("=== BEGINNING E2E API CHAT TESTS ===");
    await ask("what is my profit today");
    await ask("Is there any bottleneck in the kitchen");
    await ask("What happened in yesterday's shift");
    console.log("\n=== TESTS COMPLETE ===");
}

runTests();
