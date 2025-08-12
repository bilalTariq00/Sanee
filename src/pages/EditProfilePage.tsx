"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import axios from "axios";
import config from "@/config";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

interface PortfolioForm {
  id?: number;
  title: string;
  description: string;
  link: string;
  position: number;
  image?: File | null;      // new upload
  existing_url?: string;    // already stored
}

export default function EditProfilePage() {
   const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);
const { t, i18n } = useTranslation();
const isRTL = i18n.dir() === "rtl";
  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [Uid, setUid] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [countryId, setCountryId] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Categories & Skills
  const [categories, setCategories] = useState<number[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  // Portfolios
  const [portfolios, setPortfolios] = useState<PortfolioForm[]>([]);

  // Load profile on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${config.API_BASE_URL}/me`, {
          headers: auth,
        });

        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setHeadline(data.headline ?? "");
        setSummary(data.summary ?? "");
        setCountryId(data.country_id ?? "");
        setUid(data.uid ?? "");

        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setSkills(Array.isArray(data.skills) ? data.skills : []);

        if (Array.isArray(data.portfolios)) {
          setPortfolios(
            data.portfolios.map((p: any, idx: number) => ({
              id: p.id,
              title: p.title ?? "",
              description: p.description ?? "",
              link: p.link ?? "",
              position: p.position ?? idx,
              existing_url: p.image_url ?? p.image,
              image: null,
            }))
          );
        }
      } catch (err) {
        console.error("❌ Fetch failed:", err);
        toast.error("Unable to load profile.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit handler (POST with _method PUT)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fd = new FormData();
    fd.append("_method", "PUT"); // 🔑 Laravel method override

    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("username", username);
    fd.append("email", email);
    fd.append("headline", headline);
    fd.append("summary", summary);

    if (countryId) fd.append("country_id", String(countryId));
    if (imageFile) fd.append("image", imageFile);

    if (currentPw) {
      fd.append("current_password", currentPw);
      fd.append("new_password", newPw);
      fd.append("new_password_confirmation", confirmPw);
    }

    categories.forEach((c) => fd.append("categories[]", String(c)));
    skills.forEach((s) => fd.append("skills[]", s));

    portfolios.forEach((p, i) => {
      if (p.id) fd.append(`portfolios[${i}][id]`, String(p.id));
      fd.append(`portfolios[${i}][title]`, p.title);
      fd.append(`portfolios[${i}][description]`, p.description);
      fd.append(`portfolios[${i}][link]`, p.link);
      fd.append(`portfolios[${i}][position]`, String(p.position));
      if (p.image) fd.append(`portfolios[${i}][image]`, p.image);
    });

    try {
      await axios.post(`${config.API_BASE_URL}/profile`, fd, {
        headers: {
          ...auth,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("✅ Profile updated!");
      navigate(`/profile/${Uid}`);
    } catch (err) {
      console.error("❌ Update failed:", err);
      toast.error("Update failed — see console.");
    }
  }

  // Add portfolio
  const addPortfolio = () =>
    setPortfolios((p) => [
      ...p,
      { title: "", description: "", link: "", position: p.length, image: null },
    ]);

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      {t("edit_profile.loading")}
    </div>
  );
}

return (
  <div className="min-h-screen bg-gray-50">
    <main className="max-w-6xl mx-auto sm:px-6 lg:px-8 py-8">
      {/* Header */}
    <div className="flex flex-wrap items-center justify-between mb-6 gap-2 w-[90%] ">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center text-gray-600 hover:text-gray-900 mb-2 sm:mb-0 whitespace-nowrap"
  >
    {isRTL ? (
      <ArrowRight className="h-5 w-5 ml-2" />
    ) : (
      <ArrowLeft className="h-5 w-5 mr-2" />
    )}
    {t("edit_profile.back")}
  </button>
  <h1 className="text-2xl font-bold text-gray-900 truncate max-w-full">
    {t("edit_profile.title")}
  </h1>
</div>


      <form onSubmit={handleSubmit} className="space-y-6 w-[90%]">
        {/* Basic Info */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">{t("edit_profile.basic_info")}</h2>
          <div className="space-y-4">
            <input
              className="w-full p-3 border rounded-lg text-base sm:text-lg"
              placeholder={t("edit_profile.first_name")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg text-base sm:text-lg"
              placeholder={t("edit_profile.last_name")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg text-base sm:text-lg"
              placeholder={t("edit_profile.username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg text-base sm:text-lg"
              placeholder={t("edit_profile.headline")}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
            <textarea
              rows={3}
              className="w-full p-3 border rounded-lg text-base sm:text-lg"
              placeholder={t("edit_profile.summary")}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg text-base sm:text-lg"
              placeholder={t("edit_profile.country")}
              type="number"
              value={countryId}
              onChange={(e) => setCountryId(Number(e.target.value) || "")}
            />
            <div className="flex flex-col space-y-4">
            <label htmlFor="" className="font-bold">Update your image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
            </div>
          </div>
        </section>

        {/* Password */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">{t("edit_profile.password_section")}</h2>
          <input
            className="w-full p-3 border rounded-lg text-base sm:text-lg mb-4"
            type="password"
            placeholder={t("edit_profile.current_password")}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
          <input
            className="w-full p-3 border rounded-lg text-base sm:text-lg mb-4"
            type="password"
            placeholder={t("edit_profile.new_password")}
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <input
            className="w-full p-3 border rounded-lg text-base sm:text-lg"
            type="password"
            placeholder={t("edit_profile.confirm_password")}
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
        </section>
             
        {/* Portfolios */}
      {user?.account_type === 'seller' && (   
        <section className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">{t("edit_profile.portfolio_section")}</h2>
          {portfolios.map((p, i) => (
            <div key={i} className="border rounded-lg p-3 sm:p-4 mb-4 space-y-2">
              <input
                className="w-full p-2 border rounded"
                placeholder={t("edit_profile.portfolio_title")}
                value={p.title}
                onChange={(e) =>
                  setPortfolios((arr) => {
                    arr[i].title = e.target.value;
                    return [...arr];
                  })
                }
              />
              <input
                className="w-full p-2 border rounded"
                placeholder={t("edit_profile.portfolio_link")}
                value={p.link}
                onChange={(e) =>
                  setPortfolios((arr) => {
                    arr[i].link = e.target.value;
                    return [...arr];
                  })
                }
              />
              <textarea
                className="w-full p-2 border rounded"
                rows={2}
                placeholder={t("edit_profile.portfolio_description")}
                value={p.description}
                onChange={(e) =>
                  setPortfolios((arr) => {
                    arr[i].description = e.target.value;
                    return [...arr];
                  })
                }
              />
              {p.existing_url && !p.image && (
                <img
                  src={
                    p.existing_url.startsWith("http")
                      ? p.existing_url
                      : `${config.IMG_BASE_URL}/${p.existing_url}`
                  }
                  alt=""
                  className="w-full h-40 object-cover rounded"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPortfolios((arr) => {
                    arr[i].image = e.target.files?.[0] || null;
                    return [...arr];
                  })
                }
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addPortfolio}
            className="flex items-center px-4 py-2 bg-gray-100 rounded-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t("edit_profile.add_portfolio")}
          </button>
        </section>
)}
        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 sm:py-4 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            {t("edit_profile.save_changes")}
          </button>
        </div>
      </form>
    </main>
  </div>
);
}