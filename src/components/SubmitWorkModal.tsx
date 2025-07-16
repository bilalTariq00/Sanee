"use client"

import type React from "react"
import { useState } from "react"
import axios from "axios"
import Swal from "sweetalert2"
import config from "@/config"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "react-i18next"

interface SubmitWorkModalProps {
  show: boolean
  onClose: () => void
  contractId: number
  onSubmitted: () => void
}

function SubmitWorkModal({ show, onClose, contractId, onSubmitted }: SubmitWorkModalProps) {
  const { t } = useTranslation()
  const [note, setNote] = useState("")
  const [files, setFiles] = useState<FileList | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
  }

  const handleSubmit = async () => {
    if (!note.trim()) {
      Swal.fire("Error", "Please provide a note about your work submission.", "error")
      return
    }

    setSubmitting(true)
    const token = localStorage.getItem("token")
    const formData = new FormData()

    formData.append("seller_note", note)

    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append("seller_attachments[]", files[i])
      }
    }

    try {
      const response = await axios.post(`${config.API_BASE_URL}/contracts/${contractId}/submit-work`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })

      console.log("Work submission response:", response.data)

      Swal.fire(
        t("submit_modal.success_title") || "Success!",
        t("submit_modal.success_message") || "Your work has been submitted successfully!",
        "success",
      )

      // Reset form
      setNote("")
      setFiles(null)

      onClose()
      if (onSubmitted) onSubmitted()
    } catch (err) {
      console.error("Submit failed:", err)
      Swal.fire(
        t("submit_modal.error_title") || "Error",
        t("submit_modal.error_message") || "Failed to submit work. Please try again.",
        "error",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setNote("")
      setFiles(null)
      onClose()
    }
  }

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("submit_modal.title") || "Submit Your Work"}</DialogTitle>
          <DialogDescription>
            {t("submit_modal.description") ||
              "Provide details about your completed work and attach any relevant files."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="note">{t("submit_modal.message_label") || "Work Description"} *</Label>
            <Textarea
              id="note"
              placeholder={t("submit_modal.message_placeholder") || "Describe what you've completed..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="attachments">{t("submit_modal.attachments_label") || "Attachments (Optional)"}</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              disabled={submitting}
              accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              {t("submit_modal.attachment_hint") || "You can upload multiple files (images, documents, archives)"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {t("submit_modal.cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !note.trim()||!files}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? "Submitting..." : t("submit_modal.submit") || "Submit Work"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitWorkModal
