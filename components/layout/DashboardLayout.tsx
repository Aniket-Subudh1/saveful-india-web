"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "./sidebar";
import { motion } from "motion/react";
import Image from "next/image";
import { DashboardLayoutProps } from "@/types/sidebar";

export function DashboardLayout({ config, children }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-saveful-cream md:flex-row">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-0">
          <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
            <div className="mb-6 px-2">
              {open ? <Logo /> : <LogoIcon />}
            </div>
            
            {/* Decorative Separator */}
            <div className="relative mb-6 px-3">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-saveful-purple/40 to-transparent shadow-sm"></div>
              {open && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-saveful-cream p-1"
                >
                  <div className="relative h-5 w-5">
                    <Image
                      src="/food.png"
                      alt="Decoration"
                      fill
                      className="object-contain"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex flex-col gap-2 px-2">
              {config.links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          
          <div className="border-t border-saveful-purple/10 pt-4">
            <div className={open ? "px-2" : "flex justify-center px-2"}>
              <SidebarLink
                link={{
                  label: config.userName,
                  href: "#",
                  icon: (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saveful-purple to-saveful-pink shadow-lg">
                      <span className="font-saveful-bold text-lg text-white">
                        {config.userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

const Logo = () => {
  return (
    <a
      href="#"
      className="group relative z-20 flex items-center justify-center rounded-lg py-3 transition-all hover:bg-white/50"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex w-full items-center justify-center px-2"
      >
        <div className="relative h-14 w-36">
          <Image
            src="/logo@2x.png"
            alt="Saveful Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </motion.div>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="#"
      className="group relative z-20 flex items-center justify-center rounded-lg bg-saveful-cream p-2 shadow-sm transition-all hover:bg-saveful-cream/80 hover:shadow-md"
    >
      <div className="relative h-12 w-12 shrink-0 transition-transform group-hover:scale-105">
        <Image
          src="/notification_icon.png"
          alt="Saveful Icon"
          fill
          className="object-contain drop-shadow-md"
          priority
        />
      </div>
    </a>
  );
};
