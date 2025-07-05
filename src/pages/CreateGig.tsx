import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Trash2, Upload } from "lucide-react";
import axios from "axios";
import config from "../config";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface Skill {
  label: string;
  value: string;
}

interface ImageFile {
  file: File;
  preview: string;
}

function CreateGig() {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    delivery_time: "",
    price: "",
    tags: ""
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [skillsList, setSkillsList] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
const { t, i18n } = useTranslation();
  const token = localStorage.getItem("token");
const isRTL = i18n.language === "ar";
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCategories(res.data);
    } catch (err) {
      console.error("Category fetch failed:", err);
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/categories/${categoryId}/subcategories`);
      setSubcategories(res.data);
    } catch (err) {
      console.error("Subcategory fetch failed:", err);
      setSubcategories([]);
    }
  };

  const fetchSkills = async (subcategoryId: string) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/subcategory/${subcategoryId}/skills`);
      if (Array.isArray(res.data)) {
        const formattedSkills = res.data.map((skill: string) => ({
          label: skill,
          value: skill
        }));
        setSkillsList(formattedSkills);
      } else {
        setSkillsList([]);
      }
    } catch (err) {
      console.error("Skill fetch failed:", err);
      setSkillsList([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "category_id") {
      setForm({ ...form, category_id: value, subcategory_id: "" });
      fetchSubcategories(value);
      setSkillsList([]);
      setSelectedSkills([]);
    } else if (name === "subcategory_id") {
      setForm({ ...form, subcategory_id: value });
      fetchSkills(value);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages([...images, ...newFiles]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddSkill = (skillValue: string) => {
    const skill = skillsList.find(s => s.value === skillValue) || { label: skillValue, value: skillValue };
    if (!selectedSkills.find(s => s.value === skill.value)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill.value !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = form.tags.split(",").map(tag => tag.trim()).filter(tag => tag !== "");
    const skillsArray = selectedSkills.map(s => s.value);

    const payload = {
      ...form,
      tags: tagsArray,
      skills: skillsArray,
    };

    try {
      const response = await axios.post(`${config.API_BASE_URL}/seller/gigs`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const gigId = response.data.gig.id;

      for (let i = 0; i < images.length; i++) {
        const formData = new FormData();
        formData.append("image", images[i].file);
        formData.append("gig_id", gigId);
        formData.append("image_order", (i + 1).toString());

        await axios.post(`${config.API_BASE_URL}/seller/gigs/upload-image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast("Gig created successfully!");
      navigate("/manage-gigs");
    } catch (err) {
      console.error(err);
      toast("Failed to create gig");
    }
  };

  return (
  <div className="min-h-screen bg-gray-50">
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center mb-6">
        {/* <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
{isRTL ? (
    <ArrowRight className="h-5 w-5 mr-2" />
  ) : (
    <ArrowLeft className="h-5 w-5 mr-2" />
  )} {t("create_gigs.back")}
        </button> */}
        <h1 className="text-2xl font-bold text-gray-900">{t("create_gigs.title")}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.basic_info")}</h2>
          <div className="space-y-4">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={t("create_gigs.title_placeholder")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder={t("create_gigs.description_placeholder")}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
        </div>

        {/* Category & Subcategory */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.category_section")}</h2>
          <div className="space-y-4">
            <Select
              value={form.category_id}
              onValueChange={(value) => handleSelectChange("category_id", value)}
            >
              <SelectTrigger className="w-full border border-gray-300 focus:ring-2 focus:ring-red-500">
 <SelectValue>
      {
        categories.find(cat => String(cat.id) === form.category_id)?.name
        ?? t('create_gigs.select_category')
      }
    </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {subcategories.length > 0 && (
              <Select
                value={form.subcategory_id}
                onValueChange={(value) => handleSelectChange("subcategory_id", value)}
              >
                <SelectTrigger className="w-full border border-gray-300 focus:ring-2 focus:ring-red-500">
                  <SelectValue>
      {
        // find the matching subcategory name, or show placeholder
        subcategories.find(sub => String(sub.id) === form.subcategory_id)?.name
        ?? t('create_gigs.select_subcategory')
      }
    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.skills_section")}</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <span key={skill.value} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 text-red-600">
                  {skill.label}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.value)}
                    className="ml-2 text-red-500 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {skillsList.length > 0 ? (
              <div className="flex gap-2">
                <Select
                  value={newSkill}
                  onValueChange={(value) => setNewSkill(value)}
                >
                  <SelectTrigger className="flex-1 border border-gray-300 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder={t("create_gigs.choose_skill")} />
                  </SelectTrigger>
                  <SelectContent>
                    {skillsList.map((skill) => (
                      <SelectItem key={skill.value} value={skill.value}>{skill.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => {
                    if (newSkill) {
                      handleAddSkill(newSkill);
                      setNewSkill("");
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t("create_gigs.add_skill")}
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("create_gigs.no_skills")}</p>
            )}
          </div>
        </div>

        {/* Pricing & Delivery */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.pricing_delivery")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder={t("create_gigs.price_placeholder")}
              min="5"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <input
              type="number"
              name="delivery_time"
              value={form.delivery_time}
              onChange={handleChange}
              placeholder={t("create_gigs.delivery_placeholder")}
              min="1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.tags_section")}</h2>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder={t("create_gigs.tags_placeholder")}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">{t("create_gigs.tags_note")}</p>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.images_section")}</h2>
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img src={image.preview} alt={`Gig ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition-colors"
            onClick={() => document.getElementById("gig-images")?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">{t("create_gigs.upload_note")}</p>
            <input
              id="gig-images"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            {t("create_gigs.create_btn")}
          </button>
        </div>
      </form>
    </main>
  </div>
)
}
export default CreateGig;

