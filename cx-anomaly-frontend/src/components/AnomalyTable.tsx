import type { ScoreResult } from "../types";

interface AnomalyTableProps {
	results: ScoreResult[];
}

export default function AnomalyTable({ results }: AnomalyTableProps) {
	return (
		<div className="overflow-x-auto bg-white rounded-xl shadow-lg p-6 border border-blue-100">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">Anomaly Scores</h3>
			<table className="min-w-full table-auto border-collapse border border-black">
				<thead className="bg-blue-100">
					<tr>
						<th className="px-4 py-2 text-left text-blue-700 border border-black">Interaction ID</th>
						<th className="px-4 py-2 text-left text-blue-700 border border-black">Timestamp</th>
						<th className="px-4 py-2 text-left text-blue-700 border border-black">CSAT</th>
						<th className="px-4 py-2 text-left text-blue-700 border border-black">IES</th>
						<th className="px-4 py-2 text-left text-blue-700 border border-black">Complaints</th>
                        <th className="px-4 py-2 text-left text-blue-700 border border-black">HT (in secs)</th>
                        <th className="px-4 py-2 text-left text-blue-700 border border-black">AHT (in secs)</th>
                        <th className="px-4 py-2 text-left text-blue-700 border border-black">Transfers</th>
                        <th className="px-4 py-2 text-left text-blue-700 border border-black">Channel</th>
                        <th className="px-4 py-2 text-left text-blue-700 border border-black">Language</th>
                        <th className="px-4 py-2 text-left text-blue-700 border border-black">Queue</th>
					</tr>
				</thead>
				<tbody>
					{results.length === 0 ? (
						<tr>
							<td colSpan={12} className="text-center text-gray-400 py-6 border border-black">No results yet.</td>
						</tr>
					) : (
						results.map((r, idx) => {
							// Check new nested is_anomaly structure
							const isAnomaly = r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1 || 
											  r.ensemble_anomaly || (r.anomaly_score !== undefined && r.anomaly_score > 0.8);
							return (
								<tr
									key={idx}
									className={`transition ${isAnomaly ? 'bg-blue-300 hover:bg-blue-100' : 'hover:bg-blue-100'}`}
								>
									<td className="px-4 py-2 border border-black">{r.interaction_id || '-'}</td>
									<td className="px-4 py-2 border border-black">{r.timestamp || '-'}</td>
									<td className="px-4 py-2 border border-black">{r.csat !== undefined && r.csat !== null ? r.csat : '-'}</td>
									<td className="px-4 py-2 border border-black">{r.ies !== undefined && r.ies !== null ? r.ies : '-'}</td>
									<td className="px-4 py-2 border border-black">{r.complaints !== undefined && r.complaints !== null ? r.complaints : '-'}</td>
									<td className="px-4 py-2 border border-black">{r.hold_time_seconds !== undefined && r.hold_time_seconds !== null ? r.hold_time_seconds : '-'}</td>
									<td className="px-4 py-2 border border-black">{r.aht_seconds !== undefined && r.aht_seconds !== null ? r.aht_seconds : '-'}</td>
									<td className="px-4 py-2 border border-black">{r.transfers !== undefined && r.transfers !== null ? r.transfers : '-'}</td>
									<td className="px-4 py-2 border border-black">{r.channel || '-'}</td>
									<td className="px-4 py-2 border border-black">{r.language || '-'}</td>
									<td className="px-4 py-2 border border-black">{r.queue || '-'}</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
}