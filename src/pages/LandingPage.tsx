import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Video,
  Mic,
  Palette,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Globe2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"project" | "creator">("project");
   const [menuOpen, setMenuOpen] = useState(false);
  
  const { t } = useTranslation();
 const [language, setLanguage] = useState(() => {
    const savedLang = sessionStorage.getItem('lang') || 'en';
    i18n.changeLanguage(savedLang);
    return savedLang;
  });
    const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };
  const isRTL = language === 'ar';

  useEffect(() => {
    const dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    sessionStorage.setItem('lang', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  const categories = [
    { icon: Camera, title: t("landing.categories.photography.title"), description: t("landing.categories.photography.desc"), count: "1,234+ creators" },
    { icon: Video, title: t("landing.categories.video.title"), description: t("landing.categories.video.desc"), count: "856+ creators" },
    { icon: Mic, title: t("landing.categories.voice.title"), description: t("landing.categories.voice.desc"), count: "643+ creators" },
    { icon: Palette, title: t("landing.categories.graphic.title"), description: t("landing.categories.graphic.desc"), count: "1,567+ creators" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
  <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-16 py-3 sm:h-16">
          <img src="/sanee.png" className="h-12 sm:h-16 w-auto" alt="Logo" />

          {/* Hamburger button for mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 rounded-md text-gray-700 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop & tablet buttons */}
          <nav className="hidden sm:flex items-center space-x-3 max-w-[calc(100vw-96px)]">
            <Link
              to="/login"
              className="min-w-[80px] px-3 py-2 text-center rounded-md font-medium text-gray-700 hover:text-red-500 whitespace-nowrap truncate"
            >
              {t("landing.header.signin")}
            </Link>

            <Link
              to="/signup"
              className="min-w-[110px] px-4 py-2 rounded-md font-medium text-white bg-red-500 hover:bg-red-600 whitespace-nowrap truncate text-center"
            >
              {t("landing.header.getStarted")}
            </Link>

            <button
              onClick={toggleLanguage}
              className="min-w-[100px] flex items-center gap-2 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-red-500 whitespace-nowrap truncate"
            >
              <Globe2 className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm capitalize truncate">
                {language === "en" ? t("arabic") : t("english")}
              </span>
            </button>
          </nav>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <nav className="sm:hidden bg-white border-t border-gray-200 shadow-md rounded-b-md p-4 space-y-3 max-w-[calc(100vw-32px)] mx-auto">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 rounded-md font-medium text-gray-700 hover:text-red-500 whitespace-nowrap truncate"
            >
              {t("landing.header.signin")}
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 rounded-md font-medium text-white bg-red-500 hover:bg-red-600 whitespace-nowrap truncate text-center"
            >
              {t("landing.header.getStarted")}
            </Link>
            <button
              onClick={() => {
                toggleLanguage()
                setMenuOpen(false)
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-medium text-gray-700 hover:text-red-500 whitespace-nowrap truncate w-full"
            >
              <Globe2 className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm capitalize truncate">
                {language === "en" ? t("arabic") : t("english")}
              </span>
            </button>
          </nav>
        )}
      </div>
    </header>



      {/* Hero Section with Tabs */}
      <section className="py-20 bg-gradient-to-br from-red-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">{t("landing.hero.title")}</h1>

            {activeTab === "project" ? (
              <>
                <h3 className="text-xl font-semibold mb-2">{t("landing.hero.projectTitle")}</h3>
                <p className="text-gray-600 mb-4">{t("landing.hero.projectDesc")}</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">{t("landing.hero.creatorTitle")}</h3>
                <p className="text-gray-600 mb-4">{t("landing.hero.creatorDesc")}</p>
              </>
            )}

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab("project")}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeTab === "project" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("landing.hero.tabProject")}
              </button>
              <button
                onClick={() => setActiveTab("creator")}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  activeTab === "creator" ? "bg-red-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t("landing.hero.tabCreator")}
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2071&q=80"
              alt="Creative professional"
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Camera className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">2,500+ Projects</p>
                  <p className="text-sm text-gray-600">{t("landing.hero.completedProjects")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t("landing.categories.title")}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t("landing.categories.description")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition-all">
              <div className="bg-red-50 p-4 rounded-xl w-fit mb-6">
                <c.icon className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{c.title}</h3>
              <p className="text-gray-600 mb-4">{c.description}</p>
              {/* <p className="text-sm font-medium text-red-500">{c.count}</p> */}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">{t("landing.cta.title")}</h2>
        <p className="text-xl text-gray-600 mb-12">{t("landing.cta.description")}</p>
        <Link to="/signup" className="bg-gray-100 text-gray-700 px-6 py-4 rounded-full hover:bg-gray-200 transition-colors border-2 border-gray-300">
          {t("landing.cta.button")}
        </Link>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-red-500 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center px-4">
          <div><div className="text-4xl font-bold mb-2">5,000+</div><div className="text-red-100">{t("landing.stats.creators")}</div></div>
          <div><div className="text-4xl font-bold mb-2">10,000+</div><div className="text-red-100">{t("landing.stats.projects")}</div></div>
          <div><div className="text-4xl font-bold mb-2">98%</div><div className="text-red-100">{t("landing.stats.satisfaction")}</div></div>
          <div><div className="text-4xl font-bold mb-2">24/7</div><div className="text-red-100">{t("landing.stats.support")}</div></div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </div>
  );
}
