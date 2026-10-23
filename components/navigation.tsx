"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Lightbulb, User } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-10">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <NavItem href="/dailylogs" icon={<Home className="w-6 h-6" />} label="Daily Log" isActive={isActive("/dailylogs")} />
          <NavItem
            href="/assessment"
            icon={<BarChart3 className="w-6 h-6" />}
            label="Assessment"
            isActive={isActive("/assessment")}
          />
          <NavItem href="/tips" icon={<Lightbulb className="w-6 h-6" />} label="Tips" isActive={isActive("/tips")} />
          <NavItem
            href="/profile"
            icon={<User className="w-6 h-6" />}
            label="Profile"
            isActive={isActive("/profile")}
          />
        </div>
      </div>
    </nav>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center space-y-1 ${
        isActive ? "text-primary" : "text-gray-600 hover:text-primary"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  )
}
