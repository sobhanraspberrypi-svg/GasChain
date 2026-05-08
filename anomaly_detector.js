/**
 * GasChain — Fraud & Anomaly Detection Service
 * 
 * Detects hoarding, duplicate connections, commercial diversion,
 * and quota breaches in real time at the point of dispensing.
 * 
 * Anomaly score: 0.0 = clean, >1.0 = review, >1.5 = critical alert
 */

class AnomalyDetector {
  constructor() {
    this.THRESHOLDS = {
      ANOMALY_REVIEW:   1.0,
      ANOMALY_CRITICAL: 1.5,
      DISPENSE_RATE_SIGMA: 2.0,   // standard deviations above baseline
      AADHAR_SCAN_MIN_PCT: 0.85,  // 85% minimum scan compliance
      TIME_WINDOW_HOURS: 2,
      MAX_CYLINDERS_PER_WINDOW: 30,
    };
  }

  /**
   * Main entry point — called before every cylinder is dispensed
   * Returns: { approved: bool, anomaly_score: float, flags: string[], block_reason: string|null }
   */
  async checkTransaction({ consumer, agency, cylinder, transaction }) {
    const checks = await Promise.all([
      this.checkQuotaBreach(consumer, transaction),
      this.checkDuplicateAadhar(consumer),
      this.checkAgencyDispenseRate(agency),
      this.checkAadharScanCompliance(agency),
      this.checkCommercialDiversion(consumer, transaction),
      this.checkTimePattern(agency),
      this.checkCylinderJourney(cylinder),
    ]);

    const flags = checks
      .filter(c => c.flagged)
      .map(c => c.reason);

    const anomaly_score = checks.reduce((sum, c) => sum + c.score, 0);
    const blocked = checks.some(c => c.block === true);
    const block_reason = blocked
      ? checks.find(c => c.block).reason
      : null;

    return {
      approved: !blocked,
      anomaly_score: +anomaly_score.toFixed(3),
      flags,
      block_reason,
      severity: this._scoreSeverity(anomaly_score),
    };
  }

  /** Blocks if consumer has used full monthly quota */
  async checkQuotaBreach(consumer, transaction) {
    const monthlyUsage = await this._getMonthlyUsage(consumer.id);
    if (monthlyUsage >= consumer.monthly_quota) {
      return {
        flagged: true, block: true, score: 2.0,
        reason: `QUOTA_BREACH: Consumer has used ${monthlyUsage}/${consumer.monthly_quota} cylinders this month`,
      };
    }
    return { flagged: false, block: false, score: 0 };
  }

  /** Detects if same Aadhar token is linked to multiple active connections */
  async checkDuplicateAadhar(consumer) {
    const activeConnections = await this._getActiveConnections(consumer.aadhar_token);
    if (activeConnections > 1) {
      return {
        flagged: true, block: true, score: 1.8,
        reason: `DUPLICATE_AADHAR: ${activeConnections} active connections found for same Aadhar token`,
      };
    }
    return { flagged: false, block: false, score: 0 };
  }

  /** Flags if agency dispense rate is 2σ above their own baseline */
  async checkAgencyDispenseRate(agency) {
    const { current_rate, baseline, std_dev } = await this._getAgencyDispenseRate(agency.id);
    const z_score = std_dev > 0 ? (current_rate - baseline) / std_dev : 0;

    if (z_score > this.THRESHOLDS.DISPENSE_RATE_SIGMA) {
      const score = Math.min(2.0, z_score * 0.4);
      return {
        flagged: true,
        block: z_score > 4.0,  // block only at extreme rates
        score,
        reason: `EXCESS_DISPENSE: ${current_rate} cyl/hr vs baseline ${baseline.toFixed(1)} (z=${z_score.toFixed(2)})`,
      };
    }
    return { flagged: false, block: false, score: Math.max(0, z_score * 0.1) };
  }

  /** Detects if agency is dispensing without proper Aadhar scans */
  async checkAadharScanCompliance(agency) {
    const scan_rate = await this._getAadharScanRate(agency.id);
    if (scan_rate < this.THRESHOLDS.AADHAR_SCAN_MIN_PCT) {
      const score = (this.THRESHOLDS.AADHAR_SCAN_MIN_PCT - scan_rate) * 3;
      return {
        flagged: true,
        block: scan_rate < 0.5,  // block if less than 50% compliance
        score,
        reason: `LOW_AADHAR_COMPLIANCE: ${(scan_rate * 100).toFixed(1)}% vs required 85%`,
      };
    }
    return { flagged: false, block: false, score: 0 };
  }

  /**
   * Detects commercial diversion:
   * Domestic cylinder (₹903) being delivered to commercial address
   */
  async checkCommercialDiversion(consumer, transaction) {
    if (consumer.category === 'GENERAL' && transaction.delivery_address_type === 'COMMERCIAL') {
      return {
        flagged: true, block: false, score: 0.9,
        reason: `COMMERCIAL_DIVERSION: Domestic consumer receiving cylinder at commercial address`,
      };
    }
    // Also check if delivery location is far from registered address
    const distance = this._haversineKm(
      consumer.lat, consumer.lng,
      transaction.delivery_lat, transaction.delivery_lng
    );
    if (distance > 5) {
      return {
        flagged: true, block: false, score: 0.5,
        reason: `ADDRESS_MISMATCH: Delivery ${distance.toFixed(1)}km from registered address`,
      };
    }
    return { flagged: false, block: false, score: 0 };
  }

  /** Detects unusual time patterns — bulk dispensing late at night */
  async checkTimePattern(agency) {
    const hour = new Date().getHours();
    const recentCount = await this._getRecentDispenseCount(
      agency.id,
      this.THRESHOLDS.TIME_WINDOW_HOURS
    );

    // Late night bulk dispensing is a red flag
    if ((hour < 6 || hour > 22) && recentCount > 10) {
      return {
        flagged: true, block: false, score: 0.8,
        reason: `TIME_ANOMALY: ${recentCount} cylinders dispensed outside business hours`,
      };
    }
    if (recentCount > this.THRESHOLDS.MAX_CYLINDERS_PER_WINDOW) {
      return {
        flagged: true, block: false, score: 0.7,
        reason: `BURST_DISPENSE: ${recentCount} cylinders in ${this.THRESHOLDS.TIME_WINDOW_HOURS}hr window`,
      };
    }
    return { flagged: false, block: false, score: 0 };
  }

  /**
   * Tracks cylinder journey — flags if same cylinder appears at
   * multiple agencies in short time (impossible physically)
   */
  async checkCylinderJourney(cylinder) {
    const journey = await this._getCylinderJourney(cylinder.id, 24);  // last 24 hrs
    if (journey.locations.length > 2) {
      return {
        flagged: true, block: true, score: 2.0,
        reason: `CYLINDER_GHOST: Cylinder appeared at ${journey.locations.length} locations in 24hrs`,
      };
    }
    return { flagged: false, block: false, score: 0 };
  }

  // ── HELPERS ─────────────────────────────────────────────

  _scoreSeverity(score) {
    if (score >= this.THRESHOLDS.ANOMALY_CRITICAL) return 'CRITICAL';
    if (score >= this.THRESHOLDS.ANOMALY_REVIEW) return 'HIGH';
    if (score >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  _haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // DB stubs — replace with actual DB queries
  async _getMonthlyUsage(consumerId) { return Math.floor(Math.random() * 3); }
  async _getActiveConnections(aadharToken) { return Math.random() < 0.05 ? 2 : 1; }
  async _getAgencyDispenseRate(agencyId) {
    return { current_rate: 8 + Math.random() * 12, baseline: 9.2, std_dev: 2.1 };
  }
  async _getAadharScanRate(agencyId) { return 0.85 + Math.random() * 0.15; }
  async _getRecentDispenseCount(agencyId, hours) { return Math.floor(Math.random() * 20); }
  async _getCylinderJourney(cylinderId, hours) {
    return { locations: [{ agency: 'A1', time: new Date() }] };
  }
}

// ── DEMO RUN ──────────────────────────────────────────────

async function runDemo() {
  const detector = new AnomalyDetector();

  const testCases = [
    {
      label: "Normal transaction — Jayanagar household",
      consumer: { id: 'c1', aadhar_token: 'tok_abc123', monthly_quota: 2, category: 'GENERAL', lat: 12.9299, lng: 77.5847 },
      agency: { id: 'a1' },
      cylinder: { id: 'cyl1' },
      transaction: { delivery_address_type: 'RESIDENTIAL', delivery_lat: 12.9301, delivery_lng: 77.5850 },
    },
    {
      label: "Suspected hoarding — City Gas Shoppe RT Nagar",
      consumer: { id: 'c2', aadhar_token: 'tok_xyz789', monthly_quota: 2, category: 'GENERAL', lat: 13.0213, lng: 77.5925 },
      agency: { id: 'a5', _override: { rate: 28, baseline: 9.2, std_dev: 2.1 } },
      cylinder: { id: 'cyl2' },
      transaction: { delivery_address_type: 'RESIDENTIAL', delivery_lat: 13.0213, delivery_lng: 77.5925 },
    },
    {
      label: "Commercial diversion attempt",
      consumer: { id: 'c3', aadhar_token: 'tok_def456', monthly_quota: 2, category: 'GENERAL', lat: 12.9767, lng: 77.5713 },
      agency: { id: 'a3' },
      cylinder: { id: 'cyl3' },
      transaction: { delivery_address_type: 'COMMERCIAL', delivery_lat: 12.9770, delivery_lng: 77.5716 },
    },
  ];

  console.log("GasChain Anomaly Detection — Demo Run");
  console.log("======================================\n");

  for (const tc of testCases) {
    console.log(`📋 ${tc.label}`);
    const result = await detector.checkTransaction(tc);
    const icon = result.approved ? '✅' : '🚨';
    console.log(`   ${icon} Decision: ${result.approved ? 'APPROVED' : 'BLOCKED'}`);
    console.log(`   📊 Anomaly score: ${result.anomaly_score} (${result.severity})`);
    if (result.flags.length > 0) {
      console.log(`   ⚠️  Flags: ${result.flags.join(', ')}`);
    }
    if (result.block_reason) {
      console.log(`   ❌ Block reason: ${result.block_reason}`);
    }
    console.log();
  }
}

runDemo();
module.exports = { AnomalyDetector };
