// Updated EditContractModal using ShadCN UI Dialog

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function EditContractModal({ show, onClose, contract, onSave }) {
  const [price, setPrice] = useState("");

  useEffect(() => {
    setPrice(contract?.price || "");
  }, [contract]);

  const handleSave = () => {
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      toast("Please enter a valid price.");
      return;
    }
    onSave({ id: contract.id, price: parseFloat(price) });
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contract</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            value={price}
            min={1}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter new price"
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditContractModal;
