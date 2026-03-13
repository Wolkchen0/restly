"use client";
import { useState, useEffect } from "react";

const FORM_TIME_ENTRY = "/forms/time-entry";
const FORM_TIME_OFF = "/forms/time-off";

const STATUS_CLASS: Record<string, string> = {
    PENDING: "badge-yellow", APPROVED: "badge-green", DENIED: "badge-red",
};

const DEMO_REQUESTS = [
    { id: "req1", employeeName: "Sarah Jenkins", employeeRole: "Server", startDate: "2026-03-12", endDate: "2026-03-14", reason: "Family event out of town", status: "PENDING", formSource: 2 },
    { id: "req2", employeeName: "Marcus Torres", employeeRole: "Bartender", startDate: "2026-04-01", endDate: "2026-04-05", reason: "Vacation to Miami", status: "APPROVED", formSource: 2 },
    { id: "req3", employeeName: "David Chen", employeeRole: "Line Cook", startDate: "2026-03-10", endDate: "2026-03-10", reason: "Doctor appointment", status: "DENIED", formSource: 2 },
    { id: "req4", employeeName: "Lisa Park", employeeRole: "Hostess", startDate: "2026-03-08", endDate: "2026-03-08", reason: "Forgot to clock in yesterday morning shift", status: "PENDING", formSource: 1 },
];

// ─── SCHEDULE DATA ──────────────────────────────────────────────────────────
// L = Lunch, D = Dinner — standard restaurant industry convention
type ShiftType = "L" | "D" | "FULL" | "OFF" | "";
interface Employee {
    name: string;
    position: string;
    department: "Kitchen" | "FOH" | "Bar";
}
interface ShiftEntry {
    type: ShiftType;
    startTime: string;
    endTime: string;
    role?: string; // e.g. "Junior Bar", "Freshman BAR", "OC" (On Call)
    shift2Start?: string;
    shift2End?: string;
}

const DEPT_COLORS: Record<string, { bg: string; border: string; text: string; headerBg: string }> = {
    Kitchen: { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", text: "#f87171", headerBg: "rgba(239,68,68,0.15)" },
    FOH: { bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.2)", text: "#60a5fa", headerBg: "rgba(96,165,250,0.15)" },
    Bar: { bg: "rgba(250,204,21,0.06)", border: "rgba(250,204,21,0.2)", text: "#facc15", headerBg: "rgba(250,204,21,0.15)" },
};

const SHIFT_COLORS: Record<ShiftType, { bg: string; text: string }> = {
    L: { bg: "rgba(74,222,128,0.12)", text: "#4ade80" },
    D: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa" },
    FULL: { bg: "rgba(250,204,21,0.12)", text: "#facc15" },
    OFF: { bg: "rgba(248,113,113,0.08)", text: "#f87171" },
    "": { bg: "transparent", text: "rgba(255,255,255,0.15)" },
};

// Restaurant industry positions
const POSITION_OPTIONS: Record<string, string[]> = {
    Kitchen: ["Head Chef", "Sous Chef", "Line Cook", "Prep Cook", "Dishwasher", "Pastry Chef", "Garde Manger"],
    FOH: ["Server", "Hostess", "Busser", "Runner", "Expo", "Captain", "Host"],
    Bar: ["Head Bartender", "Bartender", "Barback", "Junior Bar", "Freshman BAR", "Fresh BART."],
};

const ROLE_LABELS = ["", "Junior Bar", "Freshman BAR", "Fresh BART.", "OC"];

const INITIAL_EMPLOYEES: Employee[] = [
    // Kitchen
    { name: "Marco Rossi", position: "Head Chef", department: "Kitchen" },
    { name: "David Chen", position: "Sous Chef", department: "Kitchen" },
    { name: "Carlos Mendez", position: "Line Cook", department: "Kitchen" },
    { name: "James Wilson", position: "Line Cook", department: "Kitchen" },
    { name: "Anh Nguyen", position: "Prep Cook", department: "Kitchen" },
    { name: "Tony Russo", position: "Dishwasher", department: "Kitchen" },
    // FOH
    { name: "Sarah Jenkins", position: "Server", department: "FOH" },
    { name: "Emily Davis", position: "Server", department: "FOH" },
    { name: "Jessica Brown", position: "Server", department: "FOH" },
    { name: "Lisa Park", position: "Hostess", department: "FOH" },
    { name: "Rachel Kim", position: "Hostess", department: "FOH" },
    { name: "Mike Johnson", position: "Busser", department: "FOH" },
    // Bar
    { name: "Marcus Torres", position: "Head Bartender", department: "Bar" },
    { name: "Alex Rivera", position: "Bartender", department: "Bar" },
    { name: "Nicole Adams", position: "Barback", department: "Bar" },
    { name: "Deniz Taha", position: "Junior Bar", department: "Bar" },
    { name: "Merve K.", position: "Fresh BART.", department: "Bar" },
    { name: "Can", position: "Freshman BAR", department: "Bar" },
    { name: "Onur", position: "Freshman BAR", department: "Bar" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateDefaultSchedule(employees: Employee[]): Record<string, ShiftEntry[]> {
    const schedule: Record<string, ShiftEntry[]> = {};
    employees.forEach(emp => {
        const shifts: ShiftEntry[] = DAYS.map((_, dayIdx) => {
            if (emp.department === "Kitchen") {
                if (dayIdx === 0 || dayIdx === 1) return { type: "OFF" as ShiftType, startTime: "", endTime: "" };
                return { type: "D" as ShiftType, startTime: "4:45 PM", endTime: "10:00 PM", role: "" };
            }
            if (emp.department === "FOH") {
                if (dayIdx === 1 || dayIdx === 2) return { type: "OFF" as ShiftType, startTime: "", endTime: "" };
                if (dayIdx <= 4) return { type: "L" as ShiftType, startTime: "11:00 AM", endTime: "3:00 PM", role: "" };
                return { type: "D" as ShiftType, startTime: "4:45 PM", endTime: "10:00 PM", role: "" };
            }
            // Bar
            if (dayIdx === 0 || dayIdx === 3) return { type: "OFF" as ShiftType, startTime: "", endTime: "" };
            const role = emp.position.includes("Junior") ? "Junior Bar"
                : emp.position.includes("Freshman") ? "Freshman BAR"
                : emp.position.includes("Fresh") ? "Fresh BART." : "";
            return { type: "D" as ShiftType, startTime: "4:45 PM", endTime: "10:00 PM", role };
        });
        schedule[emp.name] = shifts;
    });
    return schedule;
}

function getWeekDates(weekOffset: number = 0): string[] {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
    return DAYS.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
}

function getWeekDateObjects(weekOffset: number = 0): Date[] {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
    return DAYS.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        d.setHours(0, 0, 0, 0);
        return d;
    });
}

export default function SchedulePage() {
    const [data, setData] = useState<any>(null);
    const [localRequests, setLocalRequests] = useState<any[]>([]);
    const [filter, setFilter] = useState("PENDING");
    const [activeTab, setActiveTab] = useState<"schedule" | "timeoff" | "timeentry">("schedule");
    const [copied, setCopied] = useState<string | null>(null);
    const [locationId, setLocationId] = useState<string>("");
    const [isDemo, setIsDemo] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([...INITIAL_EMPLOYEES]);
    const [schedule, setSchedule] = useState<Record<string, ShiftEntry[]>>(() => generateDefaultSchedule(INITIAL_EMPLOYEES));
    const [weekOffset, setWeekOffset] = useState(0);
    const [editCell, setEditCell] = useState<{ empName: string; dayIdx: number } | null>(null);
    const [editShiftType, setEditShiftType] = useState<ShiftType>("L");
    const [editStart, setEditStart] = useState("");
    const [editEnd, setEditEnd] = useState("");
    const [editRole, setEditRole] = useState("");
    const [editShift2Start, setEditShift2Start] = useState("");
    const [editShift2End, setEditShift2End] = useState("");
    const [showShift2, setShowShift2] = useState(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Add / Remove employee
    const [addEmpModal, setAddEmpModal] = useState(false);
    const [newEmpName, setNewEmpName] = useState("");
    const [newEmpDept, setNewEmpDept] = useState<"Kitchen" | "FOH" | "Bar">("FOH");
    const [newEmpPosition, setNewEmpPosition] = useState("");
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    const weekDates = getWeekDates(weekOffset);
    const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); };

    useEffect(() => {
        window.scrollTo(0, 0);
        const loc = localStorage.getItem("restly_active_location");
        if (loc) setLocationId(loc);
        fetch("/api/locations").then(r => r.json()).then(d => {
            const restName = d.restaurantName || "";
            setIsDemo(!!restName);
            if (!!restName) {
                setLocationId("DEMO_RESTLY_12345");
                fetch("/api/timeoff?locId=DEMO_RESTLY_12345").then(res => res.json()).then(tData => {
                    const dbRequests = (tData.requests ?? []).map((r: any) => ({ ...r, formSource: r.type === "TIMEOFF" ? 2 : 1 }));
                    const demoIds = new Set(DEMO_REQUESTS.map(r => r.id));
                    const newFromDB = dbRequests.filter((r: any) => !demoIds.has(r.id));
                    setData({ requests: [...newFromDB, ...DEMO_REQUESTS] });
                    setLocalRequests([...newFromDB, ...DEMO_REQUESTS]);
                }).catch(() => { setData({ requests: DEMO_REQUESTS }); setLocalRequests(DEMO_REQUESTS); });
            } else {
                fetch("/api/timeoff").then(res => res.json()).then(tData => { setData(tData); setLocalRequests(tData.requests ?? []); });
            }
        }).catch(() => { });
    }, []);

    const handleStatusChange = (id: string, newStatus: string) => {
        setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    };

    // Smart time auto-complete: "2" → "2:00 PM", "11" → "11:00 AM"
    const autoCompleteTime = (value: string, context: "start" | "end", startRef?: string): string => {
        const v = value.trim();
        if (!v) return v;
        // Already formatted
        if (/\d{1,2}:\d{2}\s*(AM|PM)/i.test(v)) return v;
        // Just a number like "2", "9", "11"
        const numMatch = v.match(/^(\d{1,2})$/);
        if (numMatch) {
            let h = parseInt(numMatch[1]);
            // Determine AM/PM based on context
            if (context === "end" && startRef) {
                const startMatch = startRef.match(/(\d+).*?(AM|PM)/i);
                if (startMatch) {
                    const startH = parseInt(startMatch[1]);
                    const startPeriod = startMatch[2].toUpperCase();
                    // If end hour < start hour and start is AM, end should be PM
                    if (startPeriod === "AM" && h <= startH && h < 12) return `${h}:00 PM`;
                    if (startPeriod === "PM") return `${h}:00 PM`;
                    return `${h}:00 ${h >= 7 && h <= 11 ? "AM" : "PM"}`;
                }
            }
            // Default: 6-11 is AM, rest is PM for start times
            if (context === "start") return `${h}:00 ${h >= 6 && h <= 11 ? "AM" : "PM"}`;
            return `${h}:00 PM`;
        }
        // Number with colon like "2:30" or "11:00"
        const timeMatch = v.match(/^(\d{1,2}):(\d{2})$/);
        if (timeMatch) {
            const h = parseInt(timeMatch[1]);
            if (context === "start") return `${v} ${h >= 6 && h <= 11 ? "AM" : "PM"}`;
            return `${v} PM`;
        }
        return v;
    };

    const openEditShift = (empName: string, dayIdx: number) => {
        const s = schedule[empName]?.[dayIdx];
        setEditCell({ empName, dayIdx });
        setEditShiftType(s?.type || "L");
        setEditStart(s?.startTime || "11:00 AM");
        setEditEnd(s?.endTime || "3:00 PM");
        setEditRole(s?.role || "");
        setEditShift2Start(s?.shift2Start || "");
        setEditShift2End(s?.shift2End || "");
        setShowShift2(!!(s?.shift2Start && s?.shift2End));
    };
    const saveShift = () => {
        if (!editCell) return;
        // Auto-complete times before saving
        const finalStart = autoCompleteTime(editStart, "start");
        const finalEnd = autoCompleteTime(editEnd, "end", finalStart);
        const finalS2Start = autoCompleteTime(editShift2Start, "start");
        const finalS2End = autoCompleteTime(editShift2End, "end", finalS2Start);
        setSchedule(prev => {
            const updated = { ...prev };
            const shifts = [...(updated[editCell.empName] || [])];
            shifts[editCell.dayIdx] = {
                type: editShiftType,
                startTime: editShiftType === "OFF" ? "" : finalStart,
                endTime: editShiftType === "OFF" ? "" : finalEnd,
                role: editRole,
                shift2Start: editShiftType === "OFF" || !showShift2 ? "" : finalS2Start,
                shift2End: editShiftType === "OFF" || !showShift2 ? "" : finalS2End,
            };
            updated[editCell.empName] = shifts;
            return updated;
        });
        showToast(`✅ Updated ${editCell.empName} — ${DAYS[editCell.dayIdx]}`);
        setEditCell(null);
    };

    const requests = localRequests;
    const tabRequests = requests.filter(r => activeTab === "timeoff" ? r.formSource === 2 : r.formSource === 1);
    const filtered = filter === "ALL" ? tabRequests : tabRequests.filter(r => r.status === filter);
    const weekDateObjects = getWeekDateObjects(weekOffset);

    // Check if employee has approved time-off on a specific day
    const isOnLeave = (empName: string, dayIdx: number): { onLeave: boolean; reason?: string } => {
        const dayDate = weekDateObjects[dayIdx];
        for (const req of localRequests) {
            if (req.status !== "APPROVED" || req.formSource !== 2) continue;
            if (req.employeeName !== empName) continue;
            const start = new Date(req.startDate + "T00:00:00");
            const end = new Date(req.endDate + "T23:59:59");
            if (dayDate >= start && dayDate <= end) return { onLeave: true, reason: req.reason };
        }
        return { onLeave: false };
    };

    // PDF Export
    const exportToPDF = () => {
        const pdfRows: (string | number)[][] = [];
        const sectionRows: number[] = [];

        departments.forEach(dept => {
            const deptLabel = dept === "Kitchen" ? "KITCHEN" : dept === "FOH" ? "FRONT OF HOUSE" : "BAR";
            sectionRows.push(pdfRows.length);
            pdfRows.push([deptLabel, "", "", "", "", "", "", "", ""]);

            employees.filter(e => e.department === dept).forEach(emp => {
                const shifts = schedule[emp.name] || [];
                let totalHrs = 0;
                const dayCells: string[] = DAYS.map((_, dayIdx) => {
                    const leave = isOnLeave(emp.name, dayIdx);
                    if (leave.onLeave) return "LEAVE";
                    const s = shifts[dayIdx];
                    if (!s || !s.type) return "";
                    if (s.type === "OFF") return "OFF";
                    const parseT = (t: string) => { const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = parseInt(m[1]); if (m[3].toUpperCase() === "PM" && h !== 12) h += 12; if (m[3].toUpperCase() === "AM" && h === 12) h = 0; return h + parseInt(m[2]) / 60; };
                    let diff = parseT(s.endTime) - parseT(s.startTime); if (diff < 0) diff += 24;
                    totalHrs += diff;
                    let cellText = `${s.startTime} - ${s.endTime}`;
                    if (s.shift2Start && s.shift2End) {
                        let diff2 = parseT(s.shift2End) - parseT(s.shift2Start); if (diff2 < 0) diff2 += 24;
                        totalHrs += diff2;
                        cellText += `\n${s.shift2Start} - ${s.shift2End}`;
                    }
                    return cellText;
                });
                pdfRows.push([emp.name, emp.position, ...dayCells, totalHrs > 0 ? `${Math.round(totalHrs)}h` : "—"]);
            });
        });

        // Dynamic import to avoid SSR issues
        import("@/utils/pdf-export").then(({ exportToPDF: pdfExport }) => {
            pdfExport({
                title: `Weekly Schedule — ${weekDates[0]} to ${weekDates[6]}`,
                subtitle: `Generated for Sample Rest. — Downtown`,
                headers: ["Employee", "Position", ...DAYS.map((d, i) => `${d}\n${weekDates[i]}`),"Hours"],
                rows: pdfRows,
                sectionRows,
                orientation: "landscape",
                fileName: `Schedule_${weekDates[0].replace(/\//g, '-')}_to_${weekDates[6].replace(/\//g, '-')}`,
            });
            showToast('📥 Schedule PDF exported!');
        });
    };

    function copyLink(url: string, key: string) {
        navigator.clipboard.writeText(url).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
    }

    const departments: ("Kitchen" | "FOH" | "Bar")[] = ["Kitchen", "FOH", "Bar"];

    const addEmployee = () => {
        if (!newEmpName.trim()) return;
        const emp: Employee = { name: newEmpName.trim(), department: newEmpDept, position: newEmpPosition || POSITION_OPTIONS[newEmpDept][0] };
        setEmployees(prev => [...prev, emp]);
        // Create default schedule
        setSchedule(prev => ({
            ...prev,
            [emp.name]: DAYS.map(() => ({ type: "" as ShiftType, startTime: "", endTime: "" })),
        }));
        setAddEmpModal(false);
        setNewEmpName(""); setNewEmpPosition("");
        showToast(`✅ Added ${emp.name} to ${emp.department}`);
    };

    const removeEmployee = (empName: string) => {
        setConfirmRemove(empName);
    };
    const doRemove = () => {
        if (!confirmRemove) return;
        setEmployees(prev => prev.filter(e => e.name !== confirmRemove));
        setSchedule(prev => {
            const u = { ...prev };
            delete u[confirmRemove];
            return u;
        });
        showToast(`🗑️ Removed ${confirmRemove}`);
        setConfirmRemove(null);
    };

    return (
        <>
            <style>{`
                .sched-grid { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
                .sched-grid th { padding: 10px 6px; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); }
                .sched-grid th:first-child { text-align: left; width: 180px; }
                .sched-grid td { padding: 4px 3px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.03); }
                .sched-grid td:first-child { text-align: left; padding-left: 12px; }
                .sched-grid tr:hover { background: rgba(255,255,255,0.015); }
                .shift-cell { border-radius: 6px; padding: 6px 4px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s; line-height: 1.3; min-height: 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .shift-cell:hover { filter: brightness(1.3); transform: scale(1.03); }
                .dept-header td { font-size: 13px !important; font-weight: 800 !important; text-transform: uppercase; letter-spacing: 1px; padding: 10px 12px !important; }
            `}</style>

            {toastMsg && (
                <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200, background: "rgba(10,10,15,0.95)", border: "1px solid #4ade80", color: "#4ade80", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>{toastMsg}</div>
            )}

            {/* CUSTOM CONFIRM MODAL */}
            {confirmRemove && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmRemove(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(180deg, #141424 0%, #0e0e1c 100%)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 20, padding: "28px 32px", width: "min(400px, 85vw)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 22 }}>⚠️</span> Remove Employee
                        </div>
                        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 24 }}>
                            Are you sure you want to remove <strong style={{ color: "#fff" }}>{confirmRemove}</strong> from the schedule? This action cannot be undone.
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setConfirmRemove(null)} style={{ flex: 1, padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={doRemove} style={{ flex: 1, padding: "12px 16px", background: "linear-gradient(135deg, rgba(239,68,68,0.8), rgba(220,38,38,0.9))", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Remove</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SHIFT EDIT MODAL */}
            {editCell && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setEditCell(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 20, padding: "32px 36px", width: 420, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>📅 Edit Shift</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}><strong style={{ color: "#E8C96E" }}>{editCell.empName}</strong> — {DAYS[editCell.dayIdx]} {weekDates[editCell.dayIdx]}</div>

                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Shift Type</label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                                {(["L", "D", "FULL", "OFF"] as ShiftType[]).map(t => (
                                    <button key={t} onClick={() => setEditShiftType(t)} style={{
                                        padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 8, textAlign: "center",
                                        border: editShiftType === t ? `2px solid ${SHIFT_COLORS[t].text}` : "1px solid rgba(255,255,255,0.08)",
                                        background: editShiftType === t ? SHIFT_COLORS[t].bg : "rgba(255,255,255,0.02)",
                                        color: editShiftType === t ? SHIFT_COLORS[t].text : "rgba(255,255,255,0.4)",
                                    }}>{t === "L" ? "L (Lunch)" : t === "D" ? "D (Dinner)" : t || "—"}</button>
                                ))}
                            </div>
                        </div>

                        {editShiftType !== "OFF" && (
                            <>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", marginBottom: 6 }}>Shift 1</div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>Start</label>
                                        <input type="text" value={editStart} onChange={e => setEditStart(e.target.value)} onBlur={e => setEditStart(autoCompleteTime(e.target.value, "start"))} placeholder="11:00 AM" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 15, fontWeight: 700, color: "#4ade80", outline: "none", fontFamily: "inherit" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>End</label>
                                        <input type="text" value={editEnd} onChange={e => setEditEnd(e.target.value)} onBlur={e => setEditEnd(autoCompleteTime(e.target.value, "end", editStart))} placeholder="4:00 PM" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 15, fontWeight: 700, color: "#60a5fa", outline: "none", fontFamily: "inherit" }} />
                                    </div>
                                </div>

                                {!showShift2 ? (
                                    <button onClick={() => { setShowShift2(true); setEditShift2Start("5:00 PM"); setEditShift2End("10:00 PM"); }} style={{ width: "100%", padding: "10px", marginBottom: 16, background: "rgba(167,139,250,0.06)", border: "1px dashed rgba(167,139,250,0.25)", borderRadius: 10, color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add 2nd Shift (Split Shift)</button>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase" }}>Shift 2 (Split)</div>
                                            <button onClick={() => { setShowShift2(false); setEditShift2Start(""); setEditShift2End(""); }} style={{ fontSize: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, color: "#f87171", cursor: "pointer", fontWeight: 700, padding: "4px 10px", fontFamily: "inherit" }}>✕ Remove Shift 2</button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>Start</label>
                                                <input type="text" value={editShift2Start} onChange={e => setEditShift2Start(e.target.value)} onBlur={e => setEditShift2Start(autoCompleteTime(e.target.value, "start"))} placeholder="5:00 PM" style={{ width: "100%", boxSizing: "border-box", background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 15, fontWeight: 700, color: "#a78bfa", outline: "none", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 6 }}>End</label>
                                                <input type="text" value={editShift2End} onChange={e => setEditShift2End(e.target.value)} onBlur={e => setEditShift2End(autoCompleteTime(e.target.value, "end", editShift2Start))} placeholder="10:00 PM" style={{ width: "100%", boxSizing: "border-box", background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 10, padding: "12px 14px", fontSize: 15, fontWeight: 700, color: "#a78bfa", outline: "none", fontFamily: "inherit" }} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {/* Role annotation */}
                        {editShiftType !== "OFF" && (
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Role / Annotation</label>
                                <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ width: "100%", boxSizing: "border-box", background: "#1a1a2a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#E8C96E", fontFamily: "inherit" }}>
                                    {ROLE_LABELS.map(r => <option key={r} value={r}>{r || "(none)"}</option>)}
                                </select>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setEditCell(null)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={saveShift} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg,#C9A84C,#E8C96E)", border: "none", borderRadius: 10, color: "#1a1000", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💾 Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD EMPLOYEE MODAL */}
            {addEmpModal && (
                <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setAddEmpModal(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#12121f", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: "32px 36px", width: 440, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>+ Add Employee</div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Add a team member to the schedule</div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>NAME *</label>
                            <input autoFocus type="text" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} placeholder="e.g. John Smith" style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 15, color: "#fff", outline: "none", fontFamily: "inherit" }} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>DEPARTMENT</label>
                                <select value={newEmpDept} onChange={e => { setNewEmpDept(e.target.value as any); setNewEmpPosition(""); }} style={{ width: "100%", boxSizing: "border-box", background: "#1a1a2a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit" }}>
                                    <option value="Kitchen">Kitchen</option>
                                    <option value="FOH">Front of House</option>
                                    <option value="Bar">Bar</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>POSITION</label>
                                <select value={newEmpPosition} onChange={e => setNewEmpPosition(e.target.value)} style={{ width: "100%", boxSizing: "border-box", background: "#1a1a2a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#fff", fontFamily: "inherit" }}>
                                    {POSITION_OPTIONS[newEmpDept].map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setAddEmpModal(false)} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                            <button onClick={addEmployee} disabled={!newEmpName.trim()} style={{ flex: 1, padding: "12px", background: newEmpName.trim() ? "linear-gradient(135deg,#22c55e,#4ade80)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 10, color: newEmpName.trim() ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 800, cursor: newEmpName.trim() ? "pointer" : "not-allowed", fontFamily: "inherit" }}>✅ Add Employee</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="topbar">
                <div className="topbar-title">Schedule & Forms</div>
                <div className="topbar-right">
                    <a href={`${FORM_TIME_ENTRY}?locId=${locationId || 'DEMO_RESTLY_12345'}`} target="_blank" rel="noopener" className="btn-ghost" style={{ fontSize: 12, textDecoration: "none" }}>Time Entry Fix ↗</a>
                    <a href={`${FORM_TIME_OFF}?locId=${locationId || 'DEMO_RESTLY_12345'}`} target="_blank" rel="noopener" className="btn-ghost" style={{ fontSize: 12, textDecoration: "none" }}>Time Off Request ↗</a>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div style={{ padding: "0 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                <div style={{ display: "flex", gap: 24, maxWidth: 1400, margin: "0 auto" }}>
                    {([
                        { key: "schedule" as const, label: "📅 Weekly Schedule" },
                        { key: "timeoff" as const, label: "🏖️ Time Off Requests" },
                        { key: "timeentry" as const, label: "🕐 Time Entry Fixes" },
                    ]).map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                            background: "none", border: "none", padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                            color: activeTab === t.key ? "#E8C96E" : "rgba(255,255,255,0.4)",
                            borderBottom: activeTab === t.key ? "2px solid #C9A84C" : "2px solid transparent",
                        }}>{t.label}</button>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 28px 80px" }}>

                {/* ═══════════════ WEEKLY SCHEDULE TAB ═══════════════ */}
                {activeTab === "schedule" && (
                    <>
                        {/* Week Navigation */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <button onClick={() => setWeekOffset(p => p - 1)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>← Prev</button>
                                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                                    Week of {weekDates[0]} – {weekDates[6]}
                                    {weekOffset === 0 && <span style={{ marginLeft: 8, fontSize: 11, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: 4 }}>This Week</span>}
                                </div>
                                <button onClick={() => setWeekOffset(p => p + 1)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Next →</button>
                                {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 14px", color: "#E8C96E", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>Today</button>}
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                {(["L", "D", "FULL", "OFF"] as ShiftType[]).map(t => (
                                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: SHIFT_COLORS[t].text }}>
                                        <div style={{ width: 10, height: 10, borderRadius: 3, background: SHIFT_COLORS[t].bg, border: `1px solid ${SHIFT_COLORS[t].text}` }} />
                                        {t === "L" ? "Lunch" : t === "D" ? "Dinner" : t === "FULL" ? "Full Day" : "Day Off"}
                                    </div>
                                ))}
                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#fff" }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: "#000", border: "1px solid rgba(255,255,255,0.3)" }} />
                                    Leave
                                </div>
                                <button onClick={exportToPDF} style={{ marginLeft: 8, padding: "6px 16px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📥 Export PDF</button>
                                <button onClick={() => setAddEmpModal(true)} style={{ padding: "6px 16px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, color: "#E8C96E", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Add Employee</button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
                            {[
                                { label: "Total Staff", value: employees.length, color: "#fff" },
                                { label: "Kitchen", value: employees.filter((e: Employee) => e.department === "Kitchen").length, color: "#f87171" },
                                { label: "Front of House", value: employees.filter((e: Employee) => e.department === "FOH").length, color: "#60a5fa" },
                                { label: "Bar", value: employees.filter((e: Employee) => e.department === "Bar").length, color: "#facc15" },
                            ].map(c => (
                                <div key={c.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "16px 20px" }}>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{c.label}</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: c.color }}>{c.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Schedule Grid */}
                        <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden" }}>
                            <table className="sched-grid">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", paddingLeft: 12 }}>Employee</th>
                                        {DAYS.map((d, i) => (
                                            <th key={d}>{d} <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>{weekDates[i]}</span></th>
                                        ))}
                                        <th style={{ width: 60 }}>Hours</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map(dept => {
                                        const deptEmps = employees.filter((e: Employee) => e.department === dept);
                                        const dc = DEPT_COLORS[dept];
                                        return [
                                            <tr key={`dept-${dept}`} className="dept-header">
                                                <td colSpan={9} style={{ background: dc.headerBg, color: dc.text, borderLeft: `3px solid ${dc.text}` }}>
                                                    {dept === "Kitchen" ? "Kitchen" : dept === "FOH" ? "Front of House" : "Bar"} <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 8, opacity: 0.7 }}>({deptEmps.length} staff)</span>
                                                </td>
                                            </tr>,
                                            ...deptEmps.map((emp: Employee) => {
                                                const shifts = schedule[emp.name] || [];
                                                const parseT = (t: string) => { const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i); if (!m) return 0; let h = parseInt(m[1]); if (m[3].toUpperCase() === "PM" && h !== 12) h += 12; if (m[3].toUpperCase() === "AM" && h === 12) h = 0; return h + parseInt(m[2]) / 60; };
                                                const totalHrs = shifts.reduce((acc, s) => {
                                                    if (s.type === "OFF" || !s.startTime || !s.endTime) return acc;
                                                    let diff = parseT(s.endTime) - parseT(s.startTime);
                                                    if (diff < 0) diff += 24;
                                                    if (s.shift2Start && s.shift2End) {
                                                        let diff2 = parseT(s.shift2End) - parseT(s.shift2Start);
                                                        if (diff2 < 0) diff2 += 24;
                                                        diff += diff2;
                                                    }
                                                    return acc + diff;
                                                }, 0);
                                                return (
                                                    <tr key={emp.name}>
                                                        <td>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>{emp.name}</div>
                                                                    <div style={{ fontSize: 10, color: dc.text, marginTop: 1 }}>{emp.position}</div>
                                                                </div>
                                                                <button onClick={() => removeEmployee(emp.name)} title="Remove" style={{ fontSize: 9, padding: "2px 5px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, color: "rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "inherit", lineHeight: 1 }}>✕</button>
                                                            </div>
                                                        </td>
                                                        {DAYS.map((_, dayIdx) => {
                                                            const leave = isOnLeave(emp.name, dayIdx);
                                                            if (leave.onLeave) {
                                                                return (
                                                                    <td key={dayIdx}>
                                                                        <div className="shift-cell" style={{ background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }} title={leave.reason}>
                                                                            <span style={{ fontSize: 10, opacity: 0.7 }}>🚫</span>
                                                                            <span style={{ fontWeight: 800, fontSize: 11 }}>LEAVE</span>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            }
                                                            const s = shifts[dayIdx] || { type: "" as ShiftType, startTime: "", endTime: "" };
                                                            const sc = SHIFT_COLORS[s.type || ""];
                                                            const hasSplit = !!(s.shift2Start && s.shift2End);
                                                            const roleLabel = s.role ? `${s.type}-${s.role}` : s.type;
                                                            return (
                                                                <td key={dayIdx}>
                                                                    <div className="shift-cell" style={{ background: sc.bg, color: sc.text, padding: hasSplit ? "2px 4px" : undefined }} onClick={() => openEditShift(emp.name, dayIdx)}>
                                                                        {s.type === "OFF" ? "OFF" : s.type ? (
                                                                            hasSplit ? (
                                                                                <>
                                                                                    <span style={{ fontSize: 9 }}>{s.startTime}-{s.endTime}</span>
                                                                                    <span style={{ fontSize: 8, color: "#a78bfa" }}>+{s.shift2Start}-{s.shift2End}</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 800 }}>{roleLabel}</span>
                                                                                    <span style={{ fontSize: 9 }}>{s.startTime}</span>
                                                                                    <span style={{ fontSize: 8, opacity: 0.5 }}>to {s.endTime}</span>
                                                                                </>
                                                                            )
                                                                        ) : "—"}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                        <td style={{ fontWeight: 700, fontSize: 13, color: totalHrs > 40 ? "#f87171" : totalHrs > 0 ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
                                                            {totalHrs > 0 ? `${Math.round(totalHrs)}h` : "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ];
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center" }}>
                            Click any cell to edit shift · Changes are saved locally
                        </div>
                    </>
                )}

                {/* ═══════════════ TIME OFF / TIME ENTRY TABS ═══════════════ */}
                {(activeTab === "timeoff" || activeTab === "timeentry") && isDemo && (
                    <>
                        <div className="kpi-grid">
                            {[
                                { label: "Pending", icon: "⏳", value: tabRequests.filter(r => r.status === "PENDING").length, color: "var(--yellow)" },
                                { label: "Approved", icon: "✅", value: tabRequests.filter(r => r.status === "APPROVED").length, color: "var(--green)" },
                                { label: "Denied", icon: "❌", value: tabRequests.filter(r => r.status === "DENIED").length, color: "var(--red)" },
                                { label: "Total", icon: "📋", value: tabRequests.length, color: "var(--text-primary)" },
                            ].map(c => (
                                <div key={c.label} className="kpi-card">
                                    <div className="kpi-label">{c.icon} {c.label}</div>
                                    <div className="kpi-value" style={{ color: c.color }}>{c.value ?? "—"}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                            {["ALL", "PENDING", "APPROVED", "DENIED"].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{
                                    fontSize: 13, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                                    background: filter === f ? "var(--bg-card-hover)" : "var(--bg-card)",
                                    border: `1px solid ${filter === f ? "var(--border-light)" : "var(--border)"}`,
                                    color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                                    fontWeight: filter === f ? 600 : 400,
                                }}>
                                    {f === "ALL" ? "All" : f[0] + f.slice(1).toLowerCase()}
                                    {f !== "ALL" && <span style={{ marginLeft: 6, background: "var(--bg-secondary)", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "var(--text-muted)" }}>{tabRequests.filter(r => r.status === f).length}</span>}
                                </button>
                            ))}
                        </div>

                        <div className="card">
                            <div style={{ overflowX: "auto" }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Employee</th><th>Role</th><th>Start</th><th>End</th>
                                            <th>Days</th><th>Reason</th><th>Status</th><th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!data && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>Loading…</td></tr>}
                                        {filtered.length === 0 && data && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No {filter.toLowerCase()} requests</td></tr>}
                                        {filtered.map((r: any) => {
                                            const days = Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / 86400000) + 1;
                                            return (
                                                <tr key={r.id}>
                                                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{r.employeeName}</td>
                                                    <td><span className="badge badge-blue">{r.employeeRole}</span></td>
                                                    <td>{r.startDate}</td><td>{r.endDate}</td>
                                                    <td style={{ fontWeight: 600, color: days > 2 ? "var(--yellow)" : "inherit" }}>{days}d</td>
                                                    <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 180 }}>{r.reason}</td>
                                                    <td><span className={`badge ${STATUS_CLASS[r.status]}`}>{r.status}</span></td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 6 }}>
                                                            {r.status === "PENDING" ? (
                                                                <>
                                                                    <button onClick={() => handleStatusChange(r.id, "APPROVED")} style={{ fontSize: 11, padding: "5px 10px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--green)", borderRadius: 6, cursor: "pointer" }}>✓ Approve</button>
                                                                    <button onClick={() => handleStatusChange(r.id, "DENIED")} style={{ fontSize: 11, padding: "5px 10px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", borderRadius: 6, cursor: "pointer" }}>✗ Deny</button>
                                                                </>
                                                            ) : (
                                                                <button onClick={() => handleStatusChange(r.id, "PENDING")} style={{ fontSize: 11, padding: "5px 10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", borderRadius: 6, cursor: "pointer" }}>↩ Undo</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {(activeTab === "timeoff" || activeTab === "timeentry") && !isDemo && (
                    <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Schedule System Not Connected</h2>
                        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, marginBottom: 24 }}>Sync your scheduling software to automatically manage requests.</p>
                        <button className="btn-primary" onClick={() => window.location.href = '/dashboard/settings'}>Go to Integrations</button>
                    </div>
                )}

                {/* Form links */}
                {(activeTab === "timeoff" || activeTab === "timeentry") && (
                    <div className="card" style={{ marginTop: 24 }}>
                        <div className="card-header">
                            <span className="card-title">📨 Employee Submission Forms</span>
                            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Copy link and send to staff</span>
                        </div>
                        <div className="card-body">
                            <div className="grid-2">
                                {[
                                    { key: "entry", icon: "🕐", title: "Time Entry Fix Request", desc: "For correcting clock-in/out errors", path: FORM_TIME_ENTRY },
                                    { key: "off", icon: "🏖️", title: "Time Off Request", desc: "For vacation, sick days & personal time", path: FORM_TIME_OFF },
                                ].map(f => {
                                    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${f.path}?locId=${locationId}` : `${f.path}?locId=${locationId}`;
                                    return (
                                        <div key={f.key} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                                <span style={{ fontSize: 28 }}>{f.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                                                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{f.desc}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 11, background: "var(--bg-card)", padding: "8px 12px", borderRadius: 8, marginBottom: 14, wordBreak: "break-all", fontFamily: "monospace", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{fullUrl}</div>
                                            <div style={{ display: "flex", gap: 8 }}>
                                                <a href={fullUrl} target="_blank" rel="noopener" className="btn-primary" style={{ fontSize: 12, textDecoration: "none" }}>Open Form ↗</a>
                                                <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => copyLink(fullUrl, f.key)}>
                                                    {copied === f.key ? "✓ Copied!" : "📋 Copy Link"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
