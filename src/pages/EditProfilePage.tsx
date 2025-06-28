"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import axios from "axios";
import config from "@/config";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  const [loading, setLoading] = useState(true);

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
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <input
                className="w-full p-3 border rounded-lg"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                className="w-full p-3 border rounded-lg"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                className="w-full p-3 border rounded-lg"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                className="w-full p-3 border rounded-lg"
                placeholder="Headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
              <textarea
                rows={3}
                className="w-full p-3 border rounded-lg"
                placeholder="Summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <input
                className="w-full p-3 border rounded-lg"
                placeholder="Country ID"
                type="number"
                value={countryId}
                onChange={(e) =>
                  setCountryId(Number(e.target.value) || "")
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImageFile(e.target.files?.[0] || null)
                }
              />
            </div>
          </section>

          {/* Password */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <input
              className="w-full p-3 border rounded-lg mb-4"
              type="password"
              placeholder="Current Password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg mb-4"
              type="password"
              placeholder="New Password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
            <input
              className="w-full p-3 border rounded-lg"
              type="password"
              placeholder="Confirm Password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </section>

          {/* Portfolios */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Portfolios</h2>
            {portfolios.map((p, i) => (
              <div key={i} className="border rounded-lg p-4 mb-4 space-y-2">
                <input
                  className="w-full p-2 border rounded"
                  placeholder="Title"
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
                  placeholder="Link"
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
                  placeholder="Description"
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
              <Plus className="h-5 w-5 mr-2" /> Add Portfolio
            </button>
          </section>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
