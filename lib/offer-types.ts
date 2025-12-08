/**
 * Offer Types
 * Centraliserade TypeScript-typer för offertverktyget
 */

export type RowType = 'work' | 'material' | 'option' | 'risk';
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Material Specification - För bättre material beskrivningar
 */
export interface MaterialSpec {
  category?: string;      // T.ex. "Takvirke", "Puts", "Isolering"
  type?: string;          // T.ex. "C24", "Kulörtputsad", "Mineralull"
  dimension?: string;     // T.ex. "45x195mm", "15kg/säck", "50mm tjocklek"
  length?: string;        // T.ex. "4800mm", "6m"
  supplier?: string;      // T.ex. "Beijer", "K-rauta", "Woody bygghandel"
  articleNumber?: string; // Artikel/produktnummer om känt
}

/**
 * OfferRow - En rad i offerten
 */
export interface OfferRow {
  id: string;
  title: string;
  type: RowType;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  hourlyRate?: number;
  estimatedHours?: number;
  materialSpec?: MaterialSpec;
  supplier?: string;
  articleNumber?: string;
  riskLevel?: RiskLevel;
  riskDescription?: string;
  notes?: string;
}

/**
 * AI Generation Result
 */
export interface AIGenerationResult {
  rows: OfferRow[];
  projectType: string;
  estimatedDuration: string;
  assumptions: string[];
  recommendations?: string[];
  totalCost?: number;
  mode?: 'full' | 'quick' | 'incremental';
}
