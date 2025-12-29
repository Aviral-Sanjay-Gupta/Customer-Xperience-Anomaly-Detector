import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import GlowButton from '../components/GlowButton'
import { Link } from 'react-router-dom'

interface Feature {
  text: string;
  icon: string;
  code?: boolean;
  codeText?: string;
  color?: string;
}

const features: Feature[] = [
  { text: 'Input interaction data', icon: '📊' },
  { text: 'Submit to backend API', code: true, codeText: '/score', icon: '🔌' },
  { text: 'View anomaly data table', icon: '📈' },
  { text: "Visualize 'Anomaly' distribution", icon: '📉' },
]

const powerfulfeatures: Feature[] = [
  { text: 'Real-Time Anomaly Detection', icon: '🌐', color: 'from-blue-500/20 to-blue-600/10' },
  { text: 'Single Record Testing', code: true, codeText: '/score', icon: '1️⃣', color: 'from-purple-500/20 to-purple-600/10' },
  { text: 'Bulk Dataset Analysis', icon: '🔣', color: 'from-green-500/20 to-green-600/10' },
  { text: 'Threshold-Based Anomaly Flagging', icon: '❗', color: 'from-red-500/20 to-red-600/10' },
]

interface HomeProps {
  isDarkMode?: boolean;
}

export default function Home({ isDarkMode = false }: HomeProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()

  const parallaxY = useTransform(scrollY, [0, 500], [0, 100])

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <main ref={containerRef} className={`h-screen bg-background text-foreground overflow-hidden ${isDarkMode ? "bg-slate-900 text-white" : "bg-linear-to-br from-slate-50 to-slate-100 text-slate-900"}`}>
      <motion.div
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
        style={{
          background: isDarkMode
            ? `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(37, 99, 235, 0.15), transparent 80%)`
            : `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(37, 99, 235, 0.08), transparent 80%)`,
        }}
        transition={{ type: "tween", duration: 0 }}
      />

      <div className="fixed inset-0 w-full h-full -z-10">
        <div className={`absolute inset-0 ${isDarkMode ? "bg-slate-900" : "bg-linear-to-br from-slate-50 via-white to-slate-100"}`} />
        <motion.div
          style={{ y: parallaxY }}
          className={`absolute inset-0 opacity-30 ${isDarkMode ? "" : "opacity-20"}`}
        >
          <div className={`absolute top-20 left-10 w-96 h-96 ${isDarkMode ? "bg-blue-600" : "bg-blue-400"} rounded-full mix-blend-screen filter blur-3xl`} />
          <div className={`absolute bottom-10 right-10 w-96 h-96 ${isDarkMode ? "bg-blue-600" : "bg-blue-400"} rounded-full mix-blend-screen filter blur-3xl`} />
        </motion.div>
      </div>

      {/* Hero Section */}
      <section className="relative flex items-center justify-center px-4 pt-8 pb-4">
        <div className="relative z-10 max-w-4xl mx-auto text-center">

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
            className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-2 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"
              }`}
          >
            <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-500 via-blue-500 to-blue-600 animate-pulse">
              CX-Anomaly
            </span>
            <br />
            <span>Detector</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
          >
            A data-driven CX tool for anomaly detection, live scoring, and dashboards that make supervisors smarter, faster, and calmer.
          </motion.p>

          <motion.ul
            className="mb-6 flex flex-col gap-3 items-center w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {features.map((f, i) => (
              <motion.li
                key={f.text}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                whileHover={{ x: 10, scale: 1.02 }}
                className={`relative flex items-center gap-4 px-6 py-3 rounded-full font-semibold text-base shadow-lg transition-all duration-300 w-full sm:w-[min(550px,90%)] mx-auto group cursor-pointer ${isDarkMode
                    ? "bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/60"
                    : "bg-white/80 border border-slate-200/60 hover:border-blue-400/60 shadow-md hover:shadow-lg"
                  }`}
                style={{
                  backdropFilter: "blur(12px)",
                  background: isDarkMode
                    ? "rgba(30, 41, 59, 0.6)"
                    : "rgba(255, 255, 255, 0.8)",
                }}
              >
                <motion.div
                  className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 ${i === 0 ? "bg-linear-to-r from-blue-400/20 to-transparent" :
                      i === 1 ? "bg-linear-to-r from-blue-400/20 to-transparent" :
                        i === 2 ? "bg-linear-to-r from-blue-400/20 to-transparent" :
                          "bg-linear-to-r from-blue-400/20 to-transparent"
                    }`}
                />
                <span
                  className={`inline-block w-4 h-4 rounded-full shrink-0 ${i === 0 ? "bg-neutral-900" :
                      i === 1 ? "bg-neutral-900" :
                        i === 2 ? "bg-neutral-900" :
                          "bg-neutral-900"
                    }`}
                />
                <span className="text-2xl">{f.icon}</span>
                <span className={`flex-1 text-left ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                  {f.text}
                  {f.code && (
                    <motion.code
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      className="ml-3 px-3 py-1 rounded bg-slate-900/80 text-white font-mono text-sm hover:bg-slate-900 transition-colors"
                    >
                      {f.codeText}
                    </motion.code>
                  )}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-wrap gap-4 justify-center mt-3"
          >
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="relative group mt-2"
            >
              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
              <Link to="/dashboard">
                <GlowButton
                  variant="primary"
                  className="relative px-8 py-3 bg-slate-900 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors text-base"
                >
                  View Dashboard
                </GlowButton>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="relative group mt-2"
            >
              <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
              <Link to="/howitworks">
                <button className="relative px-8 py-3 bg-white rounded-lg text-slate-900 font-semibold hover:bg-gray-100 transition-colors text-base border-2 border-purple-500">
                  How it Works?
                </button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-4 px-4">
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-4 mt-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-1 text-black">Powerful Features</h2>
            <p className="text-black text-sm">Everything you need to detect and act on customer experience anomalies</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {powerfulfeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative p-4 rounded-xl border border-white/10 bg-linear-to-br from-white/5 to-white/0 backdrop-blur-sm hover:border-blue-600/50 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="relative z-10">
                  <div className="text-3xl mb-2">{feature.icon}</div>
                  <p className="font-semibold text-black group-hover:text-neutral-900 transition-colors text-sm">{feature.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}