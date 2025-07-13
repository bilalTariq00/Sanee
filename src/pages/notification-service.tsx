// Standalone notification service that can be used throughout your app
"use client"

interface NotificationSettings {
  messages: boolean
  orders: boolean
  emails: boolean
  system: boolean
  sound: boolean
}

interface NotificationData {
  action?: string
  userId?: string
  url?: string
  autoClose?: number
  forceShow?: boolean
}

class NotificationService {
  private static instance: NotificationService
  private settings: NotificationSettings
  private isEnabled = false
  private soundRef: HTMLAudioElement | null = null

  constructor() {
    this.settings = {
      messages: true,
      orders: true,
      emails: true,
      system: true,
      sound: true,
    }
    this.loadSettings()
    this.initSound()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private initSound() {
    if (typeof window !== "undefined") {
      this.soundRef = new Audio("/notification-sound.mp3")
      this.soundRef.volume = 0.5
    }
  }

  private loadSettings() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notificationSettings")
      if (saved) {
        try {
          this.settings = JSON.parse(saved)
        } catch (e) {
          console.error("Failed to load notification settings:", e)
        }
      }

      const wasEnabled = localStorage.getItem("notificationsEnabled") === "true"
      if (wasEnabled && "Notification" in window && Notification.permission === "granted") {
        this.isEnabled = true
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.error("Notifications not supported")
      return false
    }

    const permission = await Notification.requestPermission()
    this.isEnabled = permission === "granted"

    if (typeof window !== "undefined") {
      localStorage.setItem("notificationsEnabled", this.isEnabled.toString())
    }

    if (this.isEnabled) {
      this.send(
        "system",
        "🎉 Notifications Enabled!",
        "You'll now receive notifications for various events!",
        undefined,
        { forceShow: true },
      )
    }

    return this.isEnabled
  }

  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings }
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationSettings", JSON.stringify(this.settings))
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.settings }
  }

  isNotificationEnabled(): boolean {
    return this.isEnabled
  }

  private playSound() {
    if (this.soundRef && this.settings.sound) {
      this.soundRef.play().catch((e) => {
        console.log("Could not play notification sound:", e)
      })
    }
  }

  send(type: keyof NotificationSettings, title: string, body: string, icon?: string, data?: NotificationData) {
    // Check if notifications are enabled and user has granted permission
    if (!this.isEnabled || !("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    // Check if this type of notification is enabled in settings
    if (!this.settings[type]) {
      return
    }

    // Only show notification if the page is not visible or forced to show
    const shouldShow = document.hidden || document.visibilityState === "hidden" || data?.forceShow

    if (shouldShow) {
      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: `${type}-notification`,
        requireInteraction: false,
        silent: !this.settings.sound,
        data: data || {},
      })

      // Auto close after specified time or 5 seconds
      const autoCloseTime = data?.autoClose || 5000
      setTimeout(() => {
        notification.close()
      }, autoCloseTime)

      // Handle notification click
      notification.onclick = () => {
        window.focus()

        // Handle different notification types
        if (data?.action) {
          this.handleNotificationAction(data)
        }

        notification.close()
      }

      // Play sound if enabled
      if (this.settings.sound) {
        this.playSound()
      }
    }
  }

  private handleNotificationAction(data: NotificationData) {
    switch (data.action) {
      case "openChat":
        if (data.userId) {
          window.location.href = `/messages/${data.userId}`
        }
        break
      case "openOrders":
        window.location.href = "/orders"
        break
      case "openProfile":
        window.location.href = "/profile"
        break
      case "openUrl":
        if (data.url) {
          window.open(data.url, "_blank")
        }
        break
      default:
        break
    }
  }

  // Convenience methods for different notification types
  newMessage(senderName: string, message: string, senderImage?: string, senderId?: string) {
    this.send("messages", `💬 New message from ${senderName}`, message, senderImage, {
      action: "openChat",
      userId: senderId,
      autoClose: 8000,
    })
  }

  newOrder(serviceName: string, orderId: string) {
    this.send("orders", "🛒 New Order Received!", `You have a new order for ${serviceName}`, undefined, {
      action: "openOrders",
      autoClose: 10000,
    })
  }

  orderStatusUpdate(status: string, orderId: string) {
    const statusMessages: Record<string, string> = {
      accepted: "✅ Order Accepted!",
      rejected: "❌ Order Rejected",
      completed: "🎉 Order Completed!",
      cancelled: "⚠️ Order Cancelled",
      paid: "💳 Payment Received!",
    }

    const title = statusMessages[status] || "📋 Order Updated"

    this.send("orders", title, `Order #${orderId} status has been updated`, undefined, {
      action: "openOrders",
      autoClose: 7000,
    })
  }

  newEmail(sender: string, subject: string) {
    this.send("emails", "📧 New Email Received", `From: ${sender} - ${subject}`, undefined, {
      action: "openUrl",
      url: "/inbox",
      autoClose: 6000,
    })
  }

  systemNotification(message: string, type: "info" | "warning" | "success" = "info") {
    const icons = {
      info: "ℹ️",
      warning: "⚠️",
      success: "✅",
    }

    this.send("system", `${icons[type]} System Notification`, message, undefined, {
      autoClose: 5000,
    })
  }

  profileUpdated() {
    this.send("system", "👤 Profile Updated", "Your profile has been successfully updated", undefined, {
      action: "openProfile",
      autoClose: 4000,
    })
  }

  paymentReceived(amount: number, currency = "SAR") {
    this.send("orders", "💰 Payment Received!", `You received ${amount} ${currency} for your service`, undefined, {
      action: "openOrders",
      autoClose: 8000,
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Export hook for React components
export const useNotifications = () => {
  return {
    service: notificationService,
    requestPermission: () => notificationService.requestPermission(),
    isEnabled: () => notificationService.isNotificationEnabled(),
    getSettings: () => notificationService.getSettings(),
    updateSettings: (settings: Partial<NotificationSettings>) => notificationService.updateSettings(settings),
  }
}
