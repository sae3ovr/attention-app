import type { IncidentCategory } from '../types';

interface CategoryMeta {
  key: IncidentCategory;
  label: string;
  icon: string;
  iconFamily: 'MaterialCommunityIcons' | 'Ionicons' | 'FontAwesome5';
  description: string;
  accessibilityLabel: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key: 'robbery',
    label: 'Robbery',
    icon: 'shield-alert',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Theft, mugging, or armed robbery',
    accessibilityLabel: 'Report a robbery or theft incident',
  },
  {
    key: 'accident',
    label: 'Accident',
    icon: 'car-crash',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Vehicle collision or accident',
    accessibilityLabel: 'Report a traffic accident',
  },
  {
    key: 'suspicious',
    label: 'Suspicious',
    icon: 'eye-outline',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Suspicious person or activity',
    accessibilityLabel: 'Report suspicious activity in the area',
  },
  {
    key: 'hazard',
    label: 'Hazard',
    icon: 'alert-outline',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Environmental or structural hazard',
    accessibilityLabel: 'Report an environmental hazard',
  },
  {
    key: 'police',
    label: 'Police',
    icon: 'police-badge',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Police presence or operation',
    accessibilityLabel: 'Report police presence or activity',
  },
  {
    key: 'fire',
    label: 'Fire',
    icon: 'fire',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Fire or smoke spotted',
    accessibilityLabel: 'Report a fire or smoke',
  },
  {
    key: 'medical',
    label: 'Medical',
    icon: 'medical-bag',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Medical emergency nearby',
    accessibilityLabel: 'Report a medical emergency',
  },
  {
    key: 'traffic',
    label: 'Traffic',
    icon: 'traffic-light',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Heavy traffic or road issue',
    accessibilityLabel: 'Report a traffic problem',
  },
  {
    key: 'noise',
    label: 'Noise',
    icon: 'volume-high',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Noise disturbance',
    accessibilityLabel: 'Report a noise disturbance',
  },
  {
    key: 'other',
    label: 'Other',
    icon: 'dots-horizontal-circle',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Other type of incident',
    accessibilityLabel: 'Report another type of incident',
  },
];

export function getCategoryMeta(key: IncidentCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}
