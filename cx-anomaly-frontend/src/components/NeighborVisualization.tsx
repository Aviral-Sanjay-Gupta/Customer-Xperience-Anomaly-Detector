import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import type { ScoreResult } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface NeighborVisualizationProps {
	results: ScoreResult[];
}

export default function NeighborVisualization({ results }: NeighborVisualizationProps) {
	const chartRef = useRef<ChartJS<'scatter'>>(null);

	useEffect(() => {
		return () => {
			if (chartRef.current) {
				chartRef.current.destroy();
			}
		};
	}, []);

	if (!results || results.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				<p className="text-lg">🎯 No data available</p>
				<p className="text-sm mt-2">Submit data to see neighbor density visualization</p>
			</div>
		);
	}

	// Use CSAT and IES as primary dimensions for 2D visualization (most interpretable)
	const normalPoints = results
		.filter(r => {
			const isAnomaly = r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1;
			return !isAnomaly;
		})
		.map(r => ({
			x: typeof r.csat === 'number' ? r.csat : 0,
			y: typeof r.ies === 'number' ? r.ies : 0,
			label: r.interaction_id || 'Unknown',
			score: r.scores?.ensemble || r.scores?.iforest || r.scores?.lof || 0
		}));

	const anomalyPoints = results
		.filter(r => {
			const isAnomaly = r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1;
			return isAnomaly;
		})
		.map(r => ({
			x: typeof r.csat === 'number' ? r.csat : 0,
			y: typeof r.ies === 'number' ? r.ies : 0,
			label: r.interaction_id || 'Unknown',
			score: r.scores?.ensemble || r.scores?.iforest || r.scores?.lof || 0
		}));

	const chartData = {
		datasets: [
			{
				label: 'Normal Points',
				data: normalPoints,
				backgroundColor: 'rgba(34, 197, 94, 0.6)',
				borderColor: 'rgba(34, 197, 94, 1)',
				borderWidth: 1,
				pointRadius: 6,
				pointHoverRadius: 8,
			},
			{
				label: 'Anomalies',
				data: anomalyPoints,
				backgroundColor: 'rgba(239, 68, 68, 0.8)',
				borderColor: 'rgba(239, 68, 68, 1)',
				borderWidth: 2,
				pointRadius: 8,
				pointHoverRadius: 10,
				pointStyle: 'triangle',
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: true,
				position: 'top' as const,
				labels: {
					usePointStyle: true,
					padding: 15,
					font: {
						size: 12,
					},
				},
			},
			title: {
				display: true,
				text: 'IF/LOF Neighbor Density Visualization (CSAT vs IES)',
				font: {
					size: 16,
					weight: 'bold' as const,
				},
				color: '#1f2937',
			},
			tooltip: {
				callbacks: {
					label: (context: any) => {
						const point = context.raw as { x: number; y: number; label: string; score: number };
						return [
							`ID: ${point.label}`,
							`CSAT: ${point.x}`,
							`IES: ${point.y}`,
							`Anomaly Score: ${point.score.toFixed(4)}`
						];
					}
				}
			}
		},
		scales: {
			x: {
				title: {
					display: true,
					text: 'CSAT (Customer Satisfaction Score)',
					font: {
						size: 12,
						weight: 'bold' as const,
					},
				},
				min: 0,
				max: 6,
			},
			y: {
				title: {
					display: true,
					text: 'IES (Internal Efficiency Score)',
					font: {
						size: 12,
						weight: 'bold' as const,
					},
				},
				min: 0,
				max: 110,
			},
		},
	};

	const densityInfo = {
		total: results.length,
		normal: normalPoints.length,
		anomalies: anomalyPoints.length,
		ratio: results.length > 0 ? ((anomalyPoints.length / results.length) * 100).toFixed(1) : '0.0'
	};

	return (
		<div className="w-full">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					🎯 Neighbor Density & Clustering Analysis
				</h3>
				<p className="text-sm text-gray-600">
					2D projection showing how IF/LOF identifies anomalies based on local density. Dense clusters = normal behavior, isolated points = anomalies.
				</p>
			</div>
			<div className="h-80">
				<Scatter ref={chartRef} data={chartData} options={options} />
			</div>
			<div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
				<div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
					<p className="text-gray-600 mb-1">Total Points</p>
					<p className="text-2xl font-bold text-blue-900">{densityInfo.total}</p>
				</div>
				<div className="bg-linear-to-r from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
					<p className="text-gray-600 mb-1">Normal (Dense)</p>
					<p className="text-2xl font-bold text-green-900">{densityInfo.normal}</p>
				</div>
				<div className="bg-linear-to-r from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
					<p className="text-gray-600 mb-1">Anomalies (Sparse)</p>
					<p className="text-2xl font-bold text-red-900">{densityInfo.anomalies}</p>
				</div>
				<div className="bg-linear-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
					<p className="text-gray-600 mb-1">Anomaly Rate</p>
					<p className="text-2xl font-bold text-purple-900">{densityInfo.ratio}%</p>
				</div>
			</div>
			<div className="mt-3 bg-linear-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
				<p className="text-xs text-gray-700">
					<strong>💡 How to interpret:</strong> Green circles cluster in dense regions (normal behavior). 
					Red triangles appear isolated or in sparse regions (anomalous behavior). 
					LOF measures how much less dense a point is compared to its neighbors.
				</p>
			</div>
		</div>
	);
}
