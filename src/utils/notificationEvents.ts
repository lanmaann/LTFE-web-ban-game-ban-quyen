export const NOTIFICATIONS_UPDATED_EVENT = "ata-notifications-updated";

export function dispatchNotificationsUpdated(): void {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}
