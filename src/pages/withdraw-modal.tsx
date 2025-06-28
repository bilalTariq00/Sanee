"use client"

import { useState } from "react"
import { X, CreditCard, Building, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface WithdrawModalProps {
  onClose: () => void
  balance: number
  config?: {
    commission_rate: number
    available_days: number
    currency: string
    min_withdrawal: number
    max_withdrawal: number
  }
}

export default function WithdrawModal({ onClose, balance, config }: WithdrawModalProps) {
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleWithdraw = async () => {
    setIsProcessing(true)
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false)
      onClose()
      // You would typically show a success message here
    }, 2000)
  }

  const withdrawalFee = config
    ? (Number.parseFloat(amount) * config.commission_rate) / 100
    : Number.parseFloat(amount) * 0.03
  const netAmount = Number.parseFloat(amount) - withdrawalFee

  const minWithdrawal = config?.min_withdrawal || 10
  const maxWithdrawal = config?.max_withdrawal || balance

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Withdraw Funds</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Balance</span>
              <span className="text-lg font-semibold text-green-600">${balance.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={balance}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="method">Withdrawal Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select withdrawal method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                  <SelectItem value="paypal">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      PayPal
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {amount && Number.parseFloat(amount) > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Withdrawal Amount</span>
                  <span>${Number.parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Fee ({config?.commission_rate || 3}%)</span>
                  <span>-${withdrawalFee.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>You'll Receive</span>
                  <span>${netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Withdrawals typically take 1-3 business days to process. A 3% processing fee applies to all withdrawals.
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={
                !amount ||
                !method ||
                Number.parseFloat(amount) < minWithdrawal ||
                Number.parseFloat(amount) > Math.min(balance, maxWithdrawal) ||
                isProcessing
              }
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Processing..." : "Withdraw Funds"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
