async function testSignup() {
    const res = await fetch("https://restly-delta.vercel.app/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Wolkchen", email: "ihsanduygu357@gmail.com", password: "password123", location: "Milpitas" })
    });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log("Response:", text);
}
testSignup();
