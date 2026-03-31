const STORAGE_KEY = "wi_device_id";

export function getOrCreateDeviceId(): string {
    try {
        let id = localStorage.getItem(STORAGE_KEY);
        if (!id) {
            id =
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `wi-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
            localStorage.setItem(STORAGE_KEY, id);
        }
        return id;
    } catch {
        return `wi-fallback-${Date.now()}`;
    }
}
