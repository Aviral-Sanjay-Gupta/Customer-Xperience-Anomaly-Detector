import type { ScoreResult } from "../types";

interface DetailedScoresTableProps {
	results: ScoreResult[];
}

export default function DetailedScoresTable({ results }: DetailedScoresTableProps) {
	return (
		<div className="overflow-x-auto bg-white rounded-xl shadow-lg p-6 border border-blue-100">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Model Scores</h3>
			<table className="min-w-full table-auto border-collapse border border-black">
				<thead className="bg-purple-100">
					<tr>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">Interaction ID</th>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">IForest Score</th>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">IForest Anomaly</th>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">LOF Score</th>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">LOF Anomaly</th>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">Ensemble Score</th>
						<th className="px-4 py-2 text-left text-purple-700 border border-black">Ensemble Anomaly</th>
					</tr>
				</thead>
				<tbody>
					{results.length === 0 ? (
						<tr>
							<td colSpan={7} className="text-center text-gray-400 py-6 border border-black">No results yet.</td>
						</tr>
					) : (
						results.map((r, idx) => {
							// Extract scores from nested structure
							const iforestScore = r.scores?.iforest;
							const lofScore = r.scores?.lof;
							const ensembleScore = r.scores?.ensemble;
							
							// Extract anomaly flags
							const iforestAnomaly = r.is_anomaly?.iforest === 1;
							const lofAnomaly = r.is_anomaly?.lof === 1;
							const ensembleAnomaly = r.is_anomaly?.ensemble === 1;
							
							// Determine if any anomaly exists for row highlighting
							const hasAnomaly = iforestAnomaly || lofAnomaly || ensembleAnomaly;
							
							return (
								<tr
									key={idx}
									className={`transition ${hasAnomaly ? 'bg-purple-200 hover:bg-purple-100' : 'hover:bg-purple-50'}`}
								>
									<td className="px-4 py-2 border border-black font-medium">{r.interaction_id || '-'}</td>
									<td className="px-4 py-2 border border-black text-center">
										{iforestScore !== undefined ? Number(iforestScore).toFixed(4) : '-'}
									</td>
									<td className="px-4 py-2 border border-black text-center">
										{iforestAnomaly ? (
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
												⚠️ Anomaly
											</span>
										) : r.is_anomaly?.iforest === 0 ? (
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
												✓ Normal
											</span>
										) : '-'}
									</td>
									<td className="px-4 py-2 border border-black text-center">
										{lofScore !== undefined ? Number(lofScore).toFixed(4) : '-'}
									</td>
									<td className="px-4 py-2 border border-black text-center">
										{lofAnomaly ? (
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
												⚠️ Anomaly
											</span>
										) : r.is_anomaly?.lof === 0 ? (
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
												✓ Normal
											</span>
										) : '-'}
									</td>
									<td className="px-4 py-2 border border-black text-center">
										{ensembleScore !== undefined ? Number(ensembleScore).toFixed(4) : '-'}
									</td>
									<td className="px-4 py-2 border border-black text-center">
										{ensembleAnomaly ? (
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
												⚠️ Anomaly
											</span>
										) : r.is_anomaly?.ensemble === 0 ? (
											<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
												✓ Normal
											</span>
										) : '-'}
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}
