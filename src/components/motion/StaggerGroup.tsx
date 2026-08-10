import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { staggerContainer, staggerItem } from "../../lib/motion";

type GroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
};

export const StaggerGroup = ({
  children,
  className = "",
  stagger = 0.07,
  delayChildren = 0.04,
}: GroupProps) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.12 }}
      variants={staggerContainer(reduced ? 0 : stagger, reduced ? 0 : delayChildren)}
    >
      {children}
    </motion.div>
  );
};

type ItemProps = {
  children: ReactNode;
  className?: string;
};

export const StaggerItem = ({ children, className = "" }: ItemProps) => {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div className={className} variants={staggerItem(reduced)}>
      {children}
    </motion.div>
  );
};
