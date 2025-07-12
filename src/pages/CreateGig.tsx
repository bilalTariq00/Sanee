"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Trash2, Upload } from "lucide-react"
import axios from "axios"
import config from "../config"
import { useTranslation } from "react-i18next"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
   skills: string[] 
}

interface Skill {
  label: string
  value: string
}

interface ImageFile {
  file: File
  preview: string
}

function CreateGig() {
  const navigate = useNavigate()
  const [images, setImages] = useState<ImageFile[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    delivery_time: "",
    price: "",
    tags: "",
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [skillsList, setSkillsList] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([])
  const [newSkill, setNewSkill] = useState("")
  const { t, i18n } = useTranslation()
  const token = localStorage.getItem("token")
  const isRTL = i18n.language === "ar"

  useEffect(() => {
    fetchCategories()
  }, [])

  // Using your working fetchCategories logic
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log("Categories API response:", res.data) // Debug log

      let categoriesData = []

      // Handle different possible response structures
      if (res.data?.data?.categories && Array.isArray(res.data.data.categories)) {
        categoriesData = res.data.data.categories
      } else if (Array.isArray(res.data?.data)) {
        categoriesData = res.data.data
      } else if (Array.isArray(res.data)) {
        categoriesData = res.data
      } else if (res.data?.categories && Array.isArray(res.data.categories)) {
        categoriesData = res.data.categories
      } else {
        console.error("Unexpected categories response structure:", res.data)
        categoriesData = []
      }

      // Ensure each category has the correct structure
      const formattedCategories = categoriesData.map((cat: any) => ({
        id: String(cat.id || cat.category_id || cat.value || ""),
        name: cat.name || cat.title || cat.label || String(cat),
      }))

      console.log("Formatted categories:", formattedCategories) // Debug log
      setCategories(formattedCategories)
    } catch (err: any) {
      console.error("Category fetch failed:", err)
      // Set fallback categories on error
      setCategories([
        { id: "1", name: "Web Development" },
        { id: "2", name: "Graphic Design" },
        { id: "3", name: "Writing" },
        { id: "4", name: "Marketing" },
      ])
    }
  }

  // Using your working fetchSubcategories logic
  const fetchSubcategories = async (categoryId: string) => {
  try {
    const res = await axios.get(
      `${config.API_BASE_URL}/categories/${categoryId}/subcategories`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    console.log("Subcategories API response:", res.data) // Debug log

    // 1. Drill into the right spot
    const rawSubs: any[] = res.data?.data?.subcategories ?? []

    // 2. Map, preserving skills
    const formattedSubcategories: Subcategory[] = rawSubs.map((sub) => {
      // normalize skills to a string[]
      const skillsRaw = sub.skills
      const skills: string[] = Array.isArray(skillsRaw)
        ? skillsRaw
        : skillsRaw && typeof skillsRaw === "object"
        ? Object.values(skillsRaw).filter(v => typeof v === "string") as string[]
        : []

      return {
        id: String(sub.id),
        name: sub.name,
        skills,                // carry the array of skill strings
      }
    })

    setSubcategories(formattedSubcategories)
  } catch (err) {
    console.error("Subcategory fetch failed:", err)
    setSubcategories([])
  }
}


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
  if (name === "category_id") {
    // When category changes, clear subcategory and skills
    setForm({ ...form, category_id: value, subcategory_id: "" });
    fetchSubcategories(value);
    setSkillsList([]);
    setSelectedSkills([]);
    setNewSkill("");
  } else if (name === "subcategory_id") {
    // Update form
    setForm({ ...form, subcategory_id: value });

    // Look up the chosen subcategory
    const sub = subcategories.find((s) => s.id === value);

    // Pull its skills array (or default to empty)
    const skillStrings = sub?.skills ?? [];

    // Map into your Skill type
    const formatted: Skill[] = skillStrings.map((s) => ({
      label: s,
      value: s,
    }));

    // Update state
    setSkillsList(formatted);
    setSelectedSkills([]);  // clear any previously selected skills
    setNewSkill("");        // reset the dropdown value
  }
};



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
      setImages([...images, ...newFiles])
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleAddSkill = (skillValue: string) => {
    const skill = skillsList.find((s) => s.value === skillValue) || { label: skillValue, value: skillValue }
    if (!selectedSkills.find((s) => s.value === skill.value)) {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter((skill) => skill.value !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const tagsArray = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "")
    const skillsArray = selectedSkills.map((s) => s.value)

    const payload = {
      ...form,
      tags: tagsArray,
      skills: skillsArray,
    }

    try {
      const response = await axios.post(`${config.API_BASE_URL}/seller/gigs`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const gigId = response.data.gig.id

      // Upload images
      for (let i = 0; i < images.length; i++) {
        const formData = new FormData()
        formData.append("image", images[i].file)
        formData.append("gig_id", gigId)
        formData.append("image_order", (i + 1).toString())

        await axios.post(`${config.API_BASE_URL}/seller/gigs/upload-image`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        })
      }

      toast("Gig created successfully!")
      navigate("/manage-gigs")
    } catch (err) {
      console.error(err)
      toast("Failed to create gig")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" /> {t("back") || "Back"}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t("create_gigs.title") || "Create New Gig"}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("create_gigs.basic_info") || "Basic Information"}
            </h2>
            <div className="space-y-4">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder={t("create_gigs.title_placeholder") || "Gig Title *"}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder={t("create_gigs.description_placeholder") || "Description *"}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("create_gigs.category_section") || "Category"}
            </h2>
            <div className="space-y-4">
              <Select value={form.category_id} onValueChange={(value) => handleSelectChange("category_id", value)}>
                <SelectTrigger className="w-full border border-gray-300 focus:ring-2 focus:ring-red-500">
                  <SelectValue placeholder={t("create_gigs.select_category") || "Select Category"} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {subcategories.length > 0 && (
                <Select
                  value={form.subcategory_id}
                  onValueChange={(value) => handleSelectChange("subcategory_id", value)}
                >
                  <SelectTrigger className="w-full border border-gray-300 focus:ring-2 focus:ring-red-500">
                    <SelectValue placeholder={t("create_gigs.select_subcategory") || "Select Subcategory"} />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Skills */}
         <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
  <h2 className="text-xl font-semibold text-gray-900 mb-4">
    {t("create_gigs.skills_section") || "Skills"}
  </h2>
  <div className="space-y-4">
    {/* Already selected skills */}
    <div className="flex flex-wrap gap-2">
      {selectedSkills.map((skill) => (
        <span
          key={skill.value}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 text-red-600"
        >
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

    {/* Skills dropdown */}
    {skillsList.length > 0 ? (
      <div className="flex gap-2">
        <Select value={newSkill} onValueChange={setNewSkill}>
          <SelectTrigger className="flex-1 border border-gray-300 focus:ring-2 focus:ring-red-500">
            <SelectValue placeholder={t("create_gigs.choose_skill") || "Choose a skill"} />
          </SelectTrigger>
          <SelectContent>
            {skillsList.map((skill) => (
              <SelectItem key={skill.value} value={skill.value}>
                {skill.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => {
            if (newSkill) {
              handleAddSkill(newSkill)
              setNewSkill("")
            }
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          {t("create_gigs.add_skill") || "Add"}
        </button>
      </div>
    ) : form.subcategory_id ? (
      <p className="text-gray-500">No skills available for this subcategory.</p>
    ) : (
      <p className="text-gray-500">Select a subcategory to see skills.</p>
    )}
  </div>
</div>

          {/* Pricing & Delivery */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("create_gigs.pricing_delivery") || "Pricing & Delivery"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder={t("create_gigs.price_placeholder") || "Price (USD) *"}
                min="5"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <input
                type="number"
                name="delivery_time"
                value={form.delivery_time}
                onChange={handleChange}
                placeholder={t("create_gigs.delivery_placeholder") || "Delivery Time (Days) *"}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t("create_gigs.tags_section") || "Tags"}</h2>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder={t("create_gigs.tags_placeholder") || "logo design, branding, creative"}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {t("create_gigs.tags_note") || "Add up to 5 search tags, separated by commas"}
            </p>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t("create_gigs.images_section") || "Gig Images"}
            </h2>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image.preview || "/placeholder.svg"}
                      alt={`Gig ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
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
              <p className="mt-2 text-sm text-gray-500">
                {t("create_gigs.upload_note") || "Click to upload gig images"}
              </p>
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
              {t("create_gigs.create_btn") || "Create Gig"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default CreateGig
