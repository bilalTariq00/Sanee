"use client";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import config from "../config";
import Select from "react-select";
import {
  Input
} from "@/components/ui/input";
import {
  Textarea
} from "@/components/ui/textarea";
import {
  Button
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";


const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    experience_level: "entry",
    visibility: "public",
    location_type: "remote",
    category_id: "",
    sub_category_id: "",
    new_attachments: null,
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCategories();
    fetchJob();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
     setCategories(res.data.data.categories);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchSubcategories = async (categoryId) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/categories/${categoryId}/subcategories`);
      setSubcategories(res.data.data.subcategories);
    } catch (err) {
      console.error("Failed to fetch subcategories:", err);
    }
  };

  const fetchSkills = async (subcategoryId) => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/subcategory/${subcategoryId}/skills`);
      const formatted = res.data.data.skills.map(skill => ({ label: skill, value: skill }));
      setSkillsList(formatted);
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  };

  const fetchJob = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/buyer/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const job = res.data;
      const preSelectedSkills = (job.skills || []).map(skill => ({ label: skill, value: skill }));

      setFormData({
        ...job,
        new_attachments: null,
      });

      setSelectedSkills(preSelectedSkills);

      if (job.category_id) fetchSubcategories(job.category_id);
      if (job.sub_category_id) fetchSkills(job.sub_category_id);
    } catch (err) {
      console.error("Error fetching job:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category_id") {
      setFormData({ ...formData, category_id: value, sub_category_id: "" });
      fetchSubcategories(value);
      setSkillsList([]);
      setSelectedSkills([]);
    } else if (name === "sub_category_id") {
      setFormData({ ...formData, sub_category_id: value });
      fetchSkills(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("_method", "PUT");
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("budget", formData.budget);
    data.append("experience_level", formData.experience_level);
    data.append("visibility", formData.visibility);
    data.append("location_type", formData.location_type);
    data.append("category_id", formData.category_id);
    data.append("sub_category_id", formData.sub_category_id);

    selectedSkills.forEach(skill => data.append("skills[]", skill.value));
    if (formData.new_attachments) {
      for (let i = 0; i < formData.new_attachments.length; i++) {
        data.append("attachments[]", formData.new_attachments[i]);
      }
    }

    try {
      await axios.post(`${config.API_BASE_URL}/buyer/jobs/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/manage-jobs");
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  return (
  <div className="max-w-4xl mx-auto py-6 px-4">
    <Card>
      <CardHeader>
        <CardTitle>{t("edit_job.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("edit_job.title_label")}</Label>
            <Input name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div>
            <Label>{t("edit_job.description_label")}</Label>
            <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} required />
          </div>

          <div>
            <Label>{t("edit_job.budget_label")}</Label>
            <Input type="number" name="budget" value={formData.budget} onChange={handleChange} required />
          </div>

          <div>
            <Label>{t("edit_job.category_label")}</Label>
            <select
              name="category_id"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={formData.category_id}
              onChange={handleChange}
            >
              <option value="">{t("edit_job.category_placeholder")}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {subcategories.length > 0 && (
            <div>
              <Label>{t("edit_job.subcategory_label")}</Label>
              <select
                name="sub_category_id"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={formData.sub_category_id}
                onChange={handleChange}
              >
                <option value="">{t("edit_job.subcategory_placeholder")}</option>
                {subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {skillsList.length > 0 && (
            <div>
              <Label>{t("edit_job.skills_label")}</Label>
              <Select
                isMulti
                name="skills"
                options={skillsList}
                value={selectedSkills}
                onChange={setSelectedSkills}
                className="react-select-container"
                classNamePrefix="select"
                placeholder={t("edit_job.skills_placeholder")}
              />
            </div>
          )}

          <div>
            <Label>{t("edit_job.experience_label")}</Label>
            <select
              name="experience_level"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={formData.experience_level}
              onChange={handleChange}
            >
              <option value="entry">{t("edit_job.entry")}</option>
              <option value="intermediate">{t("edit_job.intermediate")}</option>
              <option value="expert">{t("edit_job.expert")}</option>
            </select>
          </div>

          <div>
            <Label>{t("edit_job.visibility_label")}</Label>
            <select
              name="visibility"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={formData.visibility}
              onChange={handleChange}
            >
              <option value="public">{t("edit_job.public")}</option>
              <option value="private">{t("edit_job.private")}</option>
            </select>
          </div>

          <div>
            <Label>{t("edit_job.location_label")}</Label>
            <select
              name="location_type"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={formData.location_type}
              onChange={handleChange}
            >
              <option value="remote">{t("edit_job.remote")}</option>
              <option value="onsite">{t("edit_job.onsite")}</option>
            </select>
          </div>

          {formData.attachments && formData.attachments.length > 0 && (
            <div>
              <Label>{t("edit_job.attachments_old")}</Label>
              <ul className="list-disc pl-6">
                {formData.attachments.map((file, index) => (
                  <li key={index}>
                    <a
                      href={`${config.IMG_BASE_URL}/storage/${file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {t("edit_job.view_attachment", { index: index + 1 })}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Label>{t("edit_job.attachments_new")}</Label>
            <Input
              type="file"
              name="attachments"
              multiple
              onChange={(e) => setFormData({ ...formData, new_attachments: e.target.files })}
            />
          </div>

          <Button type="submit">{t("edit_job.update_button")}</Button>
        </form>
      </CardContent>
    </Card>
  </div>
);
};

export default EditJob;
