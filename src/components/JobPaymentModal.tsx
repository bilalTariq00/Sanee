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

const JobPaymentModal = ({
  gig,
  onClose,
  onConfirm,
  defaultMessage = "",
  defaultPrice = "",
}) => {
  const [message, setMessage] = useState(defaultMessage);
  const [price, setPrice] = useState(defaultPrice);

  const handleConfirm = () => {
    if (!gig?.gig_uid) {
      return toast.error("No gig information found.");
    }

    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      return toast.error("Please enter a valid price.");
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
          <DialogTitle className="text-red-700">💰 Confirm Payment</DialogTitle>
          <DialogDescription className="text-sm text-red-600">
            Set a payment amount and optional message for the seller.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              Price (USD)
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Enter price"
              className="border border-red-500 text-red-900 placeholder:text-red-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              Message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message to the seller..."
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
            Proceed to Checkout
          </Button>
          <DialogClose asChild>
            <Button variant="secondary" className="border-red-600 text-red-700">
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobPaymentModal;
