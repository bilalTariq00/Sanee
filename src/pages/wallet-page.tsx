"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, DollarSign, Clock, Eye, CheckCircle, Download } from "lucide-react"
import axios from "axios"
import config from "@/config"
import { useAuth } from "@/contexts/AuthContext"

interface WalletData {
  wallet_summary: {
    in_work: number
    in_review: number
    pending: number
    available: number
    total_earnings: number
    withdrawn: number
    total_commission: number
  }
  recent_transactions: {
    in_work: any[]
    in_review: any[]
    pending: any[]
    available: any[]
    withdrawn: any[]
  }
  config: {
    commission_rate: number
    available_days: number
    currency: string
    min_withdrawal: number
    max_withdrawal: number
  }
}

export default function WalletPage() {
  const { user: authUser } = useAuth()
  const navigate = useNavigate()
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser?.uid) return

    const fetchWalletData = async () => {
      setLoadingWallet(true)
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get(`${config.API_BASE_URL}/wallet/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const data = res.data?.data
        setWalletData(data)
      } catch (error) {
        console.error("Failed to fetch wallet data:", error)
        setWalletData(null)
      } finally {
        setLoadingWallet(false)
      }
    }

    fetchWalletData()
  }, [authUser?.uid])

  const handleCardClick = (cardType: string) => {
    setExpandedCard(expandedCard === cardType ? null : cardType)
  }

  const closeExpanded = () => {
    setExpandedCard(null)
  }

  const getCardIcon = (type: string) => {
    switch (type) {
      case "in_work":
        return <Clock className="w-8 h-8" />
      case "in_review":
        return <Eye className="w-8 h-8" />
      case "pending":
        return <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
      case "available":
        return <CheckCircle className="w-8 h-8" />
      case "withdrawn":
        return <Download className="w-8 h-8" />
      default:
        return <img src='src/public/riyal.svg' className="h-5 w-5 mr-1" />
    }
  }

  const getCardColor = (type: string) => {
    switch (type) {
      case "in_work":
        return "text-gray-600 bg-gray-50 hover:bg-gray-100"
      case "in_review":
        return "text-blue-600 bg-blue-50 hover:bg-blue-100"
      case "pending":
        return "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
      case "available":
        return "text-green-600 bg-green-50 hover:bg-green-100"
      case "withdrawn":
        return "text-purple-600 bg-purple-50 hover:bg-purple-100"
      default:
        return "text-gray-600 bg-gray-50 hover:bg-gray-100"
    }
  }

  const formatCardTitle = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Please log in to view your wallet
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-white/90 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Profile
          </button>

          <div>
            <h1 className="text-3xl font-bold">My Wallet</h1>
            <p className="mt-2 text-white/90">Manage your earnings and transactions</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingWallet ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading wallet data…</p>
          </div>
        ) : walletData ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Earnings</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">
                    ${walletData.wallet_summary?.total_earnings || 0}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Withdrawn</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">${walletData.wallet_summary?.withdrawn || 0}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Commission</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold text-red-600">
                    ${walletData.wallet_summary?.total_commission || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Type Cards */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaction Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {["in_work", "in_review", "pending", "available"].map((type) => (
                  <div key={type} className="space-y-4">
                    <button
                      onClick={() => handleCardClick(type)}
                      className={`w-full p-6 rounded-lg shadow-sm transition-all duration-200 cursor-pointer ${getCardColor(type)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <h3 className="text-sm font-medium uppercase tracking-wide opacity-75">
                            {formatCardTitle(type)}
                          </h3>
                          <div className="mt-2 flex items-baseline">
                            <span className="text-2xl font-bold">
                              ${walletData.wallet_summary?.[type as keyof typeof walletData.wallet_summary] || 0}
                            </span>
                          </div>
                          <p className="text-xs mt-1 opacity-75">
                            {walletData.recent_transactions?.[type as keyof typeof walletData.recent_transactions]
                              ?.length || 0}{" "}
                            transactions
                          </p>
                        </div>
                        <div className="opacity-75">{getCardIcon(type)}</div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Withdrawn Transactions Card */}
            {walletData.recent_transactions?.withdrawn?.length > 0 && (
              <div>
                <button
                  onClick={() => handleCardClick("withdrawn")}
                  className={`w-full p-6 rounded-lg shadow-sm transition-all duration-200 cursor-pointer ${getCardColor("withdrawn")}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-sm font-medium uppercase tracking-wide opacity-75">Withdrawn Transactions</h3>
                      <div className="mt-2 flex items-baseline">
                        <span className="text-2xl font-bold">
                          {walletData.recent_transactions.withdrawn.length} transactions
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">Total: ${walletData.wallet_summary?.withdrawn || 0}</p>
                    </div>
                    <div className="opacity-75">{getCardIcon("withdrawn")}</div>
                  </div>
                </button>
              </div>
            )}

            {/* Wallet Configuration */}
            {walletData.config && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Wallet Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Commission Rate:</span>
                    <span className="ml-2 font-medium">{walletData.config.commission_rate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Available Days:</span>
                    <span className="ml-2 font-medium">{walletData.config.available_days} days</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Currency:</span>
                    <span className="ml-2 font-medium">{walletData.config.currency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Withdrawal Limits:</span>
                    <span className="ml-2 font-medium">
                      ${walletData.config.min_withdrawal} - ${walletData.config.max_withdrawal}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Full Screen Expanded Section */}
            {expandedCard && (
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Section Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-500 text-white">
                    <div className="flex items-center space-x-4">
                      <div className="text-white">{getCardIcon(expandedCard)}</div>
                      <div>
                        <h2 className="text-2xl font-bold">{formatCardTitle(expandedCard)} Transactions</h2>
                        <p className="text-white/90">
                          ${walletData?.wallet_summary?.[expandedCard as keyof typeof walletData.wallet_summary] || 0} •{" "}
                          {walletData?.recent_transactions?.[
                            expandedCard as keyof typeof walletData.recent_transactions
                          ]?.length || 0}{" "}
                          transactions
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeExpanded}
                      className="text-white hover:text-white/80 p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Section Content */}
                  <div className="p-6">
                    {walletData?.recent_transactions?.[expandedCard as keyof typeof walletData.recent_transactions]
                      ?.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {walletData.recent_transactions[
                          expandedCard as keyof typeof walletData.recent_transactions
                        ].map((transaction: any) => (
                          <div
                            key={transaction.id}
                            className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                          >
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {transaction.contract?.gig_title || "Transaction"}
                                  </h3>
                                  <p className="text-gray-600 text-sm leading-relaxed">{transaction.description}</p>
                                </div>
                                <div
                                  className={`p-2 rounded-lg ${getCardColor(expandedCard).split(" ")[1]} ${getCardColor(expandedCard).split(" ")[2]}`}
                                >
                                  {getCardIcon(expandedCard)}
                                </div>
                              </div>

                              <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-500">Amount</span>
                                  <span
                                    className={`text-xl font-bold ${
                                      expandedCard === "available"
                                        ? "text-green-600"
                                        : expandedCard === "pending"
                                          ? "text-yellow-600"
                                          : expandedCard === "in_review"
                                            ? "text-blue-600"
                                            : "text-gray-900"
                                    }`}
                                  >
                                    ${transaction.amount}
                                  </span>
                                </div>

                                {transaction.commission_amount && (
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-500">Commission</span>
                                    <span className="text-sm font-semibold text-red-500">
                                      ${transaction.commission_amount}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-500">Type</span>
                                  <span className="text-sm text-gray-700 capitalize">
                                    {transaction.transaction_type?.replace("_", " ") || expandedCard.replace("_", " ")}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-500">Date</span>
                                  <span className="text-sm text-gray-700">
                                    {expandedCard === "pending" && transaction.available_at
                                      ? `Available: ${new Date(transaction.available_at).toLocaleDateString()}`
                                      : new Date(transaction.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              {transaction.contract && (
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-700 mb-1">Contract Details</h4>
                                  <p className="text-xs text-gray-500">Gig: {transaction.contract.gig_title}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div
                          className={`p-4 rounded-full ${getCardColor(expandedCard).split(" ")[1]} ${getCardColor(expandedCard).split(" ")[2]} mb-4`}
                        >
                          {getCardIcon(expandedCard)}
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                          No {formatCardTitle(expandedCard).toLowerCase()} transactions
                        </h3>
                        <p className="text-gray-500 text-center max-w-md">
                          You don't have any {formatCardTitle(expandedCard).toLowerCase()} transactions yet. They will
                          appear here once you start working on projects.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Unable to load wallet data.</p>
          </div>
        )}
      </main>
    </div>
  )
}
