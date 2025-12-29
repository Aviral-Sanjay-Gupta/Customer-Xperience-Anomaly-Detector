import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import type { ScoreResult } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

interface FeatureSpaceScatterProps {
	results: ScoreResult[];
}

export default function FeatureSpaceScatter({ results }: FeatureSpaceScatterProps) {
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
				<p className="text-lg">📍 No data available</p>
				<p className="text-sm mt-2">Submit data to see 2D feature space distribution</p>
			</div>
		);
	}

	// Use AHT (x-axis) vs IES (y-axis) for maximum spread and clear separation
	const points = results.map(r => {
		const isAnomaly = r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1;
		const score = r.scores?.ensemble || r.scores?.iforest || r.scores?.lof || 0;
		
		return {
			x: typeof r.aht_seconds === 'number' ? r.aht_seconds : 0,
			y: typeof r.ies === 'number' ? r.ies : 0,
			label: r.interaction_id || 'Unknown',
			score: score,
			isAnomaly: isAnomaly,
			transfers: typeof r.transfers === 'number' ? r.transfers : 0,
			csat: typeof r.csat === 'number' ? r.csat : 0,
			complaints: typeof r.complaints === 'number' ? r.complaints : 0
		};
	});

	// Separate by anomaly status
	const normalPoints = points.filter(p => !p.isAnomaly);
	const anomalyPoints = points.filter(p => p.isAnomaly);

	// Further segment anomalies by severity (high vs medium score)
	const highAnomalies = anomalyPoints.filter(p => p.score > 0.8);
	const mediumAnomalies = anomalyPoints.filter(p => p.score <= 0.8);

	const chartData = {
		datasets: [
			{
				label: 'Normal Interactions',
				data: normalPoints,
				backgroundColor: 'rgba(59, 130, 246, 0.6)',
				borderColor: 'rgba(59, 130, 246, 1)',
				borderWidth: 1,
				pointRadius: 5,
				pointHoverRadius: 7,
			},
			{
				label: 'Medium Risk Anomalies',
				data: mediumAnomalies,
				backgroundColor: 'rgba(251, 191, 36, 0.7)',
				borderColor: 'rgba(251, 191, 36, 1)',
				borderWidth: 2,
				pointRadius: 7,
				pointHoverRadius: 9,
				pointStyle: 'rectRot',
			},
			{
				label: 'High Risk Anomalies',
				data: highAnomalies,
				backgroundColor: 'rgba(239, 68, 68, 0.8)',
				borderColor: 'rgba(239, 68, 68, 1)',
				borderWidth: 2,
				pointRadius: 9,
				pointHoverRadius: 11,
				pointStyle: 'star',
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
				text: '2D Feature Space Distribution (AHT vs IES)',
				font: {
					size: 16,
					weight: 'bold' as const,
				},
				color: '#1f2937',
			},
			tooltip: {
				callbacks: {
					label: (context: any) => {
						const point = context.raw as { x: number; y: number; label: string; score: number; transfers: number; csat: number; complaints: number };
						return [
							`ID: ${point.label}`,
							`AHT: ${point.x}s`,
							`IES: ${point.y}`,
							`CSAT: ${point.csat}`,
							`Transfers: ${point.transfers}`,
							`Complaints: ${point.complaints}`,
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
					text: 'Average Handle Time (seconds)',
					font: {
						size: 12,
						weight: 'bold' as const,
					},
				},
			},
			y: {
				title: {
					display: true,
					text: 'Internal Escalation Score (IES)',
					font: {
						size: 12,
						weight: 'bold' as const,
					},
				},
			},
		},
	};

	const distributionStats = {
		normal: normalPoints.length,
		medium: mediumAnomalies.length,
		high: highAnomalies.length,
		avgAHT: {
			normal: normalPoints.length > 0 ? (normalPoints.reduce((sum, p) => sum + p.x, 0) / normalPoints.length).toFixed(0) : '0',
			anomaly: anomalyPoints.length > 0 ? (anomalyPoints.reduce((sum, p) => sum + p.x, 0) / anomalyPoints.length).toFixed(0) : '0'
		},
		avgIES: {
			normal: normalPoints.length > 0 ? (normalPoints.reduce((sum, p) => sum + p.y, 0) / normalPoints.length).toFixed(1) : '0',
			anomaly: anomalyPoints.length > 0 ? (anomalyPoints.reduce((sum, p) => sum + p.y, 0) / anomalyPoints.length).toFixed(1) : '0'
		}
	};

	return (
		<div className="w-full">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					📍 Feature Space Distribution (Combined Models)
				</h3>
				<p className="text-sm text-gray-600">
					Shows how interactions distribute across AHT vs IES dimensions. Flags anomalies detected by any model (IForest, LOF, or Ensemble). Stars = high-risk, Diamonds = medium-risk, Circles = normal.
				</p>
			</div>
			<div className="h-96">
				<Scatter ref={chartRef} data={chartData} options={options} />
			</div>
			<div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
				<div className="bg-linear-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
					<p className="text-gray-600 mb-1">Normal Interactions</p>
					<p className="text-2xl font-bold text-blue-900">{distributionStats.normal}</p>
					<p className="text-gray-600 mt-1">Avg AHT: {distributionStats.avgAHT.normal}s</p>
				</div>
				<div className="bg-linear-to-r from-amber-50 to-amber-100 rounded-lg p-3 border border-amber-200">
					<p className="text-gray-600 mb-1">Medium Risk</p>
					<p className="text-2xl font-bold text-amber-900">{distributionStats.medium}</p>
					<p className="text-gray-600 mt-1">Score: 0.6-0.7</p>
				</div>
				<div className="bg-linear-to-r from-red-50 to-red-100 rounded-lg p-3 border border-red-200">
					<p className="text-gray-600 mb-1">High Risk</p>
					<p className="text-2xl font-bold text-red-900">{distributionStats.high}</p>
					<p className="text-gray-600 mt-1">Score: &gt;0.7</p>
				</div>
			</div>
			<div className="mt-3 bg-linear-to-r from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
				<p className="text-xs text-gray-700">
					<strong>💡 Pattern Analysis:</strong> Normal interactions cluster in lower-left (low AHT, low IES). 
					Anomalies tend toward high AHT + high IES indicating complex, escalated cases. Combined high AHT + high IES = strongest anomaly indicator.
					Avg AHT: Normal={distributionStats.avgAHT.normal}s, Anomaly={distributionStats.avgAHT.anomaly}s | Avg IES: Normal={distributionStats.avgIES.normal}, Anomaly={distributionStats.avgIES.anomaly}
				</p>
			</div>
		</div>
	);
}
