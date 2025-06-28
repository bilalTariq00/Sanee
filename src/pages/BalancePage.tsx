"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, DollarSign, Download, Upload, Clock, TrendingUp, Filter, Eye, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import axios from "axios"
import WithdrawModal from "./withdraw-modal"
import config from "@/config"

// Add your config import here
// import config from "@/config"
// import { useAuth } from "@/contexts/AuthContext"

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

export default function BalancePage() {
  // const { user: authUser } = useAuth() // Uncomment when you have auth context
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [activeTab, setActiveTab] = useState("in_work") // Changed to match API structure
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [loadingWallet, setLoadingWallet] = useState(false)

  // Mock auth user for demo - replace with real auth
  const authUser = { uid: "demo-user" }

  useEffect(() => {
    if (!authUser?.uid) return

    const fetchWalletData = async () => {
      setLoadingWallet(true)
      try {
        const token = localStorage.getItem("token")
        // Replace with your actual API base URL
        const API_BASE_URL = config.API_BASE_URL || "https://your-api-url.com"

        const res = await axios.get(`${API_BASE_URL}/wallet/user`, {
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

  const getFilteredTransactions = (type: string) => {
    if (!walletData?.recent_transactions) return []
    if (type === "all") {
      return [
        ...walletData.recent_transactions.in_work,
        ...walletData.recent_transactions.in_review,
        ...walletData.recent_transactions.pending,
        ...walletData.recent_transactions.available,
        ...walletData.recent_transactions.withdrawn,
      ]
    }
    return walletData.recent_transactions[type as keyof typeof walletData.recent_transactions] || []
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "in_work":
        return <Clock className="h-5 w-5 text-gray-500" />
      case "in_review":
        return <Eye className="h-5 w-5 text-blue-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "available":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "withdrawn":
        return <Download className="h-5 w-5 text-purple-500" />
      default:
        return <DollarSign className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (type: string) => {
    switch (type) {
      case "available":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Available
          </Badge>
        )
      case "in_work":
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            In Work
          </Badge>
        )
      case "in_review":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            In Review
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        )
      case "withdrawn":
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Withdrawn
          </Badge>
        )
      default:
        return <Badge variant="outline">{type}</Badge>
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

  if (loadingWallet) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading wallet data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900">My Balance</h1>
            </div>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-green-600 hover:bg-green-700"
              disabled={!walletData?.wallet_summary?.available || walletData.wallet_summary.available <= 0}
            >
              <Upload className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {walletData ? (
          <>
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 ">
                  <CardTitle className="text-sm font-medium text-gray-600">Available for Withdrawal</CardTitle>
                  <img src='/riyal.svg' className="h-5 w-5 mr-1" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 flex items-center">
                         <img src='/riyal.svg' className="h-5 w-5 mr-1" />{walletData.wallet_summary?.available?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Work in Progress</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 flex items-center">
                         <img src='/riyal.svg' className="h-5 w-5 mr-1" />
                    {(
                      walletData.wallet_summary?.in_work +
                      walletData.wallet_summary?.in_review +
                      walletData.wallet_summary?.pending
                    )?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pending completion</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900 flex items-center">
                         <img src='/riyal.svg' className="h-5 w-5 mr-1" />{walletData.wallet_summary?.total_earnings?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All time earnings</p>
                </CardContent>
              </Card>
            </div>

            {/* Commission and Withdrawn Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Withdrawn</CardTitle>
                  <Download className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 flex items-center">
                         <img src='/riyal.svg' className="h-5 w-5 mr-1" />{walletData.wallet_summary?.withdrawn?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Commission Paid</CardTitle>
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600 flex items-center">
                         <img src='/riyal.svg' className="h-5 w-5 mr-1" />{walletData.wallet_summary?.total_commission?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Transaction History</CardTitle>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="in_work">In Work</TabsTrigger>
                    <TabsTrigger value="in_review">In Review</TabsTrigger>
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="available">Available</TabsTrigger>
                    <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
                  </TabsList>

                  {["in_work", "in_review", "pending", "available", "withdrawn"].map((tabType) => (
                    <TabsContent key={tabType} value={tabType} className="mt-6">
                      <div className="space-y-4">
                        {getFilteredTransactions(tabType).length > 0 ? (
                          getFilteredTransactions(tabType).map((transaction: any) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center space-x-4">
                                <div
                                  className={`p-2 rounded-full ${
                                    tabType === "in_work"
                                      ? "bg-gray-100"
                                      : tabType === "in_review"
                                        ? "bg-blue-100"
                                        : tabType === "pending"
                                          ? "bg-yellow-100"
                                          : tabType === "available"
                                            ? "bg-green-100"
                                            : "bg-purple-100"
                                  }`}
                                >
                                  {getTransactionIcon(tabType)}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900">
                                    {transaction.contract?.gig_title || transaction.description || "Transaction"}
                                  </h3>
                                  <p className="text-sm text-gray-500">{transaction.description}</p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <p className="text-sm text-gray-500">
                                      {new Date(transaction.created_at).toLocaleDateString()}
                                    </p>
                                    {transaction.available_at && tabType === "pending" && (
                                      <p className="text-sm text-blue-600">
                                        Available: {new Date(transaction.available_at).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-semibold text-lg flex items-center ${
                                    tabType === "available"
                                      ? "text-green-600"
                                      : tabType === "withdrawn"
                                        ? "text-purple-600"
                                        : "text-gray-900"
                                  }`}
                                >
                                  {tabType === "withdrawn" ? "-" : ""}     <img src='/riyal.svg' className="h-5 w-5 mr-1" />{transaction.amount?.toLocaleString()}
                                </div>
                                {transaction.commission_amount && (
                                  <div className="text-sm text-red-500 flex items-center">
                                    Commission:      <img src='/riyal.svg' className="h-3 w-3 mr-1" />{transaction.commission_amount}
                                  </div>
                                )}
                                {getStatusBadge(tabType)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div
                              className={`p-4 rounded-full mb-4 ${
                                tabType === "in_work"
                                  ? "bg-gray-100"
                                  : tabType === "in_review"
                                    ? "bg-blue-100"
                                    : tabType === "pending"
                                      ? "bg-yellow-100"
                                      : tabType === "available"
                                        ? "bg-green-100"
                                        : "bg-purple-100"
                              }`}
                            >
                              {getTransactionIcon(tabType)}
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">
                              No {formatCardTitle(tabType).toLowerCase()} transactions
                            </h3>
                            <p className="text-gray-500 text-center max-w-md">
                              You don't have any {formatCardTitle(tabType).toLowerCase()} transactions yet.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Wallet Configuration */}
            {walletData.config && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Wallet Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex ">
                      <span className="text-gray-500">Commission Rate:</span>
                      <span className="font-medium">{walletData.config.commission_rate}%</span>
                    </div>
                    <div className="flex ">
                      <span className="text-gray-500">Available Days:</span>
                      <span className="font-medium">{walletData.config.available_days} days</span>
                    </div>
                    <div className="flex ">
                      <span className="text-gray-500">Currency:</span>
                      <span className="font-medium">{walletData.config.currency}</span>
                    </div>
                    <div className="flex ">
                      <span className="text-gray-500 whitespace-nowrap">Withdrawal Limits:</span>
                      <span className="font-medium flex items-center space-x-1">
                           <div className="flex items-center mr-2">  <img src='/riyal.svg' className="h-3 w-3 mr-1" />{walletData.config.min_withdrawal} </div>-   <div className="flex items-center">   <img src='/riyal.svg' className="h-3 w-3 mr-1" />{walletData.config.max_withdrawal}</div>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Unable to load wallet data.</p>
          </div>
        )}
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && walletData && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          balance={walletData.wallet_summary?.available || 0}
          config={walletData.config}
        />
      )}
    </div>
  )
}
