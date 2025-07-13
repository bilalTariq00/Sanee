// Improved notification system with Web Audio API fallback
"use client"
import { useState, useEffect, useRef } from "react"
import { Bell, BellOff, Volume2, VolumeX } from "lucide-react"
import { toast } from "sonner"

interface NotificationSettings {
  messages: boolean
  orders: boolean
  emails: boolean
  system: boolean
  sound: boolean
}

export default function ImprovedChatNotifications() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    messages: true,
    orders: true,
    emails: true,
    system: true,
    sound: true,
  })
  const [soundMethod, setSoundMethod] = useState<"file" | "generated">("generated")

  const audioContextRef = useRef<AudioContext | null>(null)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio
  useEffect(() => {
    // Try to load audio file first
    try {
      const audio = new Audio("/notification-sound.mp3")
      audio.volume = 0.5

      audio.addEventListener("canplaythrough", () => {
        notificationSoundRef.current = audio
        setSoundMethod("file")
        console.log("Notification sound file loaded successfully")
      })

      audio.addEventListener("error", () => {
        console.log("Notification sound file not found, will use generated sound")
        setSoundMethod("generated")
        initializeAudioContext()
      })

      // Test load
      audio.load()
    } catch (error) {
      console.log("Could not initialize audio file, using generated sound")
      setSoundMethod("generated")
      initializeAudioContext()
    }
  }, [])

  const initializeAudioContext = () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.error("Could not initialize audio context:", error)
    }
  }

  const playNotificationSound = () => {
    if (!notificationSettings.sound) return

    if (soundMethod === "file" && notificationSoundRef.current) {
      // Use audio file
      notificationSoundRef.current.play().catch((e) => {
        console.log("Could not play audio file, falling back to generated sound")
        playGeneratedSound()
      })
    } else {
      // Use generated sound
      playGeneratedSound()
    }
  }

  const playGeneratedSound = () => {
    if (!audioContextRef.current) {
      initializeAudioContext()
    }

    if (!audioContextRef.current) return

    try {
      const audioContext = audioContextRef.current

      // Resume context if suspended (required by some browsers)
      if (audioContext.state === "suspended") {
        audioContext.resume()
      }

      // Create oscillator for the sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure pleasant notification tone
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      oscillator.type = "sine"

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      // Play the sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)

      console.log("Generated notification sound played")
    } catch (error) {
      console.error("Could not play generated sound:", error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifications not supported in this browser")
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const enabled = permission === "granted"
      setNotificationsEnabled(enabled)

      if (enabled) {
        localStorage.setItem("notificationsEnabled", "true")
        toast.success("Notifications enabled!")
        sendTestNotification()
      } else {
        localStorage.setItem("notificationsEnabled", "false")
        toast.error("Notifications permission denied")
      }

      return enabled
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      toast.error("Failed to request notification permission")
      return false
    }
  }

  const sendNotification = (type: keyof NotificationSettings, title: string, body: string, icon?: string) => {
    if (!notificationsEnabled || !("Notification" in window) || Notification.permission !== "granted") {
      return
    }

    if (!notificationSettings[type]) {
      return
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || "/favicon.ico",
        tag: `${type}-${Date.now()}`,
        requireInteraction: false,
        silent: !notificationSettings.sound,
      })

      setTimeout(() => notification.close(), 5000)

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Play sound
      playNotificationSound()

      console.log("Notification sent successfully:", title)
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  const sendTestNotification = () => {
    sendNotification("system", "🎉 Test Notification", "Notifications are working perfectly!")
  }

  const testSound = () => {
    playNotificationSound()
    toast.success("Sound test played!")
  }

  const saveSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings)
    localStorage.setItem("notificationSettings", JSON.stringify(newSettings))
    toast.success("Settings saved!")
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Notification System</h2>

      <div className="space-y-4">
        {/* Enable Notifications */}
        <button
          onClick={requestNotificationPermission}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            notificationsEnabled
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          {notificationsEnabled ? "Notifications Enabled" : "Enable Notifications"}
        </button>

        {notificationsEnabled && (
          <>
            {/* Sound Method Info */}
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              <div className="flex items-center justify-between">
                <span>Sound Method:</span>
                <span
                  className={`px-2 py-1 rounded ${
                    soundMethod === "file" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {soundMethod === "file" ? "🎵 Audio File" : "🔊 Generated"}
                </span>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-2">
              <h3 className="font-semibold">Notification Types:</h3>

              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key.replace("_", " ")}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      saveSettings({
                        ...notificationSettings,
                        [key]: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                </div>
              ))}
            </div>

            {/* Test Buttons */}
            <div className="space-y-2">
              <button
                onClick={sendTestNotification}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                🧪 Test Notification
              </button>

              <button
                onClick={testSound}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                {notificationSettings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Test Sound
              </button>

              <button
                onClick={() => sendNotification("messages", "💬 New Message", "John: Hey, how are you?")}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                💬 Test Message
              </button>

              <button
                onClick={() => sendNotification("orders", "🛒 New Order", "You received a new order for $150")}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                🛒 Test Order
              </button>
            </div>
          </>
        )}

        {/* Status Info */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Status:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Browser Support: {typeof window !== "undefined" && "Notification" in window ? "✅" : "❌"}</li>
            <li>
              • Permission:{" "}
              {typeof window !== "undefined" && "Notification" in window ? Notification.permission : "N/A"}
            </li>
            <li>• Audio Context: {audioContextRef.current ? "✅" : "❌"}</li>
            <li>• Sound File: {soundMethod === "file" ? "✅" : "❌"}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
