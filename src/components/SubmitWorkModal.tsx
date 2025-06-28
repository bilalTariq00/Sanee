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

function SubmitWorkModal({ show, onClose, contractId, onSubmitted }) {
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

      Swal.fire("Submitted!", "Work submitted successfully!", "success");
      onClose();
      if (onSubmitted) onSubmitted();
    } catch (err) {
      console.error("Submit failed:", err);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Work</DialogTitle>
          <DialogDescription>
            Please add a message or upload files to share your completed work with the buyer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="note">Message (optional)</Label>
            <Textarea
              id="note"
              placeholder="Write a note to the buyer..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="attachments">Attachments (optional)</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              You can upload multiple files. Max 2MB each.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="success" onClick={handleSubmit}>Submit Work</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SubmitWorkModal;
