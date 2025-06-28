import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, X } from "lucide-react";

function SortableImageItem({ img, index, handleRemoveImage, config }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const imageUrl =
    img.source === "existing"
      ? img.image_path.startsWith("http")
        ? img.image_path
        : `${config.IMG_BASE_URL}/storage/${img.image_path}`
      : URL.createObjectURL(img.file);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-[100px] h-[100px] mr-3 mb-3 border rounded overflow-hidden"
    >
      <img
        src={imageUrl}
        alt={`gig-${index}`}
        className="w-full h-full object-cover"
      />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute bottom-0 left-0 bg-muted px-1 text-xs text-muted-foreground flex items-center gap-1 cursor-grab"
      >
        <GripVertical className="w-3 h-3" />
        Drag
      </div>

      {/* Image order badge */}
      <Badge
        variant="secondary"
        className="absolute top-0 left-0 rounded-none rounded-br px-2 py-0.5 text-xs"
      >
        {index + 1}
      </Badge>

      {/* Remove button */}
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute top-0 right-0 w-6 h-6 p-0 rounded-none rounded-bl z-10"
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveImage(img);
        }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default SortableImageItem;
