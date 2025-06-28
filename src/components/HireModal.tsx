"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Gig {
  id: string
  title: string
  seller?: {
    first_name: string
    last_name: string
  }
}

interface HireModalProps {
  gig: Gig
  onClose: () => void
  onConfirm: (data: { gigId: string; message: string }) => void
}

export function HireModal({ gig, onClose, onConfirm }: HireModalProps) {
  const [message, setMessage] = useState("")

  const handleConfirm = () => {
    onConfirm({ gigId: gig.id, message })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            Hire {gig?.seller?.first_name} {gig?.seller?.last_name}
          </DialogTitle>
          <DialogDescription>
            You're about to hire this seller for their gig. Add a message to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Gig</Label>
            <p className="text-sm text-gray-600 mt-1">{gig.title}</p>
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message to Seller
            </Label>
            <Textarea
              id="message"
              placeholder="Add a message to the seller..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
