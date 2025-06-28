"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Bell, Volume2, VolumeX, Play, Settings } from "lucide-react"
import { useNotificationSettingsSafe } from "@/hooks/useNotificationSettingsSafe"

export default function NotificationSettingsPage() {
  const navigate = useNavigate()
  const { settings, updateSettings, testSound } = useNotificationSettingsSafe()
  const [isTestingSound, setIsTestingSound] = useState(false)

  const handleSoundToggle = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled })
  }

  const handleVolumeChange = (volume: number) => {
    updateSettings({ volume })
  }

  const handleSoundTypeChange = (soundType: "default" | "chime" | "bell" | "pop") => {
    updateSettings({ soundType })
  }

  const handleTestSound = () => {
    setIsTestingSound(true)
    testSound()
    setTimeout(() => setIsTestingSound(false), 1000)
  }

  const soundOptions = [
    { value: "default", label: "Default", description: "Standard notification sound" },
    { value: "chime", label: "Chime", description: "Gentle chime sound" },
    { value: "bell", label: "Bell", description: "Classic bell sound" },
    { value: "pop", label: "Pop", description: "Modern pop sound" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-red-500" />
                Notification Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage your notification preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Sound Settings Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <Bell className="w-5 h-5 text-red-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Sound Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Enable/Disable Sound */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">Notification Sounds</h3>
                  <p className="text-sm text-gray-500">Play sound when you receive notifications</p>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.soundEnabled ? "bg-red-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.soundEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Volume Control */}
              {settings.soundEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900">Volume</h3>
                    <div className="flex items-center space-x-2">
                      {settings.volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm text-gray-600">{Math.round(settings.volume * 100)}%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.volume}
                    onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${settings.volume * 100}%, #e5e7eb ${settings.volume * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>
              )}

              {/* Sound Type Selection */}
              {settings.soundEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-medium text-gray-900">Sound Type</h3>
                    <button
                      onClick={handleTestSound}
                      disabled={isTestingSound}
                      className="flex items-center px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {isTestingSound ? "Playing..." : "Test"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {soundOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSoundTypeChange(option.value as any)}
                        className={`p-4 text-left border rounded-lg transition-colors ${
                          settings.soundType === option.value
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                        {settings.soundType === option.value && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Selected
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Settings Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">Browser Notifications</h3>
                  <p className="text-sm text-gray-500">Show desktop notifications when browser is not active</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Receive notification summaries via email</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-red-500">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
