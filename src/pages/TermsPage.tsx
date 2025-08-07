"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

const TermsPage = () => {
  const [terms, setTerms] = useState("");
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const lang = i18n.language || "en";
        const res = await axios.get(`${config.API_BASE_URL}/settings?lang=${lang}`);
        setTerms(res.data.data.legal.terms_conditions || "");
      } catch (err) {
        console.error("Failed to fetch terms and conditions", err);
      }
    };
    fetchTerms();
  }, [i18n.language]);

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
             <Link to="/">
                            <img src="/sanee.png" alt="logo" className="w-14 h-10" />
                            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-red-500 font-medium">
                {t("landing.header.signin")}
              </Link>
              <Link to="/signup" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
                {t("landing.header.getStarted")}
              </Link>
            </div>
          </div>
        </div>
      </header>
      <div className="min-h-screen bg-white p-6 md:p-12 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-red-700">{t("landing.footer.links.terms")}</h1>
        <div
          className="prose max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: terms }}
        />
      </div>
      <Footer />
    </>
  );
};

export default TermsPage;
