import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from 'framer-motion'
import InputForm from "../components/InputForm";
import AnomalyTable from "../components/AnomalyTable";
import DetailedScoresTable from "../components/DetailedScoresTable";
import Charts from "../components/Charts";
import StatsPanel from "../components/StatsPanel";
import FeatureImportance from "../components/FeatureImportance";
import NeighborVisualization from "../components/NeighborVisualization";
import FeatureSpaceScatter from "../components/FeatureSpaceScatter";
import ConfusionMatrix from "../components/ConfusionMatrix";
import type { ScoreResult, StatsData } from "../types";

export default function Dashboard() {
	const [results, setResults] = useState<ScoreResult[]>([]);
	const [stats, setStats] = useState<StatsData>({} as StatsData);
	const [singleRecordCounter, setSingleRecordCounter] = useState(0);
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
	const containerRef = useRef<HTMLDivElement>(null)
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

	// Handler for form submission
	const handleScore = (response: ScoreResult[], isSingleRecord = false) => {
        console.log('handleScore called with response:', response, 'isSingleRecord:', isSingleRecord);
		setHasSubmitted(true);
		// If single record, keep only single records in table
		if (isSingleRecord) {
			const newCounter = singleRecordCounter + 1;
			const markedResponse = response.map(r => ({
				...r,
				isSingleRecord: true,
				singleRecordNumber: newCounter
			}));
			setSingleRecordCounter(newCounter);
			// Only keep previous single records, not dataset records
			const previousSingleRecords = results.filter(r => r.isSingleRecord);
			const updatedResults = [...previousSingleRecords, ...markedResponse];
			setResults(updatedResults);
		} else {
			// Reset single record counter when new dataset uploaded
			setSingleRecordCounter(0);
			setResults(response);
		}
	};

	const handleStatsUpdate = (newStats: StatsData) => {
		console.log('Dashboard handleStatsUpdate called with:', newStats);
		setStats(newStats);
	};

	return (
		<div ref={containerRef} className="h-screen bg-linear-to-br from-white via-blue-100 to-blue-100 text-gray-900 overflow-hidden relative">
			<motion.div
				className="fixed inset-0 w-full h-full pointer-events-none z-0"
				style={{
					background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`
				}}
				transition={{ type: "tween", duration: 0 }}
			/>

			<div className="fixed inset-0 w-full h-full -z-10">
				<div className="absolute inset-0 bg-white" />
				<motion.div
					style={{ y: parallaxY }}
					className="absolute inset-0 opacity-30"
				>
					<div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-screen filter blur-3xl" />
					<div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-screen filter blur-3xl" />
				</motion.div>
			</div>

			<div className="relative z-10 w-full h-full overflow-auto">
				{!hasSubmitted ? (
					<div className="flex items-center justify-center min-h-full p-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-blue-300/30 hover:border-blue-400/50 transition-all duration-300 w-full max-w-4xl"
						>
					<motion.h2
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.5 }}
						className="text-4xl font-extrabold mb-6 text-center bg-clip-text text-transparent bg-linear-to-r from-blue-300 via-blue-600 to-blue-900"
					>
						Anomaly Detector
					</motion.h2>							<motion.div
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: 0.2, duration: 0.6 }}
								whileHover={{ y: -4 }}
								className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
							>
								<InputForm onScore={handleScore} onStatsUpdate={handleStatsUpdate} />
							</motion.div>
						</motion.div>
					</div>
				) : (
					<div className="p-6">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6 }}
							className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-blue-300/30 hover:border-blue-400/50 transition-all duration-300"
						>
						<motion.h2
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1, duration: 0.5 }}
							className="text-4xl font-extrabold mb-4 text-center bg-clip-text text-transparent bg-linear-to-r from-blue-300 via-blue-600 to-blue-900"
						>
							Anomaly Detector Dashboard
						</motion.h2>							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.1, duration: 0.6 }}
									whileHover={{ y: -4 }}
									className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
								>
									<InputForm onScore={handleScore} onStatsUpdate={handleStatsUpdate} />
								</motion.div>

							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: 0.2, duration: 0.6 }}
								className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
							>
								<StatsPanel stats={stats} />
							</motion.div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.25, duration: 0.6 }}
									className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
								>
									<FeatureImportance results={results} />
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3, duration: 0.6 }}
									className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
								>
									<NeighborVisualization results={results} />
								</motion.div>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.33, duration: 0.6 }}
									className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
								>
									<FeatureSpaceScatter results={results} />
								</motion.div>

								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.37, duration: 0.6 }}
									className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300"
								>
									<ConfusionMatrix results={results} />
								</motion.div>
							</div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4, duration: 0.6 }}
								className="bg-white/70 backdrop-blur-md rounded-xl p-6 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300 mb-4"
							>
								<Charts results={results.some(r => r.isSingleRecord) ? results : results.filter(r => 
					r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1 ||
					r.ensemble_anomaly || (r.ensemble_score && r.ensemble_score > 0.8)
				)} />
							</motion.div>							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4, duration: 0.6 }}
								className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300 mb-4"
							>
								<div className="overflow-auto max-h-96">
									<DetailedScoresTable results={results} />
								</div>
							</motion.div>

							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5, duration: 0.6 }}
								className="bg-white/70 backdrop-blur-md rounded-xl p-4 border border-blue-200/30 hover:border-blue-400/40 transition-all duration-300 mb-4"
							>
								<div className="overflow-auto max-h-96">
									<AnomalyTable results={results} />
								</div>
							</motion.div>
						</motion.div>
					</div>
				)}
			</div>

			<style>{`
				@keyframes float {
					0%, 100% { transform: translateY(0px); }
					50% { transform: translateY(-20px); }
				}
				.animate-float {
					animation: float 3s ease-in-out infinite;
				}
			`}</style>
		</div>
	);
}
