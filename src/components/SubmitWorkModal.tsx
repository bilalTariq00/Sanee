import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import config from "@/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
function SubmitWorkModal({ show, onClose, contractId, onSubmitted }) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("seller_note", note);
    for (let i = 0; i < files.length; i++) {
      formData.append("seller_attachments[]", files[i]);
    }

    try {
      await axios.post(
        `${config.API_BASE_URL}/contracts/${contractId}/submit-work`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Swal.fire( t("submit_modal.success_title"),
        t("submit_modal.success_message"),
        "success");
      onClose();
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error("Submit failed:", err);
      Swal.fire( t("submit_modal.error_title"),
        t("submit_modal.error_message"),
        "error");
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("submit_modal.title")}</DialogTitle>
          <DialogDescription>
           {t("submit_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="note">{t("submit_modal.message_label")}</Label>
            <Textarea
              id="note"
              placeholder={t("submit_modal.message_placeholder")}
              value={note}
              required
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="attachments">{t("submit_modal.attachments_label")}</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
                {t("submit_modal.attachment_hint")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("submit_modal.cancel")}</Button>
          <Button variant="success" onClick={handleSubmit}>{t("submit_modal.submit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SubmitWorkModal;
