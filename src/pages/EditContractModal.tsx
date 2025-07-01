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
import { useTranslation } from "react-i18next";

function EditContractModal({ show, onClose, contract, onSave }) {
  const { t } = useTranslation();
  const [price, setPrice] = useState("");

  useEffect(() => {
    setPrice(contract?.price || "");
  }, [contract]);

  const handleSave = () => {
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      toast(t("edit_contract.invalid_price"));
      return;
    }
    onSave({ id: contract.id, price: parseFloat(price) });
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("edit_contract.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="price">{t("edit_contract.price_label")}</Label>
          <Input
            id="price"
            type="number"
            value={price}
            min={1}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={t("edit_contract.price_placeholder")}
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {t("edit_contract.cancel")}
          </Button>
          <Button onClick={handleSave}>
            {t("edit_contract.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditContractModal;
