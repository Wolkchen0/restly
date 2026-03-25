/**
 * VIP E-posta Listesi
 * Bu listedeki kullanıcılardan asla ücret alınmaz.
 * Yeni VIP eklemek için bu listeye email ekleyin.
 */
export const VIP_EMAILS: string[] = [
    // Buraya VIP e-postaları ekleyin
    // Örnek: "ihsan@restly.app",
];

/**
 * Admin e-postaları — /admin/reports sayfasına erişebilir
 */
export const ADMIN_EMAILS: string[] = [
    // Buraya admin e-postaları ekleyin
    // Örnek: "ihsan@restly.app",
];

export function isVipEmail(email: string): boolean {
    return VIP_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

export function isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
