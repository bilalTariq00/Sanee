import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import config from "../config";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const lang = i18n.language || "en"; // Get current language
        const res = await axios.get(`${config.API_BASE_URL}/settings?lang=${lang}`);
        setSettings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch footer settings:", err);
      }
    };

    fetchSettings();
  }, [i18n.language]); // Re-fetch if language changes

  if (!settings) return null;

  const { contact, social, website } = settings;


  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <img src="/sanee.png" alt="logo" className="w-20 h-16" />
          <p className="text-gray-300 mb-6 max-w-md">{website?.description}</p>
          <div className="flex space-x-4 mb-6">
            {social?.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {social?.twitter && (
              <a href={social.twitter} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            )}
            {social?.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {social?.linkedin && (
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-3 rounded-full hover:bg-red-500 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            )}
          </div>
          <div className="space-y-2 text-gray-300">
            {contact?.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact?.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span>{contact.phone}</span>
              </div>
            )}
            {contact?.address && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{contact.address}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">{t("landing.footer.missionTitle")}</h4>
          <p className="text-gray-300 text-sm mb-6">{website?.description}</p>
          <h4 className="text-lg font-semibold mb-4">{t("landing.footer.visionTitle")}</h4>
          <p className="text-gray-300 text-sm">{t("landing.footer.vision")}</p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4">{t("landing.footer.quickLinks")}</h4>
          <ul className="space-y-2 text-gray-300">
            <li><Link to="/categories" className="hover:text-red-500">{t("landing.footer.links.categories")}</Link></li>
            <li><Link to="/jobs" className="hover:text-red-500">{t("landing.footer.links.jobs")}</Link></li>
            <li><Link to="/signup" className="hover:text-red-500">{t("landing.footer.links.creator")}</Link></li>
            <li><Link to="/signup" className="hover:text-red-500">{t("landing.footer.links.job")}</Link></li>
            <li><Link to="/support" className="hover:text-red-500">{t("landing.footer.links.help")}</Link></li>
            <li><Link to="/privacy" className="hover:text-red-500">{t("landing.footer.links.privacy")}</Link></li>
            <li><Link to="/terms" className="hover:text-red-500">{t("landing.footer.links.terms")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
        <p>© {new Date().getFullYear()} {website?.title || "Sanee"}. All rights reserved.</p>
      </div>
    </footer>
  );
}
