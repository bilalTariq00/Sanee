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
import { useTranslation } from "react-i18next";


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
const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm({ gigId: gig.id, message })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">
            {t("hire_modal.title")} {gig?.seller?.first_name} {gig?.seller?.last_name}
          </DialogTitle>
          <DialogDescription>
            {t("hire_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">{t("hire_modal.gig_label")}</Label>
            <p className="text-sm text-gray-600 mt-1">{gig.title}</p>
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
               {t("hire_modal.message_label")}
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
            {t("hire_modal.cancel")}
          </Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
           {t("hire_modal.proceed")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
