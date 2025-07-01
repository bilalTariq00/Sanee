import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import config from "../config";
import SortableImageItem from "@/components/SortableImageItem";
import ReactSelect from "react-select";
import { useTranslation } from "react-i18next";

import {
  DndContext,
  closestCenter
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { toast } from "sonner";

function EditGig() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    delivery_time: "",
    price: "",
    tags: ""
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allImages, setAllImages] = useState([]);
const { t } = useTranslation();

  useEffect(() => {
    fetchGig();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${config.API_BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCategories(res.data);
  };

  const fetchSubcategories = async (categoryId) => {
    const res = await axios.get(`${config.API_BASE_URL}/categories/${categoryId}/subcategories`);
    setSubcategories(res.data);
  };

  const fetchGig = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${config.API_BASE_URL}/seller/gigs/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const gig = res.data;
    setForm({
      title: gig.title,
      description: gig.description,
      category_id: gig.category_id,
      subcategory_id: gig.subcategory_id,
      delivery_time: gig.delivery_time,
      price: gig.price,
      tags: Array.isArray(gig.tags) ? gig.tags.join(",") : gig.tags
    });
    const formattedImages = gig.images.map((img) => ({
      id: `existing-${img.id}`,
      image_path: img.image_path,
      db_id: img.id,
      source: "existing"
    }));
    setAllImages(formattedImages);
    fetchSubcategories(gig.category_id);
    let gigSkills = Array.isArray(gig.skills) ? gig.skills : [];
    if (typeof gig.skills === "string") {
      try {
        const parsed = JSON.parse(gig.skills);
        gigSkills = Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    if (gig.subcategory_id) fetchSkills(gig.subcategory_id, gigSkills);
  };

  const fetchSkills = async (subcategoryId, preselected = []) => {
    const res = await axios.get(`${config.API_BASE_URL}/subcategory/${subcategoryId}/skills`);
    const formattedSkills = res.data.map((skill) => ({ label: skill, value: skill }));
    setSkillsList(formattedSkills);
    const matched = formattedSkills.filter((opt) =>
      preselected?.some((skill) => skill.toLowerCase().trim() === opt.value.toLowerCase().trim())
    );
    setSelectedSkills(matched);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    if (name === "category_id") {
      setForm({ ...form, category_id: value, subcategory_id: "" });
      fetchSubcategories(value);
    } else if (name === "subcategory_id") {
      setForm({ ...form, subcategory_id: value });
      fetchSkills(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload = {
      ...form,
      tags: form.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag),
      skills: selectedSkills.map((s) => s.value)
    };
    await axios.put(`${config.API_BASE_URL}/seller/gigs/${id}`, payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    let order = 1;
    for (const img of allImages) {
      if (img.source === "local") {
        const formData = new FormData();
        formData.append("image", img.file);
        formData.append("gig_id", id);
        formData.append("image_order", order);
        await axios.post(`${config.API_BASE_URL}/seller/gigs/upload-image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      } else {
        await axios.post(
          `${config.API_BASE_URL}/seller/gigs/update-image-order`,
          { image_id: img.db_id, image_order: order },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      order++;
    }
    toast("Gig updated successfully!");
    navigate("/manage-gigs");
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = allImages.findIndex((img) => img.id === active.id);
    const newIndex = allImages.findIndex((img) => img.id === over.id);
    setAllImages((images) => arrayMove(images, oldIndex, newIndex));
  };

  const handleRemoveImage = async (img) => {
    if (img.source === "existing") {
      const token = localStorage.getItem("token");
      await axios.delete(`${config.API_BASE_URL}/seller/gigs/delete-image`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { image_id: img.db_id }
      });
    }
    setAllImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const handleNewImages = (files) => {
    const newImgs = Array.from(files).map((file) => ({
      id: `local-${Date.now()}-${file.name}`,
      file,
      source: "local"
    }));
    setAllImages((prev) => [...prev, ...newImgs]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{t("edit_gig.title")}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>{t("edit_gig.title_label")}</Label>
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={t("edit_gig.title_placeholder")}
              className="focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <Label>{t("edit_gig.description_label")}</Label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
             placeholder={t("edit_gig.description_placeholder")}
              className="focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
           <Label>{t("edit_gig.category_label")}</Label>
            <Select
              value={form.category_id}
              onValueChange={(value) => handleSelectChange("category_id", value)}
              
            >
              <SelectTrigger className="w-full border focus:ring-2 focus:ring-red-500">
                <SelectValue placeholder={t("edit_gig.category_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {subcategories.length > 0 && (
            <div>
             <Label>{t("edit_gig.subcategory_label")}</Label>
              <Select
                value={form.subcategory_id}
                onValueChange={(value) => handleSelectChange("subcategory_id", value)}
              >
                <SelectTrigger className="w-full border focus:ring-2 focus:ring-red-500">
                  <SelectValue placeholder={t("edit_gig.subcategory_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
             <Label>{t("edit_gig.delivery_label")}</Label>
              <Input
                name="delivery_time"
                type="number"
                value={form.delivery_time}
                onChange={handleChange}
                placeholder={t("edit_gig.delivery_placeholder")}
                className="focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <Label>{t("edit_gig.price_label")}</Label>
              <Input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
               placeholder={t("edit_gig.price_placeholder")}
                className="focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div>
            <Label>{t("edit_gig.tags_label")}</Label>
            <Input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder={t("edit_gig.tags_placeholder")}
              className="focus:ring-2 focus:ring-red-500"
            />
          </div>
          {skillsList.length > 0 && (
            <div>
              <Label>{t("edit_gig.skills_label")}</Label>
              <ReactSelect
                isMulti
                name="skills"
                options={skillsList}
                value={selectedSkills}
                onChange={setSelectedSkills}
                placeholder={t("edit_gig.skills_placeholder")}
              />
            </div>
          )}
          <div>
            <Label>{t("edit_gig.images_label")}</Label>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={allImages.map((img) => img.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-wrap gap-4">
                  {allImages.map((img, index) => (
                    <SortableImageItem
                      key={img.id}
                      img={img}
                      index={index}
                      handleRemoveImage={handleRemoveImage}
                      config={config}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleNewImages(e.target.files)}
              className="mt-2"
            />
          </div>
          <Button type="submit" className="bg-red-500 hover:bg-red-600 text-white">
            {t("edit_gig.update_button")}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default EditGig;
