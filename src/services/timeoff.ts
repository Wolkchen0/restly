// Mock Time-Off Request Data
export interface TimeOffRequest {
    id: string;
    employeeName: string;
    employeeRole: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: "PENDING" | "APPROVED" | "DENIED";
    submittedAt: string;
    reviewNotes?: string;
    formSource: 1 | 2;
}

export const FORM_LINKS = {
    // 1 = Time Entry Fix Request Form
    1: process.env.TIMEOFF_FORM_1 || "https://docs.google.com/forms/d/e/1FAIpQLSfyZjvuMiBSiO2PV3HCmFZGVZ1wdDC-C3GzP7mroYIOPUgd8w/viewform",
    // 2 = Time Off Request Form
    2: process.env.TIMEOFF_FORM_2 || "https://docs.google.com/forms/d/e/1FAIpQLSc9KBEglmGSeyIkv0pN5byJyslGBzAstYHe9Cq6fykglkhO8Q/viewform",
};


const MOCK_REQUESTS: TimeOffRequest[] = [
    {
        id: "to1",
        employeeName: "Carlos Rivera",
        employeeRole: "Line Cook",
        startDate: "2026-03-15",
        endDate: "2026-03-17",
        reason: "Family vacation planned months in advance",
        status: "PENDING",
        submittedAt: "2026-03-01T09:30:00Z",
        formSource: 1,
    },
    {
        id: "to2",
        employeeName: "Lisa Park",
        employeeRole: "Server",
        startDate: "2026-03-20",
        endDate: "2026-03-20",
        reason: "Doctor's appointment",
        status: "PENDING",
        submittedAt: "2026-03-02T14:15:00Z",
        formSource: 2,
    },
    {
        id: "to3",
        employeeName: "Marcus Thompson",
        employeeRole: "Bartender",
        startDate: "2026-03-22",
        endDate: "2026-03-23",
        reason: "Personal emergency",
        status: "PENDING",
        submittedAt: "2026-03-03T11:45:00Z",
        formSource: 1,
    },
    {
        id: "to4",
        employeeName: "Yuki Tanaka",
        employeeRole: "Sous Chef",
        startDate: "2026-03-28",
        endDate: "2026-03-28",
        reason: "Forgot to clock out on Tuesday shift",
        status: "APPROVED",
        submittedAt: "2026-02-20T08:00:00Z",
        reviewNotes: "Approved. Fixed in Toast POS.",
        formSource: 1, // Time Entry Fix Request
    },
    {
        id: "to5",
        employeeName: "Brittany Moore",
        employeeRole: "Host",
        startDate: "2026-04-05",
        endDate: "2026-04-07",
        reason: "Spring break travel",
        status: "PENDING",
        submittedAt: "2026-03-04T07:20:00Z",
        formSource: 1,
    },
    {
        id: "to6",
        employeeName: "Alex Kim",
        employeeRole: "Server",
        startDate: "2026-03-14",
        endDate: "2026-03-14",
        reason: "Graduation ceremony",
        status: "APPROVED",
        submittedAt: "2026-02-28T16:00:00Z",
        reviewNotes: "Approved. Sarah will cover.",
        formSource: 2,
    },
    {
        id: "to7",
        employeeName: "James Okafor",
        employeeRole: "Dishwasher",
        startDate: "2026-03-18",
        endDate: "2026-03-19",
        reason: "Religious holiday",
        status: "PENDING",
        submittedAt: "2026-03-03T13:00:00Z",
        formSource: 1,
    },
];

export function getAllTimeOffRequests(): TimeOffRequest[] {
    return MOCK_REQUESTS;
}

export function getPendingRequests(): TimeOffRequest[] {
    return MOCK_REQUESTS.filter(r => r.status === "PENDING");
}

export function getApprovedRequests(): TimeOffRequest[] {
    return MOCK_REQUESTS.filter(r => r.status === "APPROVED");
}

export function checkConflicts(startDate: string, endDate: string, excludeId?: string): TimeOffRequest[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return MOCK_REQUESTS.filter(r => {
        if (r.id === excludeId || r.status === "DENIED") return false;
        const rStart = new Date(r.startDate);
        const rEnd = new Date(r.endDate);
        return start <= rEnd && end >= rStart;
    });
}

export function getScheduleStats() {
    const pending = MOCK_REQUESTS.filter(r => r.status === "PENDING").length;
    const approved = MOCK_REQUESTS.filter(r => r.status === "APPROVED").length;
    const denied = MOCK_REQUESTS.filter(r => r.status === "DENIED").length;
    return { pending, approved, denied, total: MOCK_REQUESTS.length };
}
