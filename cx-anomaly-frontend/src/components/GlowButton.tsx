import React from 'react'
import { motion } from 'framer-motion'

type GlowButtonVariant = 'primary' | 'secondary';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType;
  variant?: GlowButtonVariant;
  className?: string;
  children: React.ReactNode;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ as: Component = 'button', variant = 'primary', className, children, ...props }, ref) => {
    const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-300 relative overflow-hidden'
    const variantClasses: Record<GlowButtonVariant, string> = {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/50',
      secondary: 'absolute -inset-0.5 bg-linear-to-r from-purple-600 to-purple-600 rounded-lg group-hover:opacity-100 transition duration-300 relative px-8 py-3 bg-white rounded-lg text-slate-900 font-semibold hover:bg-gray-100 transition-colors text-base border-2 border-purple-500',
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-block"
      >
        <Component
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`}
          {...props}
        >
          {children}
        </Component>
      </motion.div>
    )
  }
)

GlowButton.displayName = 'GlowButton'

export default GlowButton
