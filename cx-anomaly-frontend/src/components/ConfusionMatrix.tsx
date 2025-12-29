import type { ScoreResult } from '../types';

interface ConfusionMatrixProps {
	results: ScoreResult[];
}

export default function ConfusionMatrix({ results }: ConfusionMatrixProps) {
	if (!results || results.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				<p className="text-lg">📊 No data available</p>
				<p className="text-sm mt-2">Submit data to see model comparison matrix</p>
			</div>
		);
	}

	// Calculate confusion matrix comparing IForest vs LOF predictions
	let truePositive = 0;   // Both models agree: Anomaly
	let trueNegative = 0;   // Both models agree: Normal
	let falsePositive = 0;  // IForest says Normal, LOF says Anomaly
	let falseNegative = 0;  // IForest says Anomaly, LOF says Normal

	results.forEach(r => {
		const iforestAnomaly = r.is_anomaly?.iforest === 1;
		const lofAnomaly = r.is_anomaly?.lof === 1;

		if (iforestAnomaly && lofAnomaly) {
			truePositive++;
		} else if (!iforestAnomaly && !lofAnomaly) {
			trueNegative++;
		} else if (!iforestAnomaly && lofAnomaly) {
			falsePositive++;
		} else if (iforestAnomaly && !lofAnomaly) {
			falseNegative++;
		}
	});

	const total = truePositive + trueNegative + falsePositive + falseNegative;
	const agreement = total > 0 ? (((truePositive + trueNegative) / total) * 100).toFixed(1) : '0.0';
	const disagreement = total > 0 ? (((falsePositive + falseNegative) / total) * 100).toFixed(1) : '0.0';

	// Calculate metrics
	const precision = (truePositive + falsePositive) > 0 ? ((truePositive / (truePositive + falsePositive)) * 100).toFixed(1) : '0.0';
	const recall = (truePositive + falseNegative) > 0 ? ((truePositive / (truePositive + falseNegative)) * 100).toFixed(1) : '0.0';
	const f1Score = parseFloat(precision) + parseFloat(recall) > 0 
		? (2 * parseFloat(precision) * parseFloat(recall) / (parseFloat(precision) + parseFloat(recall))).toFixed(1) 
		: '0.0';

	const getPercentage = (value: number) => {
		return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
	};

	const getCellColor = (value: number, isAgreement: boolean) => {
		const percentage = parseFloat(getPercentage(value));
		if (isAgreement) {
			if (percentage > 30) return 'from-green-100 to-green-200 border-green-300';
			if (percentage > 15) return 'from-green-50 to-green-100 border-green-200';
			return 'from-green-50 to-white border-green-100';
		} else {
			if (percentage > 30) return 'from-red-100 to-red-200 border-red-300';
			if (percentage > 15) return 'from-red-50 to-red-100 border-red-200';
			return 'from-red-50 to-white border-red-100';
		}
	};

	return (
		<div className="w-full">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					📊 Model Agreement Matrix (IForest vs LOF)
				</h3>
				<p className="text-sm text-gray-600">
					Compares predictions from both models to measure agreement and identify consensus vs conflicts.
				</p>
			</div>

			{/* Confusion Matrix Table */}
			<div className="overflow-x-auto mb-4">
				<div className="inline-block min-w-full">
					<div className="grid grid-cols-1 gap-4">
						{/* Matrix Header */}
						<div className="text-center font-semibold text-gray-700 text-sm mb-2">
							IForest (rows) vs LOF (columns)
						</div>
						
						{/* Matrix Grid */}
						<div className="grid grid-cols-3 gap-2">
							{/* Header row */}
							<div className="bg-gray-100 rounded-lg p-2 text-center font-semibold text-sm"></div>
							<div className="bg-purple-100 rounded-lg p-2 text-center font-semibold text-sm border-2 border-purple-300">
								LOF: Normal
							</div>
							<div className="bg-purple-100 rounded-lg p-2 text-center font-semibold text-sm border-2 border-purple-300">
								LOF: Anomaly
							</div>

							{/* Row 1: IForest Normal */}
							<div className="bg-purple-100 rounded-lg p-2 text-center font-semibold text-sm border-2 border-purple-300">
								IForest: Normal
							</div>
							<div className={`bg-linear-to-br ${getCellColor(trueNegative, true)} rounded-lg p-4 text-center border-2 transition-all hover:scale-105`}>
								<div className="text-3xl font-bold text-gray-800">{trueNegative}</div>
								<div className="text-xs text-gray-600 mt-1">{getPercentage(trueNegative)}%</div>
								<div className="text-xs text-green-700 font-semibold mt-1">✓ Both Normal</div>
							</div>
							<div className={`bg-linear-to-br ${getCellColor(falsePositive, false)} rounded-lg p-4 text-center border-2 transition-all hover:scale-105`}>
								<div className="text-3xl font-bold text-gray-800">{falsePositive}</div>
								<div className="text-xs text-gray-600 mt-1">{getPercentage(falsePositive)}%</div>
								<div className="text-xs text-orange-700 font-semibold mt-1">⚠️ LOF Only</div>
							</div>

							{/* Row 2: IForest Anomaly */}
							<div className="bg-purple-100 rounded-lg p-2 text-center font-semibold text-sm border-2 border-purple-300">
								IForest: Anomaly
							</div>
							<div className={`bg-linear-to-br ${getCellColor(falseNegative, false)} rounded-lg p-4 text-center border-2 transition-all hover:scale-105`}>
								<div className="text-3xl font-bold text-gray-800">{falseNegative}</div>
								<div className="text-xs text-gray-600 mt-1">{getPercentage(falseNegative)}%</div>
								<div className="text-xs text-orange-700 font-semibold mt-1">⚠️ IForest Only</div>
							</div>
							<div className={`bg-linear-to-br ${getCellColor(truePositive, true)} rounded-lg p-4 text-center border-2 transition-all hover:scale-105`}>
								<div className="text-3xl font-bold text-gray-800">{truePositive}</div>
								<div className="text-xs text-gray-600 mt-1">{getPercentage(truePositive)}%</div>
								<div className="text-xs text-green-700 font-semibold mt-1">✓ Both Anomaly</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Metrics Summary */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
				<div className="bg-linear-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
					<p className="text-gray-600 mb-1">Agreement</p>
					<p className="text-2xl font-bold text-green-900">{agreement}%</p>
					<p className="text-gray-600 mt-1">{truePositive + trueNegative} records</p>
				</div>
				<div className="bg-linear-to-r from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
					<p className="text-gray-600 mb-1">Disagreement</p>
					<p className="text-2xl font-bold text-red-900">{disagreement}%</p>
					<p className="text-gray-600 mt-1">{falsePositive + falseNegative} records</p>
				</div>
				<div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
					<p className="text-gray-600 mb-1">Precision</p>
					<p className="text-2xl font-bold text-blue-900">{precision}%</p>
					<p className="text-gray-600 mt-1">Anomaly accuracy</p>
				</div>
				<div className="bg-linear-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
					<p className="text-gray-600 mb-1">F1 Score</p>
					<p className="text-2xl font-bold text-purple-900">{f1Score}%</p>
					<p className="text-gray-600 mt-1">Harmonic mean</p>
				</div>
			</div>

			{/* Interpretation Guide */}
			<div className="bg-linear-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
				<p className="text-xs text-gray-700">
					<strong>💡 Interpretation:</strong> Green cells = model agreement (both say anomaly or both say normal). 
					Red/orange cells = disagreement (models conflict). High agreement ({agreement}%) suggests consistent detection. 
					Ensemble model uses weighted voting to resolve conflicts.
				</p>
			</div>
		</div>
	);
}
