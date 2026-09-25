export type StorageRequirements = {
  laboratoryId: number;

  weightG: number;
  volumeCm3: number;
  areaCm2: number;

  requiresColdStorage: boolean;
  requiresLightProtection: boolean;
  isHazardous: boolean;

  /**
   * Al editar una muestra existente, permite excluirla
   * del cálculo de ocupación de su ubicación actual.
   */
  excludeSampleId?: number;
};

export type StorageRecommendation = {
  storageLocation: {
    id: number;
    laboratoryId: number;
    code: string;
    name: string;
    type: string;
    description: string | null;

    maxWeightG: number | null;
    maxVolumeCm3: number | null;
    maxAreaCm2: number | null;

    supportsColdStorage: boolean;
    supportsLightProtection: boolean;
    supportsHazardous: boolean;
  };

  score: number;

  availableWeightG: number | null;
  availableVolumeCm3: number | null;
  availableAreaCm2: number | null;

  reasons: string[];
};