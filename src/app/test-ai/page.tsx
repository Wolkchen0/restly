import ChatBot from "@/components/ChatBot";

export default function TestAIPage() {
    return (
        <div style={{ minHeight: "100vh", padding: "40px", backgroundColor: "#050505", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1 style={{ color: "#E8C96E", fontSize: "32px", marginBottom: "16px" }}>Restly AI Sandbox / Test Alanı</h1>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.6", marginBottom: "32px" }}>
                    Bu sayfa bizim deneme (sandbox) ve yedek test alanımızdır. Restly AI ile ilgili yapacağımız tüm testleri, yeni özellikleri veya değiştireceğimiz kodları ana projeyi bozmadan önce burada deneyebiliriz.
                </p>

                <div style={{ padding: "32px", border: "2px dashed rgba(201,168,76,0.3)", borderRadius: "16px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                    <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "#fff" }}>🧪 Aktif Test Alanı</h2>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                        {/* Yeni test kodlarımızı veya bileşenlerimizi buraya yazacağız */}
                        Test edilecek komponentler ve yapılar buraya yerleştirilecek...
                    </p>
                </div>
            </div>

            {/* Sağ altta Test AI balonu olarak kalmaya devam edecek */}
            <ChatBot />
        </div>
    );
}
