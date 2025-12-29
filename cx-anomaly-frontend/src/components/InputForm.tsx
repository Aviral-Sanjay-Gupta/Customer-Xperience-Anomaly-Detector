import { useState, ChangeEvent, FormEvent } from "react";
import { scoreInteractions, getModels } from "../services/api";
import Papa from "papaparse"; // For CSV parsing
import type { InteractionRecord, ScoreResult, StatsData, SingleRecordForm, InputMode, ModelName } from "../types";

interface InputFormProps {
	onScore: (results: ScoreResult[], isSingleRecord: boolean) => void;
	onStatsUpdate?: (stats: StatsData) => void;
}

export default function InputForm({ onScore, onStatsUpdate }: InputFormProps) {
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [inputMode, setInputMode] = useState<InputMode>("dataset");
	const [selectedModel, setSelectedModel] = useState<ModelName>("both");
	const [singleRecord, setSingleRecord] = useState<SingleRecordForm>({
		interaction_id: "",
		timestamp: "",
		csat: "",
		ies: "",
		complaints: "",
		aht_seconds: "",
		hold_time_seconds: "",
		transfers: "",
		channel: "",
		language: "",
		queue: ""
	});

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			const fileType = selectedFile.name.split(".").pop()?.toLowerCase() || "";
			if (["csv", "xlsx"].includes(fileType)) {
				setFile(selectedFile);
				setError("");
			} else {
				setError("Please select a CSV or XLSX file");
				setFile(null);
			}
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!file) {
			setError("Please select a file first");
			return;
		}

		setLoading(true);
		setError("");
		try {
			let records: InteractionRecord[] = [];
			const fileType = file.name.split(".").pop()?.toLowerCase() || "";
			if (fileType === "csv") {
				// Parse CSV to JSON
				const text = await file.text();
				const result = Papa.parse(text, { header: true, skipEmptyLines: true });
				// Map CSV rows to expected schema
				console.log(result.data.length);				
				records = (result.data as any[]).map((row: any) => ({
					interaction_id: row.interaction_id || "",
					timestamp: row.timestamp || "",
					csat: parseFloat(row.csat) || 1,
					ies: parseFloat(row.ies) || 0,
					complaints: parseInt(row.complaints) || 0,
					aht_seconds: parseFloat(row.aht_seconds) || 0,
					hold_time_seconds: parseFloat(row.hold_time_seconds) ||0,	
					transfers: parseInt(row.transfers) || 0,
					channel: row.channel || "",
					language: row.language || "",
					queue: row.queue || ""
				
				}));
				   // ...existing code...
			} else if (fileType === "xlsx") {
				// XLSX parsing (requires 'xlsx' library)
				setError("XLSX support not implemented in this demo. Please use CSV.");
				setLoading(false);
				return;
			} else {
				setError("Unsupported file type.");
				setLoading(false);
				return;
			}

           // Send records to backend with selected model
		   const res = await scoreInteractions(records, selectedModel);
		   console.log('Backend response:', res.data);
		   
		   // Merge originalRecords with scores array from backend
		   const scores = res.data.scores || [];
		   const enriched = records.map(orig => {
			   const match = scores.find(s => s.interaction_id === orig.interaction_id);
			   if (match) {
				   return { 
					   ...orig, 
					   scores: match.scores,
					   is_anomaly: match.is_anomaly
				   } as ScoreResult;
			   }
			   return orig as ScoreResult;
		   });
		   console.log('Enriched array:', enriched);
			   
			   // Fetch model metadata for thresholds
			   let iforestThreshold = 0.6; // Default fallback
			   let lofThreshold = 1.5; // Default fallback
			   
			   try {
				   const modelsRes = await getModels();
				   const modelsData = modelsRes.data.models;
				   
				   if (typeof modelsData === 'object' && !Array.isArray(modelsData)) {
					   if (modelsData.iforest) {
						   iforestThreshold = modelsData.iforest.threshold;
					   }
					   if (modelsData.lof) {
						   lofThreshold = modelsData.lof.threshold;
					   }
				   }
				   console.log('Fetched thresholds - IForest:', iforestThreshold, 'LOF:', lofThreshold);
			   } catch (err) {
				   console.warn('Failed to fetch model thresholds, using defaults:', err);
			   }
			   
		   // Count anomalies - check nested structure based on selected model
		   const totalFlags = enriched.filter(r => {
			   if (selectedModel === 'iforest') {
				   return r.is_anomaly?.iforest === 1;
			   } else if (selectedModel === 'lof') {
				   return r.is_anomaly?.lof === 1;
			   } else {
				   // For 'both' model, check ensemble or any anomaly
				   return r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1;
			   }
		   }).length;			   const statsData = {
				   totalInteractions: enriched.length,
				   totalFlags,
				   fileName: file.name,
				   totalFeatures: 6, // csat, ies, complaints, aht_seconds, hold_time_seconds, transfers
				   thresholds: {
					   iforest: iforestThreshold,
					   lof: lofThreshold,
				   },
			   };
			   console.log('Stats data being sent:', statsData);
			   
			   // Update stats
			   if (onStatsUpdate) {
				   onStatsUpdate(statsData);
			   }
			   
			   onScore(enriched, false);
			   // Don't reset file so it stays selected
			   // setFile(null);
		} catch (err: any) {
			console.error("Error during file processing:", err);
			console.error("Error response:", err.response?.data);
			setError(`Failed to process file or upload: ${err.response?.data?.detail || err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleSingleRecordChange = (field: keyof SingleRecordForm, value: string) => {
		setSingleRecord(prev => ({ ...prev, [field]: value }));
	};

	const handleSingleRecordSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setLoading(true);
		setError("");
		
		try {
			const record = {
				interaction_id: singleRecord.interaction_id || `manual_${Date.now()}`,
				timestamp: singleRecord.timestamp || new Date().toISOString(),
				csat: parseFloat(singleRecord.csat) || 1,
				ies: parseFloat(singleRecord.ies) || 0,
				complaints: parseInt(singleRecord.complaints) || 0,
				aht_seconds: parseFloat(singleRecord.aht_seconds) || 0,
				hold_time_seconds: parseFloat(singleRecord.hold_time_seconds) || 0,
				transfers: parseInt(singleRecord.transfers) || 0,
				channel: singleRecord.channel || "",
				language: singleRecord.language || "",
				queue: singleRecord.queue || ""
			};

			const res = await scoreInteractions([record], selectedModel);
			console.log('Single record backend response:', res.data);
			
			const scores = res.data.scores || [];
			const match = scores[0];
			const enriched = [{
				...record,
				scores: match?.scores,
				is_anomaly: match?.is_anomaly
			} as ScoreResult];
			
			// Fetch model metadata for thresholds
			let iforestThreshold = 0.6; // Default fallback
			let lofThreshold = 1.5; // Default fallback
			
			try {
				const modelsRes = await getModels();
				const modelsData = modelsRes.data.models;
				
				if (typeof modelsData === 'object' && !Array.isArray(modelsData)) {
					if (modelsData.iforest) {
						iforestThreshold = modelsData.iforest.threshold;
					}
					if (modelsData.lof) {
						lofThreshold = modelsData.lof.threshold;
					}
				}
				console.log('Fetched thresholds - IForest:', iforestThreshold, 'LOF:', lofThreshold);
			} catch (err) {
				console.warn('Failed to fetch model thresholds, using defaults:', err);
			}
			
			const totalFlags = enriched.filter(r => {
				if (selectedModel === 'iforest') {
					return r.is_anomaly?.iforest === 1;
				} else if (selectedModel === 'lof') {
					return r.is_anomaly?.lof === 1;
				} else {
					return r.is_anomaly?.ensemble === 1 || r.is_anomaly?.iforest === 1 || r.is_anomaly?.lof === 1;
				}
			}).length;
			
			if (onStatsUpdate) {
				onStatsUpdate({
					totalInteractions: 1,
					totalFlags,
					fileName: "Single Record Input",
					totalFeatures: 6,
					thresholds: {
						iforest: iforestThreshold,
						lof: lofThreshold,
					},
				});
			}
			
			onScore(enriched, true);
		} catch (err: any) {
			console.error("Error during single record processing:", err);
			setError(`Failed to process record: ${err.response?.data?.detail || err.message}`);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={inputMode === "dataset" ? handleSubmit : handleSingleRecordSubmit} className="bg-white rounded-lg shadow p-6 border border-gray-200">
			{/* Toggle Button */}
			<div className="flex bg-gray-100 rounded-lg p-1 mb-4">
				<button
					type="button"
					onClick={() => setInputMode("dataset")}
					className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
						inputMode === "dataset"
							? "bg-blue-500 text-white"
							: "text-gray-600 hover:text-gray-900"
					}`}
				>
					Dataset Upload
				</button>
				<button
					type="button"
					onClick={() => setInputMode("single")}
					className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
						inputMode === "single"
							? "bg-blue-500 text-white"
							: "text-gray-600 hover:text-gray-900"
					}`}
				>
					Single Record
				</button>
			</div>

			{/* Model Selection Radio Buttons */}
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-2">Select Model:</label>
				<div className="flex gap-4">
					<label className="flex items-center cursor-pointer">
						<input
							type="radio"
							value="iforest"
							checked={selectedModel === "iforest"}
							onChange={(e) => setSelectedModel(e.target.value as ModelName)}
							className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
							aria-label="Isolation Forest model"
						/>
						<span className="text-sm text-gray-700">Isolation Forest (IF)</span>
					</label>
					<label className="flex items-center cursor-pointer">
						<input
							type="radio"
							value="lof"
							checked={selectedModel === "lof"}
							onChange={(e) => setSelectedModel(e.target.value as ModelName)}
							className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
							aria-label="Local Outlier Factor model"
						/>
						<span className="text-sm text-gray-700">Local Outlier Factor (LOF)</span>
					</label>
					<label className="flex items-center cursor-pointer">
						<input
							type="radio"
							value="both"
							checked={selectedModel === "both"}
							onChange={(e) => setSelectedModel(e.target.value as ModelName)}
							className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
							aria-label="Both models (ensemble)"
						/>
						<span className="text-sm text-gray-700">Both Models (Ensemble)</span>
					</label>
				</div>
			</div>

			{inputMode === "dataset" ? (
				<>
					<h3 className="text-lg font-semibold text-gray-800 mb-2">Upload Dataset</h3>
					<p className="text-sm text-gray-600 mb-4">Choose a .csv or an .xlsx file</p>

					<div className="flex flex-col items-center gap-4">
						<input
							id="hidden-file-input"
							type="file"
							accept=".csv,.xlsx"
							onChange={handleFileChange}
							className="hidden"
							aria-label="Upload CSV or XLSX file"
						/>
						<button
							type="button"
							className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg border border-blue-300 transition-colors duration-200"
							onClick={() => document.getElementById('hidden-file-input')?.click()}
						>
							{file ? "🔁 Change File" : "⬇️ Upload File"}
						</button>
						{file && <p className="text-sm text-gray-600">Selected: {file.name}</p>}
					</div>
				</>
			) : (
				<>
					<h3 className="text-lg font-semibold text-gray-800 mb-2">Single Record Input</h3>
					<div className="space-y-2 max-h-64 overflow-y-auto">
						<div className="grid grid-cols-2 gap-2">
							<input
								type="text"
								placeholder="Interaction ID"
								value={singleRecord.interaction_id}
								onChange={(e) => handleSingleRecordChange('interaction_id', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<input
								type="number"
								placeholder="CSAT (1-5)"
								value={singleRecord.csat}
								onChange={(e) => handleSingleRecordChange('csat', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="number"
								placeholder="IES (0-100)"
								value={singleRecord.ies}
								onChange={(e) => handleSingleRecordChange('ies', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<input
								type="number"
								placeholder="Complaints"
								value={singleRecord.complaints}
								onChange={(e) => handleSingleRecordChange('complaints', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="number"
								placeholder="AHT (seconds)"
								value={singleRecord.aht_seconds}
								onChange={(e) => handleSingleRecordChange('aht_seconds', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<input
								type="number"
								placeholder="Transfers"
								value={singleRecord.transfers}
								onChange={(e) => handleSingleRecordChange('transfers', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<input
								type="number"
								placeholder="Hold Time (seconds)"
								value={singleRecord.hold_time_seconds}
								onChange={(e) => handleSingleRecordChange('hold_time_seconds', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<select
								value={singleRecord.channel}
								onChange={(e) => handleSingleRecordChange('channel', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Select channel"
							>
								<option value="">Select Channel</option>
								<option value="voice">Voice</option>
								<option value="email">Email</option>
								<option value="chat">Chat</option>
							</select>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<select
								value={singleRecord.language}
								onChange={(e) => handleSingleRecordChange('language', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Select channel"
							>
								<option value="">Select Language</option>
								<option value="en">English</option>
								<option value="es">Spanish</option>
								<option value="de">German</option>
								<option value="fr">French</option>
							</select>
							<select
								value={singleRecord.queue}
								onChange={(e) => handleSingleRecordChange('queue', e.target.value)}
								className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
								aria-label="Select channel"
							>
								<option value="">Select Queue</option>
								<option value="billing">Billing</option>
								<option value="support">Support</option>
								<option value="sales">Sales</option>
							</select>
						</div>
					</div>
				</>
			)}

			{error && <div className="text-red-500 text-sm mt-3">{error}</div>}

			<button
				type="submit"
				className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
				disabled={loading}
			>
				{loading ? "Processing..." : "Submit"}
			</button>
		</form>
	);
}
