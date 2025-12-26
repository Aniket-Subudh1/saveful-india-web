"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const radius = 100;
    const [visible, setVisible] = React.useState(false);

    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
      let { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
          #A68FD9,
          transparent 80%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="group/input rounded-xl p-[2px] transition duration-300"
      >
        <input
          type={type}
          className={cn(
            `shadow-input flex h-11 w-full rounded-xl border-2 border-transparent bg-[#F5F1E8] px-4 py-2 text-sm text-[#1a1a1a] transition-all duration-300 placeholder:text-[#6B6B6B]/50 focus:border-[#A68FD9] focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A68FD9]/20 disabled:cursor-not-allowed disabled:opacity-50 group-hover/input:bg-white`,
            className,
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  },
);
Input.displayName = "Input";

export { Input };
