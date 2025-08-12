"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import JobPaymentModal from "@/components/JobPaymentModal";
import config from "../config";
import { Edit, LayoutGrid, List, Trash } from "lucide-react";

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [view, setView] = useState("list");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();
  const { t,i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/buyer/jobs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setJobs(res.data);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await axios.delete(`${config.API_BASE_URL}/buyer/jobs/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setJobs(jobs.filter((job) => job.id !== id));
    } catch (error) {
      console.error("Failed to delete job", error);
    }
  };

  const openPaymentModal = (job) => {
    setSelectedJob(job);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setSelectedJob(null);
    setShowPaymentModal(false);
  };

  const handleCheckoutRedirect = ({ gig_uid, message }) => {
    setShowPaymentModal(false);
    navigate(`/checkout/${gig_uid}`, { state: { message } });
  };

  return (
<div className={`p-4 bg-white min-h-screen ${isRTL ? "text-right" : "text-left"}`} dir={isRTL ? "rtl" : "ltr"}>

    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-red-700">{t("manage_job.title")}</h2>
      <div className="flex gap-2">
        <Link to="/post-job">
          <Button className="bg-red-600 hover:bg-red-700 text-white">
            {t("manage_job.create_button")}
          </Button>
        </Link>

        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          onClick={() => setView("list")}
        >
          <List />
        </Button>
        <Button
          variant={view === "grid" ? "secondary" : "ghost"}
          onClick={() => setView("grid")}
        >
          <LayoutGrid />
        </Button>
      </div>
    </div>

    {view === "list" ? (
     <Table dir={isRTL ? "rtl" : "ltr"}>
        <TableHeader>
          <TableRow className="bg-red-100 text-red-800">
         <TableHead className={isRTL ? "text-right" : "text-left"}>{t("manage_job.title_label")}</TableHead>
<TableHead className={isRTL ? "text-right" : "text-left"}>{t("manage_job.status")}</TableHead>
<TableHead className={isRTL ? "text-right" : "text-left"}>{t("manage_job.budget")}</TableHead>
<TableHead className={isRTL ? "text-right" : "text-left"}>{t("manage_job.experience")}</TableHead>
<TableHead className={isRTL ? "text-right" : "text-left"}>{t("manage_job.actions")}</TableHead>

          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-medium text-red-700">{job.title}</TableCell>
              <TableCell>{job.status}</TableCell>
              <TableCell>  <span className="flex items-center">
                  <img src="/riyal.svg" className="h-4 w-4 mr-1" alt="Price" />
                  {job.budget}
                </span></TableCell>
              <TableCell>{job.experience_level}</TableCell>
              <TableCell className="flex flex-wrap gap-1">
                <Link to={`/edit-job/${job.id}`}>
                  <Button size="sm" variant="outline">
                    <Edit className={isRTL ? "ml-1" : "mr-1"} />{t("manage_job.edit")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash className={isRTL ? "ml-1" : "mr-1"} /> {t("manage_job.delete")}
                </Button>
                <Link to={`/job/${job.id}/proposals`}>
                  <Button size="sm" variant="secondary">
                    💼 {t("manage_job.proposals")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => openPaymentModal(job)}
                >
                  💰 {t("manage_job.pay")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <Card key={job.id} className="border border-red-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-red-700">{job.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="text-gray-600">
                {job.description?.substring(0, 100)}...
              </p>
              <p>
                <strong>{t("manage_job.status")}:</strong> {job.status}
              </p>
              <p>
                <strong>{t("manage_job.budget")}:</strong> ${job.budget}
              </p>
              <p>
                <strong>{t("manage_job.experience")}:</strong> {job.experience_level}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Link to={`/edit-job/${job.id}`}>
                  <Button size="sm" variant="outline">
                    <Edit className="mr-1" /> {t("manage_job.edit")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash className="mr-1" /> {t("manage_job.delete")}
                </Button>
                <Link to={`/job/${job.id}/proposals`}>
                  <Button size="sm" variant="secondary">
                    💼 {t("manage_job.proposals")}
                  </Button>
                </Link>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => openPaymentModal(job)}
                >
                  💰 {t("manage_job.pay")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )}

    {showPaymentModal && selectedJob && (
      <JobPaymentModal
        gig={selectedJob}
        onClose={closePaymentModal}
        onConfirm={handleCheckoutRedirect}
      />
    )}
  </div>
);

};

export default ManageJobs;
