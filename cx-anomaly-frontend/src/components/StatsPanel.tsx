import type { StatsData } from "../types";

interface StatsPanelProps {
	stats: StatsData;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
	const {
		totalInteractions = 0,
		totalFlags = 0,
		fileName = "No file loaded",
		totalFeatures = 6,
		thresholds = { iforest: 0, lof: 0 },
	} = stats;

	// statCards variable is defined but not used in rendering - kept for potential future use
	/* 
	const statCards = [
		{
			label: "Total Interactions",
			value: totalInteractions.toLocaleString(),
			icon: "📊",
			color: "from-blue-500 to-blue-600",
		},
		{
			label: "Anomalies Detected",
			value: totalFlags.toLocaleString(),
			icon: "🚨",
			color: "from-red-500 to-red-600",
		},
		{
			label: "Dataset Loaded",
			value: fileName,
			icon: "📁",
			color: "from-green-500 to-green-600",
			isText: true,
		},
		{
			label: "Features Used",
			value: totalFeatures,
			icon: "🔧",
			color: "from-purple-500 to-purple-600",
		},
		{
			label: "IForest Threshold",
			value: thresholds.iforest.toFixed(4),
			icon: "🎯",
			color: "from-orange-500 to-orange-600",
		},
		{
			label: "LOF Threshold",
			value: thresholds.lof.toFixed(4),
			icon: "🎯",
			color: "from-pink-500 to-pink-600",
		},
	];
	*/

	return (
		<div className="bg-white rounded-lg shadow p-6 border border-gray-200">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				Analysis Summary
			</h3>

			<div className="space-y-3 text-sm">
				<div className="flex justify-between items-center">
					<span className="text-gray-600 font-medium">Total Interactions:</span>
					<span className="text-gray-900 font-semibold">{totalInteractions.toLocaleString()}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600 font-medium">Anomalies Detected:</span>
					<span className="text-red-600 font-semibold">{totalFlags.toLocaleString()}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600 font-medium">Dataset Loaded:</span>
					<span className="text-gray-900 font-semibold truncate max-w-[200px]" title={fileName}>{fileName}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600 font-medium">Features Used:</span>
					<span className="text-gray-900 font-semibold">{totalFeatures}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600 font-medium">IForest Threshold:</span>
					<span className="text-gray-900 font-semibold">{thresholds.iforest.toFixed(4)}</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-gray-600 font-medium">LOF Threshold:</span>
					<span className="text-gray-900 font-semibold">{thresholds.lof.toFixed(4)}</span>
				</div>

				{totalFlags > 0 && totalInteractions > 0 && (
					<div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
						<span className="text-gray-600 font-medium">Anomaly Rate:</span>
						<span className="text-blue-600 font-semibold">
							{((totalFlags / totalInteractions) * 100).toFixed(2)}%
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
