// Simple component to generate a notification sound using Web Audio API
"use client"
import { useRef } from "react"

export default function NotificationSoundGenerator() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const generateNotificationSound = () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      // Create oscillator for the sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure the sound (pleasant notification tone)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // Start frequency
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1) // End frequency
      oscillator.type = "sine"

      // Configure volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      // Play the sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)

      console.log("Generated notification sound")
    } catch (error) {
      console.error("Could not generate notification sound:", error)
    }
  }

  const downloadNotificationSound = async () => {
    try {
      // Create a simple notification sound and download it
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const sampleRate = audioContext.sampleRate
      const duration = 0.5 // 0.5 seconds
      const length = sampleRate * duration
      const buffer = audioContext.createBuffer(1, length, sampleRate)
      const data = buffer.getChannelData(0)

      // Generate a pleasant notification sound
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate
        const frequency1 = 800 * Math.exp(-t * 2) // Decaying frequency
        const frequency2 = 600 * Math.exp(-t * 2)
        const envelope = Math.exp(-t * 3) // Volume envelope

        data[i] =
          envelope * (0.3 * Math.sin(2 * Math.PI * frequency1 * t) + 0.2 * Math.sin(2 * Math.PI * frequency2 * t))
      }

      // Convert to WAV and download
      const wav = audioBufferToWav(buffer)
      const blob = new Blob([wav], { type: "audio/wav" })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = "notification-sound.wav"
      a.click()

      URL.revokeObjectURL(url)
      console.log("Notification sound downloaded")
    } catch (error) {
      console.error("Could not create notification sound file:", error)
    }
  }

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer) => {
    const length = buffer.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)
    const data = buffer.getChannelData(0)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, length * 2, true)

    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }

    return arrayBuffer
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Notification Sound Generator</h2>

      <div className="space-y-4">
        <button
          onClick={generateNotificationSound}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔊 Test Generated Sound
        </button>

        <button
          onClick={downloadNotificationSound}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          📥 Download Notification Sound
        </button>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Instructions:</strong>
          <ol className="mt-1 space-y-1 list-decimal list-inside">
            <li>Click "Download Notification Sound" to get a WAV file</li>
            <li>Convert the WAV to MP3 using an online converter</li>
            <li>Save as "notification-sound.mp3" in your public folder</li>
            <li>Or use the generated sound directly in your app</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
