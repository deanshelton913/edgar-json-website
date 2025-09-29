/**
 * LLM Recommendation Types
 * 
 * Defines the schema for LLM-generated buy/sell/hold recommendations
 * with confidence levels and market analysis.
 */

export interface LLMRecommendation {
  ticker: string;
  companyName: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  magnitude: number; // 0.0 to 1.0 - confidence level
  reasoning: string;
  keyEvents: string[];
  marketContext: string;
  riskFactors: string[];
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG'; // Expected holding period
  priceTarget?: number; // Optional price target
  stopLoss?: number; // Optional stop loss
}

export interface LLMBatchAnalysis {
  analysisId: string;
  timestamp: number;
  marketConditions: {
    overallSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    marketVolatility: 'LOW' | 'MEDIUM' | 'HIGH';
    sectorTrends: string[];
    keyEvents: string[];
  };
  recommendations: LLMRecommendation[];
  summary: string;
  confidence: number; // Overall confidence in the analysis (0.0 to 1.0)
}

export interface TickerSummary {
  ticker: string;
  companyName: string;
  cik: string;
  signals: {
    count: number;
    totalScore: number;
    averageScore: number;
    filingTypes: string[];
    reasons: string[];
    recentEvents: string[];
  };
  marketData: {
    currentPrice?: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
  };
  news: {
    headlines: string[];
    sentiment: number; // -1 to 1
    keyThemes: string[];
  };
  context: {
    sector: string;
    isMegaCap: boolean;
    isLargeCap: boolean;
    popularityScore: number;
  };
}

export interface BatchAnalysisRequest {
  tickerSummaries: TickerSummary[];
  marketContext: {
    currentDate: string;
    marketHours: boolean;
    recentNews: string[];
    sectorPerformance: Record<string, number>;
    marketIndices: {
      sp500?: number;
      nasdaq?: number;
      dow?: number;
    };
  };
  analysisInstructions: {
    focusAreas: string[];
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
    maxRecommendations: number;
  };
}

// Helper functions for recommendation interpretation
export class RecommendationInterpreter {
  static getMagnitudeDescription(magnitude: number): string {
    if (magnitude >= 0.9) return 'STRONG';
    if (magnitude >= 0.7) return 'MODERATE';
    if (magnitude >= 0.5) return 'WEAK';
    return 'VERY_WEAK';
  }

  static getActionUrgency(recommendation: LLMRecommendation): 'IMMEDIATE' | 'SOON' | 'MONITOR' {
    if (recommendation.magnitude >= 0.8) return 'IMMEDIATE';
    if (recommendation.magnitude >= 0.6) return 'SOON';
    return 'MONITOR';
  }

  static getRecommendationText(recommendation: LLMRecommendation): string {
    const magnitude = this.getMagnitudeDescription(recommendation.magnitude);
    return `${magnitude} ${recommendation.recommendation}`;
  }

  static shouldExecuteImmediately(recommendation: LLMRecommendation): boolean {
    return recommendation.magnitude >= 0.8 && 
           (recommendation.recommendation === 'BUY' || recommendation.recommendation === 'SELL');
  }
}
