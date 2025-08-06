"use client"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import "@fontsource/cairo" // Full family with Arabic support

import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { NotificationProvider } from "./contexts/NotificationContext" // ⬅️ NEW IMPORT
import ProtectedRoute from "./components/ProtectedRoute"
import ErrorBoundary from "./components/ErrorBoundaryy" // ⬅️ NEW IMPORT
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import HomePage from "./pages/HomePage"
import ProjectsPage from "./pages/ProjectsPage"
import MyProjectsPage from "./pages/MyProjectsPage"
import JobsPage from "./pages/JobsPage"
import JobDetailsPage from "./pages/JobDetailsPage"
import PostJobPage from "./pages/PostJobPage"
import ProfilePage from "./pages/ProfilePage"
import EditProfilePage from "./pages/EditProfilePage"
import BalancePage from "./pages/BalancePage"
import CreatorProfilePage from "./pages/CreatorProfilePage"
import JobApplicantsPage from "./pages/JobApplicantsPage"
import OrganizationProfilePage from "./pages/OrganizationProfilePage"
import AuthenticatedLayout from "./layouts/AuthenticatedLayout"
import Index from "./pages/Discovery"
import AllGigs from "./pages/AllGigs"
import CreateGig from "./pages/CreateGig"
import ManageJobs from "./pages/ManageJobs"
import EditJob from "./pages/EditJobs"
import JobProposals from "./pages/JobProposals"
import Checkout from "./pages/Checkout"
import BuyerContracts from "./pages/BuyerContract"
import ManageGigs from "./pages/ManageGig"
import EditGig from "./pages/EditGig"
import SellerContracts from "./pages/SellerContracts"
import Review from "./components/Review"
import NotificationsPage from "./pages/NotificationsPage"
import NotificationSettingsPage from "./pages/NotificationSettingsPage" // ⬅️ NEW IMPORT
import { useState } from "react"
import Chat from "./pages/MessagesPage"
import GigDetail from "./pages/GigDetail"
import WalletPage from "./pages/wallet-page"
import SavedJobsPage from "./pages/SavedJobsPage"
import "./App.css"
import SavedGigsPage from "./pages/SavedGigsPage"
import LandingPage from "./pages/LandingPage";  // ⬅️ ADD THIS
import SupportPage from "./pages/support"

/* --------------------------------------------------------------
   Wrapper component for authenticated routes with NotificationProvider
---------------------------------------------------------------- */
function AuthenticatedRoutes() {
  const { user } = useAuth() 
   if (!user) {
    // You can handle the case where the user is not authenticated here.
    // For example, redirect to login page or show an error.
    return <Navigate to="/login" replace />
  }
  return (
    <ErrorBoundary>
     <NotificationProvider user={user}>
      {" "}
      {/* ⬅️ Wrap only the authenticated routes */}
      <ProtectedRoute>
        <AuthenticatedLayout />
      </ProtectedRoute>
    </NotificationProvider>
    </ErrorBoundary>
  )
}

/* --------------------------------------------------------------
   Split routing logic into a child component so we can access
   `useAuth()` inside a <Router> tree.
---------------------------------------------------------------- */
function AppRoutes() {
  const { user } = useAuth() // ⬅️ current logged-in user (may be null)
  const { i18n } = useTranslation()
  const [lang, setLang] = useState(i18n.language)

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.body.classList.remove("font-sans", "font-cairo")
    document.body.classList.add(lang === "ar" ? "font-cairo" : "font-sans")
  }, [lang])

  return (
    <Routes>
      {/* –––––––––– Public –––––––––– */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* –––––– Private (wrapped in AuthenticatedLayout + NotificationProvider) –––––– */}
      {/* If user is not logged in, show LandingPage */}
<Route
  path="/"
  element={user ? <AuthenticatedRoutes /> : <LandingPage />}
>

        {/* dashboard & general */}
        <Route path="support" element={<SupportPage />} />
        <Route path="dashboard" element={<HomePage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="my-projects" element={<MyProjectsPage />} />
        <Route path="balance" element={<BalancePage />} />
       <Route path="/messages/:userId" element={<Chat />} />
          <Route path="/messages" element={<Chat />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="notification-settings" element={<NotificationSettingsPage />} />
        <Route index element={<Index />} />
        {/* jobs */}
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailsPage />} />
        <Route path="post-job" element={<PostJobPage />} />
        <Route path="job/:jobId/applicants" element={<JobApplicantsPage />} />
        <Route path="edit-job/:id" element={<EditJob />} />
        <Route path="job/:id/proposals" element={<JobProposals />} />
        <Route path="manage-jobs" element={<ManageJobs />} />
          <Route path="save-jobs" element={<SavedJobsPage />} />
        {/* gigs */}
        <Route path="gigs" element={<AllGigs />} />
        <Route path="saved-gigs" element={<SavedGigsPage />} />
        <Route path="create-gig" element={<CreateGig />} />
        <Route path="manage-gigs" element={<ManageGigs />} />
        <Route path="edit-gig/:id" element={<EditGig />} />
        <Route path="/checkout/:gig_uid" element={<Checkout />} />
        <Route path="/gig/:slug" element={<GigDetail />} />
        <Route path="wallet" element={<BalancePage />} />
        {/* contracts */}
        <Route path="contracts" element={<BuyerContracts />} />
        <Route path="seller/contracts" element={<SellerContracts />} />
        <Route path="review/:id" element={<Review />} />
        {/* profiles (creator / org) */}
        <Route path="creator/:category/:creatorId" element={<CreatorProfilePage />} />
        <Route path="organization/:organizationId" element={<OrganizationProfilePage />} />
        {/* ****** NEW dual-profile routes ****** */}
        {/* 1️⃣ "My profile" → redirect to /profile/<uid> */}
        <Route
          path="profile"
          element={user ? <Navigate to={`/profile/${user.id}`} replace /> : <Navigate to="/login" replace />}
        />
        {/* 2️⃣ Any profile by uid */}
        <Route path="profile/:uid" element={<ProfilePage />} />
        {/* edit profile (same as before) */}
        <Route path="profile/edit" element={<EditProfilePage />} />
      </Route>

      {/* fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

/* -------------------------------------------------------------- */

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}
