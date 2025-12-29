import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ScoreResult } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FeatureImportanceProps {
	results: ScoreResult[];
}

export default function FeatureImportance({ results }: FeatureImportanceProps) {
	const chartRef = useRef<ChartJS<'bar'>>(null);

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
				<p className="text-lg">📊 No data available</p>
				<p className="text-sm mt-2">Submit data to see feature importance analysis</p>
			</div>
		);
	}

	// Calculate feature importance based on variance and correlation with anomaly scores
	const features = ['csat', 'ies', 'complaints', 'aht_seconds', 'hold_time_seconds', 'transfers'];
	const featureNames = ['CSAT', 'IES', 'Complaints', 'AHT', 'Hold Time', 'Transfers'];
	
	// Calculate normalized variance for each feature
	const featureStats = features.map((feature, idx) => {
		const values = results.map(r => {
			const val = r[feature as keyof ScoreResult];
			return typeof val === 'number' ? val : 0;
		});
		
		const mean = values.reduce((a, b) => a + b, 0) / values.length;
		const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
		const stdDev = Math.sqrt(variance);
		
		// Calculate correlation with anomaly scores
		const anomalyScores = results.map(r => 
			r.scores?.ensemble || r.scores?.iforest || r.scores?.lof || r.ensemble_score || r.anomaly_score || 0
		);
		const anomalyMean = anomalyScores.reduce((a, b) => a + b, 0) / anomalyScores.length;
		
		// Pearson correlation coefficient
		let correlation = 0;
		if (stdDev > 0) {
			const covariance = values.reduce((sum, val, i) => 
				sum + (val - mean) * (anomalyScores[i] - anomalyMean), 0
			) / values.length;
			
			const anomalyStdDev = Math.sqrt(
				anomalyScores.reduce((sum, val) => sum + Math.pow(val - anomalyMean, 2), 0) / anomalyScores.length
			);
			
			if (anomalyStdDev > 0) {
				correlation = Math.abs(covariance / (stdDev * anomalyStdDev));
			}
		}
		
		// Importance score combines variance and correlation
		const importance = (stdDev / Math.max(...values.map(v => Math.abs(v - mean))) * 50) + (correlation * 50);
		
		return {
			name: featureNames[idx],
			importance: Math.min(importance, 100),
			correlation: correlation
		};
	});

	// Sort by importance
	featureStats.sort((a, b) => b.importance - a.importance);

	const chartData = {
		labels: featureStats.map(f => f.name),
		datasets: [
			{
				label: 'Feature Importance Score',
				data: featureStats.map(f => f.importance),
				backgroundColor: featureStats.map((_, i) => {
					const colors = [
						'rgba(239, 68, 68, 0.8)',   // red
						'rgba(249, 115, 22, 0.8)',  // orange
						'rgba(234, 179, 8, 0.8)',   // yellow
						'rgba(34, 197, 94, 0.8)',   // green
						'rgba(59, 130, 246, 0.8)',  // blue
						'rgba(168, 85, 247, 0.8)'   // purple
					];
					return colors[i % colors.length];
				}),
				borderColor: featureStats.map((_, i) => {
					const colors = [
						'rgba(239, 68, 68, 1)',
						'rgba(249, 115, 22, 1)',
						'rgba(234, 179, 8, 1)',
						'rgba(34, 197, 94, 1)',
						'rgba(59, 130, 246, 1)',
						'rgba(168, 85, 247, 1)'
					];
					return colors[i % colors.length];
				}),
				borderWidth: 2,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
			title: {
				display: true,
				text: 'Feature Importance Analysis',
				font: {
					size: 16,
					weight: 'bold' as const,
				},
				color: '#1f2937',
			},
			tooltip: {
				callbacks: {
					label: (context: any) => {
						const feature = featureStats[context.dataIndex];
						return [
							`Importance: ${feature.importance.toFixed(1)}`,
							`Correlation: ${(feature.correlation * 100).toFixed(1)}%`
						];
					}
				}
			}
		},
		scales: {
			y: {
				beginAtZero: true,
				max: 100,
				title: {
					display: true,
					text: 'Importance Score',
					font: {
						size: 12,
						weight: 'bold' as const,
					},
				},
				ticks: {
					callback: (value: any) => `${value}%`
				}
			},
			x: {
				title: {
					display: true,
					text: 'Features',
					font: {
						size: 12,
						weight: 'bold' as const,
					},
				},
			},
		},
	};

	return (
		<div className="w-full">
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					🔍 Feature Impact on Anomaly Detection
				</h3>
				<p className="text-sm text-gray-600">
					Shows which features contribute most to identifying anomalies (based on variance and correlation with anomaly scores)
				</p>
			</div>
			<div className="h-75">
				<Bar ref={chartRef} data={chartData} options={options} />
			</div>
			<div className="mt-4 grid grid-cols-2 gap-2 text-xs">
				{featureStats.slice(0, 3).map((feature, idx) => (
					<div key={idx} className="bg-linear-to-r from-gray-50 to-gray-100 rounded-lg p-2 border border-gray-200">
						<div className="flex items-center gap-2">
							<span className="text-lg">{['🥇', '🥈', '🥉'][idx]}</span>
							<div>
								<p className="font-semibold text-gray-800">{feature.name}</p>
								<p className="text-gray-600">
									{feature.importance.toFixed(1)}% importance • {(feature.correlation * 100).toFixed(1)}% correlation
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
