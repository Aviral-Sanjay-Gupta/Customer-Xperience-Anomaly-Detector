import { Bar } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import type { ScoreResult } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartsProps {
	results?: ScoreResult[];
}

export default function Charts({ results = [] }: ChartsProps) {
	const chartData = {
		labels: results.map(r => r.interaction_id || 'Unknown'),
		datasets: [
			{
				label: "Anomaly Score",
				data: results.map(r => 
					r.scores?.ensemble || r.scores?.iforest || r.scores?.lof || r.ensemble_score || r.anomaly_score || 0
				),
				backgroundColor: "rgba(59,130,246,0.7)", // blue-500
				borderRadius: 8,
			},
		],
	};

	const options = {
		responsive: true,
		plugins: {
			legend: {
				display: true,
				position: "top" as const,
				labels: {
					color: "#272727",
					font: { size: 14, weight: "bold" as const },
				},
			},
			title: {
				display: true,
				text: "Anomaly Score Distribution",
				color: "#272727", // black
				font: { size: 18 },
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				max: 2,
				ticks: { color: "#272727" }, // black
				grid: { color: "#dbeafe" }, // blue-100
			},
			x: {
				ticks: { color: "#272727" }, // black
				grid: { color: "#dbeafe" }, // blue-100
			},
		},
	};

	return (
		<div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
			<Bar data={chartData} options={options} />
		</div>
	);
}
