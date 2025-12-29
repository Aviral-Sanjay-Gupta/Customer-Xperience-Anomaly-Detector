import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import GlowButton from '../components/GlowButton';

export default function HowItWorks() {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollY } = useScroll();
	const parallaxY = useTransform(scrollY, [0, 500], [0, 100]);

	useEffect(() => {
		const handleMouseMove = (e: globalThis.MouseEvent) => {
			if (containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect();
				setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
			}
		};
		window.addEventListener('mousemove', handleMouseMove);
		return () => window.removeEventListener('mousemove', handleMouseMove);
	}, []);

	const sections = [
		{
			title: "1️⃣ Data Input & Preparation",
			icon: "📊",
			color: "from-blue-500 to-blue-600",
			content: [
				{
					subtitle: "Dataset Upload",
					description: "Upload CSV files containing customer interaction data with 11 key features:",
					details: [
						"Interaction ID - Unique identifier for each customer interaction",
						"Timestamp - When the interaction occurred",
						"CSAT (1-5) - Customer Satisfaction Score",
						"IES (0-100) - Internal Efficiency Score",
						"Complaints (count) - Number of complaints filed",
						"AHT (seconds) - Actual Handle Time",
						"Hold Time (seconds) - Time customer spent on hold",
						"Transfers (count) - Number of times call was transferred",
						"Channel - Communication channel (voice/email/chat)",
						"Language - Customer's preferred language",
						"Queue - Service queue (billing/support/sales)"
					]
				},
				{
					subtitle: "Single Record Testing",
					description: "Test individual interactions in real-time by manually entering values for all 11 features. Perfect for:",
					details: [
						"Live monitoring of ongoing interactions",
						"What-if scenario analysis",
						"Training and demonstration purposes",
						"Quick anomaly checks without uploading files"
					]
				}
			]
		},
		{
			title: "2️⃣ Model Selection",
			icon: "🎯",
			color: "from-purple-500 to-purple-600",
			content: [
				{
					subtitle: "Isolation Forest (IForest)",
					description: "Tree-based algorithm that isolates anomalies by randomly partitioning the feature space:",
					details: [
						"Works by building isolation trees that separate anomalies faster than normal points",
						"Anomaly Score: 0.0 to 1.0 (higher = more anomalous)",
						"Best for: Detecting outliers in high-dimensional data",
						"Excels at finding: Extreme values and unusual feature combinations"
					]
				},
				{
					subtitle: "Local Outlier Factor (LOF)",
					description: "Density-based algorithm that identifies anomalies based on local neighborhood density:",
					details: [
						"Compares local density of a point with its neighbors",
						"Anomaly Score: >(Threshold Value) indicates anomaly (higher = more anomalous)",
						"Best for: Finding local anomalies in varying density regions",
						"Excels at finding: Context-dependent outliers"
					]
				},
				{
					subtitle: "Both Models (Ensemble)",
					description: "Combines predictions from both IForest and LOF for robust detection:",
					details: [
						"Ensemble Score: Weighted average of both models (0.0 to 1.0)",
						"Provides consensus-based anomaly detection",
						"Reduces false positives by requiring agreement",
						"Recommended for: Production deployments requiring high accuracy"
					]
				}
			]
		},
		{
			title: "3️⃣ Backend Processing",
			icon: "⚙️",
			color: "from-green-500 to-green-600",
			content: [
				{
					subtitle: "API Request",
					description: "Data is sent to FastAPI backend at endpoint: /score?model={model}",
					details: [
						"POST request with JSON payload containing interaction records",
						"Model parameter: 'iforest', 'lof', or 'both'",
						"Request includes all 11 feature values for each interaction",
						"Content-Type: application/json for structured data transfer"
					]
				},
				{
					subtitle: "Feature Engineering",
					description: "Backend preprocesses and normalizes the input features:",
					details: [
						"Numerical features scaled using StandardScaler (mean=0, std=1)",
						"Categorical features encoded (channel, language, queue)",
						"Missing values handled with intelligent imputation",
						"Feature vector created for model consumption"
					]
				},
				{
					subtitle: "Model Inference",
					description: "Pre-trained models analyze each interaction:",
					details: [
						"IForest: Calculates isolation score by tree path lengths",
						"LOF: Computes local density ratio with k-nearest neighbors",
						"Ensemble: Combines both scores with weighted averaging",
						"Thresholds applied to determine anomaly flags (0 or 1)"
					]
				},
				{
					subtitle: "Response Structure",
					description: "Backend returns comprehensive scoring results:",
					details: [
						"scores: {iforest, lof, ensemble} - Numerical scores for each model",
						"is_anomaly: {iforest, lof, ensemble} - Binary flags (0=normal, 1=anomaly)",
						"total_records: Count of processed interactions",
						"anomalies_detected: Total number of flagged anomalies",
						"processing_time_ms: Performance metric for the analysis"
					]
				}
			]
		},
		{
			title: "4️⃣ Results Visualization",
			icon: "📈",
			color: "from-red-500 to-red-600",
			content: [
				{
					subtitle: "Analysis Summary Panel",
					description: "Quick overview of the detection results:",
					details: [
						"Total Interactions: Count of records processed",
						"Anomalies Detected: Number of flagged interactions",
						"Dataset Name: Uploaded file name or 'Single Record'",
						"Features Used: Number of features analyzed (11 total)",
						"IForest Threshold: Decision boundary for Isolation Forest",
						"LOF Threshold: Decision boundary for Local Outlier Factor",
						"Anomaly Rate: Percentage of anomalous interactions"
					]
				},
				{
					subtitle: "Anomaly Distribution Chart",
					description: "Bar chart visualization of anomaly scores:",
					details: [
						"X-axis: Record index or interaction ID",
						"Y-axis: Anomaly score (0.0 to 1.0 or higher for LOF)",
						"For datasets: Shows only flagged anomalies",
						"For single records: Shows all submitted records",
						"Color-coded bars indicate score intensity"
					]
				},
				{
					subtitle: "Detailed Scores Table",
					description: "Model-specific breakdown for each interaction:",
					details: [
						"IForest Score: Precise isolation score (4 decimals)",
						"IForest Anomaly: ⚠️ Anomaly or ✓ Normal badge",
						"LOF Score: Local outlier factor score (4 decimals)",
						"LOF Anomaly: ⚠️ Anomaly or ✓ Normal badge",
						"Ensemble Score: Combined consensus score (4 decimals)",
						"Ensemble Anomaly: ⚠️ Anomaly or ✓ Normal badge",
						"Row highlighting: Purple background for anomalous records"
					]
				},
				{
					subtitle: "Interaction Details Table",
					description: "Complete feature values and final scores:",
					details: [
						"All 11 original feature values displayed",
						"Blue highlighting for flagged anomalies"
					]
				},
				{
					subtitle: "Feature Importance Analysis",
					description: "Bar chart showing which features drive anomaly detection:",
					details: [
						"Analyzes all 6 numerical features: CSAT, IES, Complaints, AHT, Hold Time, Transfers",
						"Calculates importance as combination of variance and correlation with anomaly scores",
						"Scores range from 0-100% indicating feature significance",
						"Top 3 features highlighted with medal emojis (🥇🥈🥉)",
						"Color-coded bars for visual hierarchy (red → orange → yellow → green → blue → purple)",
						"Helps identify which metrics are most predictive of anomalies"
					]
				},
				{
					subtitle: "Neighbor Visualization (IF/LOF Density)",
					description: "Scatter plot showing density-based clustering patterns:",
					details: [
						"2D visualization using CSAT (x-axis) vs IES (y-axis)",
						"Green circles = Normal interactions (dense clusters)",
						"Red triangles = Anomalies (sparse/isolated regions)",
						"Illustrates Local Outliers logic visually",
						"Shows how anomalies exist in low-density neighborhoods",
						"Stats panel: Total points, normal count, anomaly count, anomaly rate %",
						"Interpretation guide explains density concepts"
					]
				},
				{
					subtitle: "Feature Space Distribution (Combined Models)",
					description: "Scatter plot showing 2D distribution across AHT vs IES:",
					details: [
						"X-axis: Average Handle Time (seconds)",
						"Y-axis: Internal Escalation Score (IES)",
						"Blue circles = Normal interactions (low AHT, low IES)",
						"Yellow diamonds = Medium-risk anomalies (score 0.6-0.7)",
						"Red stars = High-risk anomalies (score >0.7)",
						"Model-agnostic: Shows anomalies from any model (IForest, LOF, or Ensemble)",
						"Maximum visual spread for clear pattern identification",
						"Distribution stats: Normal/medium/high counts with average comparisons"
					]
				},
				{
					subtitle: "Confusion Matrix (Model Comparison)",
					description: "3x3 grid comparing IForest vs LOF prediction agreement:",
					details: [
						"Rows = IForest predictions, Columns = LOF predictions",
						"True Positive (Both Anomaly): Green cell - both models agree on anomaly",
						"True Negative (Both Normal): Green cell - both models agree on normal",
						"False Positive (LOF only): Red/orange cell - LOF flags, IForest doesn't",
						"False Negative (IForest only): Red/orange cell - IForest flags, LOF doesn't",
						"Metrics displayed: Agreement %, Disagreement %, Precision %, F1 Score",
						"Cell percentages show distribution of predictions",
						"Helps understand model consensus and disagreement patterns"
					]
				}
			]
		},
		{
			title: "5️⃣ Anomaly Detection Mathematics",
			icon: "🔬",
			color: "from-orange-500 to-orange-600",
			content: [
				{
					subtitle: "Isolation Forest Algorithm",
					description: "Mathematical foundation of tree-based anomaly detection:",
					details: [
						"Anomaly Score = 2^(-E(h(x))/c(n))",
						"h(x) = path length (number of splits to isolate point)",
						"c(n) = average path length of unsuccessful search in BST",
						"E(h(x)) = expected path length across all trees",
						"Score close to 1: Anomaly (short paths)",
						"Score close to 0: Normal (long paths)",
						"Threshold typically set at 0.6-0.7 for binary classification"
					]
				},
				{
					subtitle: "Local Outlier Factor Algorithm",
					description: "Density-based local deviation measurement:",
					details: [
						"LOF(x) = Σ(lrd(neighbor) / lrd(x)) / k",
						"lrd(x) = k / Σ(reachability-distance(x, neighbor))",
						"reachability-distance = max(k-distance(neighbor), d(x, neighbor))",
						"k = number of nearest neighbors (typically 20)",
						"LOF ≈ 1: Similar density to neighbors (normal)",
						"LOF > 1: Lower density than neighbors (anomaly)",
						"Threshold typically 1.5-2.0 for anomaly classification"
					]
				},
				{
					subtitle: "Ensemble Scoring",
					description: "Combining multiple models for robust detection:",
					details: [
						"Ensemble Score = w₁ × normalized_IF + w₂ × normalized_LOF",
						"normalized_LOF = (LOF - 1) / max(LOF - 1) to [0,1] scale",
						"Ensemble Anomaly = 1 if (Ensemble Score > 0.7) OR (IF=1 AND LOF=1)",
						"Provides consensus-based detection with reduced false positives",
						"Adaptive thresholds based on dataset characteristics"
					]
				}
			]
		},
		{
			title: "6️⃣ Technical Architecture",
			icon: "🏗️",
			color: "from-teal-500 to-teal-600",
			content: [
				{
					subtitle: "Frontend Stack",
					description: "Modern React-based user interface:",
					details: [
						"React 19.2.0 with TypeScript for type safety",
						"Vite 7.2.2 for lightning-fast development and builds",
						"Tailwind CSS 4.x for utility-first styling",
						"Framer Motion for smooth animations and transitions",
						"Chart.js + react-chartjs-2 for data visualization",
						"React Router DOM for client-side navigation",
						"Axios for HTTP requests with TypeScript typing"
					]
				},
				{
					subtitle: "Backend Stack",
					description: "High-performance Python API server:",
					details: [
						"FastAPI framework for async API endpoints",
						"Scikit-learn for IForest and LOF model implementations",
						"NumPy + Pandas for efficient data processing",
						"Joblib for model serialization and loading",
						"Pydantic for request/response validation",
						"CORS middleware for cross-origin requests",
						"Uvicorn ASGI server for production deployment"
					]
				},
				{
					subtitle: "Data Flow",
					description: "End-to-end request processing pipeline:",
					details: [
						"1. User submits data via InputForm component",
						"2. Frontend validates and formats request payload",
						"3. Axios POST request to /score?model={model} endpoint",
						"4. Backend receives and validates input schema",
						"5. Feature preprocessing and normalization",
						"6. Model inference with selected algorithm(s)",
						"7. Results formatted with scores and anomaly flags",
						"8. JSON response sent back to frontend",
						"9. Dashboard components update with new data",
						"10. Visual tables and charts render results"
					]
				}
			]
		}
	];

	return (
		<div ref={containerRef} className="min-h-screen bg-linear-to-br from-white via-blue-50 to-purple-50 text-gray-900 overflow-hidden relative">
			<motion.div
				className="fixed inset-0 w-full h-full pointer-events-none z-0"
				style={{
					background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 80%)`
				}}
				transition={{ type: "tween", duration: 0 }}
			/>

			<div className="fixed inset-0 w-full h-full -z-10">
				<div className="absolute inset-0 bg-white" />
				<motion.div
					style={{ y: parallaxY }}
					className="absolute inset-0 opacity-30"
				>
					<div className="absolute top-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-screen filter blur-3xl" />
					<div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-screen filter blur-3xl" />
				</motion.div>
			</div>

			<div className="relative z-10 w-full min-h-screen p-6 overflow-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className="max-w-7xl mx-auto"
				>
					{/* Header */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.6 }}
						className="text-center mb-12 bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-purple-300/30"
					>
						<h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-linear-to-r from-purple-600 via-blue-600 to-teal-600">
							How It Works
						</h1>
						<p className="text-xl text-gray-700 max-w-3xl mx-auto">
							A comprehensive guide to CX-Anomaly Detector's architecture, algorithms, and data flow
						</p>
						<div className="mt-6 flex gap-4 justify-center">
							<Link to="/">
								<motion.div
									whileHover={{ scale: 1.08, y: -4 }}
									whileTap={{ scale: 0.95 }}
									className="relative group"
								>
									<div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
									<button className="relative px-8 py-3 bg-white rounded-lg text-slate-900 font-semibold hover:bg-gray-100 transition-colors text-base border-2 border-purple-500">
										← Back to Home
									</button>
								</motion.div>
							</Link>
							<Link to="/dashboard">
								<motion.div
									whileHover={{ scale: 1.08, y: -4 }}
									whileTap={{ scale: 0.95 }}
									className="relative group"
								>
									<div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-blue-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300" />
									<button className="relative px-8 py-3 bg-blue-600 rounded-lg text-white font-semibold hover:bg-slate-800 transition-colors text-base">
										Try Dashboard →
									</button>
								</motion.div>
							</Link>
						</div>
					</motion.div>

					{/* Content Sections */}
					{sections.map((section, sectionIdx) => (
						<motion.div
							key={sectionIdx}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ delay: 0.1 * sectionIdx, duration: 0.6 }}
							className="mb-8"
						>
							<div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-purple-200/40 hover:border-purple-400/60 transition-all duration-300">
								{/* Section Header */}
								<div className="flex items-center gap-4 mb-6">
									<div className={`text-5xl p-4 rounded-xl bg-linear-to-br ${section.color} text-white shadow-lg`}>
										{section.icon}
									</div>
									<h2 className="text-3xl font-bold text-gray-800">
										{section.title}
									</h2>
								</div>

								{/* Section Content */}
								{section.content.map((item, itemIdx) => (
									<motion.div
										key={itemIdx}
										initial={{ opacity: 0, x: -20 }}
										whileInView={{ opacity: 1, x: 0 }}
										viewport={{ once: true }}
										transition={{ delay: 0.1 * itemIdx, duration: 0.5 }}
										className="mb-6 last:mb-0"
									>
										<h3 className={`text-2xl font-semibold mb-3 bg-linear-to-r ${section.color} bg-clip-text text-transparent`}>
											{item.subtitle}
										</h3>
										<p className="text-gray-700 mb-4 text-lg">
											{item.description}
										</p>
										<div className="bg-linear-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200/30">
											<div className="space-y-3">
												{item.details.map((detail, detailIdx) => (
													<motion.div
														key={detailIdx}
														initial={{ opacity: 0, x: -10 }}
														whileInView={{ opacity: 1, x: 0 }}
														viewport={{ once: true }}
														transition={{ delay: 0.05 * detailIdx, duration: 0.3 }}
														className="flex items-start gap-3 text-gray-800"
													>
														<span className="text-purple-600 text-xl mt-1 shrink-0">▪</span>
														<span className="leading-relaxed">{detail}</span>
													</motion.div>
												))}
											</div>
										</div>
									</motion.div>
								))}
							</div>
						</motion.div>
					))}

					{/* Footer CTA */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6 }}
						className="text-center mt-12 mb-8 bg-linear-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-12"
					>
						<h2 className="text-4xl font-bold text-white mb-4">
							Ready to Detect Anomalies?
						</h2>
						<p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
							Start analyzing your customer interactions now with our powerful multi-model approach
						</p>
						<Link to="/dashboard">
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<GlowButton
									variant="primary"
									className="bg-white text-purple-600 hover:bg-purple-50 px-12 py-4 text-xl font-bold shadow-xl"
								>
									Launch Dashboard →
								</GlowButton>
							</motion.div>
						</Link>
					</motion.div>
				</motion.div>
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
