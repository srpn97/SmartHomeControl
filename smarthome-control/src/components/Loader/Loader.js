import './Loader.scss'
import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1,
  };

  return (
    <motion.div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "5px solid #e9e9e9",
        borderTop: "5px solid #3498db",
        boxSizing: "border-box",
      }}
      animate={{ rotate: 360 }}
      transition={spinTransition}
    />
  );
};

export default Loader;
