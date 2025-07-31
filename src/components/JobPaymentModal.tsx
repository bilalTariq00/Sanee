"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const JobPaymentModal = ({
  gig,
  onClose,
  onConfirm,
  defaultMessage = "",
  defaultPrice = "",
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState(defaultMessage);
  const [price, setPrice] = useState(defaultPrice);

  const handleConfirm = () => {
    if (!gig?.gig_uid) {
      return toast.error(t("payment_modal.no_gig"));
    }

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      return toast.error(t("payment_modal.invalid_price"));
    }

    onConfirm({
      gig_uid: gig.gig_uid,
      message,
      price: parseFloat(price),
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-white border-red-600 text-red-800">
        <DialogHeader>
          <DialogTitle className="text-red-700">
            💰 {t("payment_modal.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-red-600">
            {t("payment_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              {t("payment_modal.price_label")}
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t("payment_modal.price_placeholder")}
              className="border border-red-500 text-red-900 placeholder:text-red-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              {t("payment_modal.message_label")}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("payment_modal.message_placeholder")}
              rows={3}
              className="border border-red-500 text-red-900 placeholder:text-red-300"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="default"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConfirm}
          >
            {t("payment_modal.proceed")}
          </Button>
          <DialogClose asChild>
            <Button variant="secondary" className="border-red-600 text-red-700">
              {t("payment_modal.cancel")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobPaymentModal;
