/**
 * GasChain — Sample Data Seeder
 * Generates realistic synthetic data for Bengaluru pilot
 * Run: node scripts/seed.js
 */

const sampleAgencies = [
  { name: "Sri Venkatesh LPG", location: "Jayanagar", lat: 12.9299, lng: 77.5847, provider: "HPCL", monthly_quota: 650, anomaly_score: 0.08 },
  { name: "Bangalore Gas Agency", location: "Koramangala", lat: 12.9352, lng: 77.6245, provider: "BPCL", monthly_quota: 800, anomaly_score: 0.02 },
  { name: "Majestic Gas Point", location: "Chickpet", lat: 12.9767, lng: 77.5713, provider: "IOCL", monthly_quota: 420, anomaly_score: 0.71 },
  { name: "KR Puram Fuel Hub", location: "KR Puram", lat: 13.0089, lng: 77.6911, provider: "HPCL", monthly_quota: 380, anomaly_score: 0.09 },
  { name: "City Gas Shoppe", location: "RT Nagar", lat: 13.0213, lng: 77.5925, provider: "BPCL", monthly_quota: 510, anomaly_score: 1.94 },
  { name: "Whitefield LPG Centre", location: "Whitefield", lat: 12.9698, lng: 77.7500, provider: "IOCL", monthly_quota: 290, anomaly_score: 0.04 },
  { name: "HSR Layout Gas", location: "HSR Layout", lat: 12.9116, lng: 77.6446, provider: "HPCL", monthly_quota: 720, anomaly_score: 0.11 },
  { name: "Electronic City LPG", location: "Electronic City", lat: 12.8445, lng: 77.6613, provider: "BPCL", monthly_quota: 550, anomaly_score: 0.06 },
];

const sampleCBGProducers = [
  { name: "GreenGas CBG Unit", type: "AGRI_RESIDUE", location: "Anekal", daily_kg: 800, price_per_kg: 54, lat: 12.7101, lng: 77.6969 },
  { name: "Namma Biogas", type: "GOBAR_GAS", location: "Doddaballapur", daily_kg: 320, price_per_kg: 52, lat: 13.2946, lng: 77.5371 },
  { name: "BengaluruBio Plant", type: "MSW_PLANT", location: "Mandur", daily_kg: 1200, price_per_kg: 56, lat: 13.0432, lng: 77.7241 },
  { name: "Farmer's Gas Coop", type: "GOBAR_GAS", location: "Kanakapura", daily_kg: 240, price_per_kg: 50, lat: 12.5493, lng: 77.4150 },
  { name: "IndoGas CBG", type: "FOOD_WASTE", location: "Peenya", daily_kg: 650, price_per_kg: 55, lat: 13.0298, lng: 77.5170 },
];

const sampleSTPs = [
  { name: "Vrishabhavathi Valley STP", operator: "BWSSB", city: "Bengaluru", capacity_mld: 440, daily_cbg_kg: 4800, status: "AVAILABLE", lat: 12.9441, lng: 77.4938 },
  { name: "K&C Valley STP (Koramangala)", operator: "BWSSB", city: "Bengaluru", capacity_mld: 60, daily_cbg_kg: 650, status: "UNDER_NEGOTIATION", lat: 12.9212, lng: 77.6268 },
  { name: "Hebbal Valley STP", operator: "BWSSB", city: "Bengaluru", capacity_mld: 60, daily_cbg_kg: 650, status: "AVAILABLE", lat: 13.0358, lng: 77.5938 },
  { name: "Bellandur STP", operator: "BWSSB", city: "Bengaluru", capacity_mld: 50, daily_cbg_kg: 540, status: "AVAILABLE", lat: 12.9252, lng: 77.6828 },
];

const sampleAnomalies = [
  { agency: "City Gas Shoppe", type: "EXCESS_DISPENSE", severity: "CRITICAL", score: 1.94,
    description: "Dispensed 48 cylinders in 2 hours at RT Nagar. Aadhar scan compliance 34%. Pattern matches hoarding." },
  { agency: "Majestic Gas Point", type: "COMMERCIAL_DIVERSION", severity: "HIGH", score: 0.71,
    description: "3 domestic cylinders delivered to commercial address in Chickpet. Consumer IDs flagged residential." },
  { agency: "KR Puram Fuel Hub", type: "DUPLICATE_AADHAR", severity: "MEDIUM", score: 0.45,
    description: "Same Aadhar linked to 2 active connections. Second connection blocked. Flagged for UIDAI verification." },
];

// Demand snapshot — district level
const demandSnapshots = [
  { district: "Bengaluru Urban", state: "Karnataka", cylinders_lpg: 84200, cylinders_cbg: 3100, cbg_blend_pct: 3.55, demand_index: 92 },
  { district: "Bengaluru Rural", state: "Karnataka", cylinders_lpg: 12400, cylinders_cbg: 820, cbg_blend_pct: 6.20, demand_index: 38 },
  { district: "Mysuru", state: "Karnataka", cylinders_lpg: 24100, cylinders_cbg: 1200, cbg_blend_pct: 4.74, demand_index: 65 },
  { district: "Mangaluru", state: "Karnataka", cylinders_lpg: 18600, cylinders_cbg: 940, cbg_blend_pct: 4.81, demand_index: 58 },
  { district: "Hubballi", state: "Karnataka", cylinders_lpg: 15200, cylinders_cbg: 620, cbg_blend_pct: 3.92, demand_index: 47 },
];

// Platform revenue calculation helper
function calculatePlatformRevenue(cylinders, feePerCylinder = 10) {
  return {
    monthly_cylinders: cylinders,
    fee_per_cylinder: feePerCylinder,
    monthly_revenue: cylinders * feePerCylinder,
    annual_revenue: cylinders * feePerCylinder * 12,
  };
}

console.log("GasChain Sample Data Summary");
console.log("============================");
console.log(`Agencies: ${sampleAgencies.length}`);
console.log(`CBG Producers: ${sampleCBGProducers.length}`);
console.log(`STP Sources: ${sampleSTPs.length}`);
console.log(`Active Anomalies: ${sampleAnomalies.length}`);
console.log(`District snapshots: ${demandSnapshots.length}`);
console.log("");

const totalCylinders = sampleAgencies.reduce((a, b) => a + b.monthly_quota, 0);
const revenue = calculatePlatformRevenue(totalCylinders);
console.log(`Pilot monthly cylinders: ${totalCylinders}`);
console.log(`Pilot monthly platform fee: ₹${revenue.monthly_revenue.toLocaleString('en-IN')}`);
console.log(`Pilot annual run-rate: ₹${revenue.annual_revenue.toLocaleString('en-IN')}`);

const totalSTPCapacity = sampleSTPs.reduce((a, b) => a + b.daily_cbg_kg, 0);
const stpMonthlyCylinders = Math.floor((totalSTPCapacity * 30) / 19);
console.log("");
console.log(`Bengaluru STP CBG potential: ${totalSTPCapacity} kg/day`);
console.log(`Monthly commercial cylinders from STPs: ${stpMonthlyCylinders.toLocaleString('en-IN')}`);
console.log(`Revenue at ₹2,000/cylinder: ₹${(stpMonthlyCylinders * 2000).toLocaleString('en-IN')}/month`);

module.exports = { sampleAgencies, sampleCBGProducers, sampleSTPs, sampleAnomalies, demandSnapshots };
