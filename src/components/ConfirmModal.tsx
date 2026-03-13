"use client";
import { useState, useCallback, createContext, useContext, ReactNode } from "react";

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
}

interface ConfirmContextType {
    showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ showConfirm: () => Promise.resolve(false) });

export function useConfirm() {
    return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolve, setResolve] = useState<((val: boolean) => void) | null>(null);

    const showConfirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((res) => {
            setOptions(opts);
            setResolve(() => res);
        });
    }, []);

    const handleResponse = (val: boolean) => {
        resolve?.(val);
        setOptions(null);
        setResolve(null);
    };

    return (
        <ConfirmContext.Provider value={{ showConfirm }}>
            {children}
            {options && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 9999,
                    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "fadeIn 0.15s ease",
                }} onClick={() => handleResponse(false)}>
                    <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } } @keyframes scaleIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:none } }`}</style>
                    <div onClick={e => e.stopPropagation()} style={{
                        background: "linear-gradient(180deg, #141424 0%, #0e0e1c 100%)",
                        border: `1px solid ${options.danger ? "rgba(239,68,68,0.25)" : "rgba(201,168,76,0.2)"}`,
                        borderRadius: 20, padding: "28px 32px", width: "min(400px, 85vw)",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
                        animation: "scaleIn 0.2s ease",
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 22 }}>{options.danger ? "⚠️" : "💬"}</span>
                            {options.title}
                        </div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 24 }}>
                            {options.message}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => handleResponse(false)} style={{
                                flex: 1, padding: "12px 16px",
                                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600,
                                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                            }}>{options.cancelLabel || "Cancel"}</button>
                            <button onClick={() => handleResponse(true)} style={{
                                flex: 1, padding: "12px 16px",
                                background: options.danger
                                    ? "linear-gradient(135deg, rgba(239,68,68,0.8), rgba(220,38,38,0.9))"
                                    : "linear-gradient(135deg, #C9A84C, #E8C96E)",
                                border: "none", borderRadius: 12,
                                color: options.danger ? "#fff" : "#1a1000",
                                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                                transition: "all 0.15s",
                            }}>{options.confirmLabel || "Confirm"}</button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
