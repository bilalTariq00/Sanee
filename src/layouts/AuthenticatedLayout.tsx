// src/layouts/AuthenticatedLayout.tsx
import React from "react"
import { Outlet } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import Header from "@/components/Header"

export default function AuthenticatedLayout() {
  return (
    <SidebarProvider className="w-full h-full flex flex-col gap-1 pl-2"> 
      <div className="flex min-h-screen ">
        <AppSidebar />
        <div className="flex-1 flex flex-col ">
          <Header />
          <main className="flex-1 p-4 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
