"use client"

import { useNotificationSettings } from "@/contexts/NotificationContext"

// Safe hook that provides fallback values if provider is not available
export function useNotificationSettingsSafe() {
  const notificationSettings = useNotificationSettings()

  try {
    return notificationSettings
  } catch (error) {
    console.warn("NotificationProvider not found, using fallback")

    // Fallback implementation
    return {
      settings: {
        soundEnabled: true,
        volume: 0.7,
        soundType: "default" as const,
      },
      updateSettings: () => {},
      playNotificationSound: () => {
        // Simple fallback beep
        try {
          const audio = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTuR2O/Eeyw",
          )
          audio.volume = 0.7
          audio.play().catch(() => {})
        } catch (e) {
          console.warn("Could not play fallback sound")
        }
      },
      testSound: () => {},
    }
  }
}
