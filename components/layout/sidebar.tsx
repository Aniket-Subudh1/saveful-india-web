"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX, IconChevronDown } from "@tabler/icons-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
  children?: Links[];
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "hidden h-full shrink-0 border-r-2 border-[#E8B4D9]/20 bg-saveful-cream px-4 py-4 md:flex md:flex-col md:w-[300px]",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "80px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "flex h-16 w-full flex-row items-center justify-between bg-saveful-cream px-4 py-4 md:hidden"
        )}
        {...props}
      >
        <div className="z-20 flex w-full justify-end">
          <button
            onClick={() => setOpen(!open)}
            className="text-saveful-green transition-colors hover:text-saveful-purple"
          >
            <IconMenu2 className="h-6 w-6" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-saveful-cream p-10",
                className
              )}
            >
              <button
                className="absolute right-10 top-10 z-50 text-saveful-green transition-colors hover:text-saveful-purple"
                onClick={() => setOpen(!open)}
              >
                <IconX className="h-6 w-6" />
              </button>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = link.children && link.children.length > 0;
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    } else if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
  };

  return (
    <div>
      <a
        href={link.href}
        onClick={handleClick}
        className={cn(
          "group/sidebar flex items-center justify-start gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-saveful-purple/10",
          className
        )}
        {...props}
      >
        {link.icon}

        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="!m-0 inline-block flex-1 whitespace-pre !p-0 font-saveful text-sm text-saveful-black transition duration-150 group-hover/sidebar:translate-x-1"
        >
          {link.label}
        </motion.span>

        {hasChildren && open && (
          <motion.div
            animate={{
              rotate: isExpanded ? 180 : 0,
            }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <IconChevronDown className="h-4 w-4 text-saveful-gray" />
          </motion.div>
        )}
      </a>

      {hasChildren && (
        <AnimatePresence>
          {isExpanded && open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-saveful-purple/20 pl-3">
                {link.children?.map((child, idx) => (
                  <a
                    key={idx}
                    href={child.href}
                    onClick={(e) => {
                      if (child.onClick) {
                        e.preventDefault();
                        child.onClick();
                      }
                    }}
                    className="group/child flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-saveful-purple/10"
                  >
                    <div className="shrink-0">{child.icon}</div>
                    <span className="font-saveful text-sm text-saveful-black transition group-hover/child:translate-x-1">
                      {child.label}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
