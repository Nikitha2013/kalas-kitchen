class NotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window;
        this.swRegistration = null;
    }

    async init() {
        if (!this.isSupported) {
            console.log('Push notifications are not supported in this browser.');
            return false;
        }

        try {
            this.swRegistration = await navigator.serviceWorker.register('service-worker.js', { scope: '/' });
            console.log('Service worker registered successfully.');
            return true;
        } catch (error) {
            console.error('Service worker registration failed:', error);
            return false;
        }
    }

    async askPermission() {
        if (!this.isSupported) {
            alert('This browser does not support notifications.');
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied.');
            return false;
        }

        return true;
    }

    async subscribe() {
        if (!this.swRegistration) {
            await this.init();
        }

        try {
            const existingSubscription = await this.swRegistration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('Already subscribed to push notifications.');
                return true;
            }

            const vapidPublicKey = 'BFuN0BkB_3wwzQmB5BAK0wBaJ9YZrG3V6hFj4F7k2cI4txw5d9D0W5z7J7-lp8u3lJ0Jq-0D9QPGyYF1FhJjyA';
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });

            localStorage.setItem('kk-push-subscription', JSON.stringify(subscription));
            console.log('Subscribed to push notifications:', subscription);
            return true;
        } catch (error) {
            console.error('Subscription failed:', error);
            return false;
        }
    }

    async unsubscribe() {
        if (!this.swRegistration) return false;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            if (!subscription) return false;

            const unsubscribed = await subscription.unsubscribe();
            if (unsubscribed) {
                localStorage.removeItem('kk-push-subscription');
                console.log('Unsubscribed from notifications.');
            }
            return unsubscribed;
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            return false;
        }
    }

    async isSubscribed() {
        if (!this.swRegistration) return false;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            return !!subscription;
        } catch (error) {
            return false;
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

        const rawData = window.atob(base64);
        const output = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; i++) {
            output[i] = rawData.charCodeAt(i);
        }

        return output;
    }
}

const notificationManager = new NotificationManager();
