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
    label: 'Roubo',
    icon: 'shield-alert',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Furto, assalto ou roubo à mão armada',
    accessibilityLabel: 'Reportar um roubo ou furto',
  },
  {
    key: 'accident',
    label: 'Acidente',
    icon: 'car-crash',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Colisão ou acidente de viação',
    accessibilityLabel: 'Reportar um acidente de trânsito',
  },
  {
    key: 'suspicious',
    label: 'Suspeito',
    icon: 'eye-outline',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Pessoa ou atividade suspeita',
    accessibilityLabel: 'Reportar atividade suspeita na área',
  },
  {
    key: 'hazard',
    label: 'Perigo',
    icon: 'alert-outline',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Risco ambiental ou estrutural',
    accessibilityLabel: 'Reportar um risco ambiental',
  },
  {
    key: 'police',
    label: 'Polícia',
    icon: 'police-badge',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Presença ou operação policial',
    accessibilityLabel: 'Reportar presença policial',
  },
  {
    key: 'fire',
    label: 'Incêndio',
    icon: 'fire',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Incêndio ou fumo avistado',
    accessibilityLabel: 'Reportar um incêndio',
  },
  {
    key: 'medical',
    label: 'Médico',
    icon: 'medical-bag',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Emergência médica nas proximidades',
    accessibilityLabel: 'Reportar uma emergência médica',
  },
  {
    key: 'traffic',
    label: 'Trânsito',
    icon: 'traffic-light',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Trânsito intenso ou problema rodoviário',
    accessibilityLabel: 'Reportar um problema de trânsito',
  },
  {
    key: 'noise',
    label: 'Ruído',
    icon: 'volume-high',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Perturbação sonora',
    accessibilityLabel: 'Reportar uma perturbação sonora',
  },
  {
    key: 'flood',
    label: 'Inundação',
    icon: 'waves',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Inundação, subida de águas ou cheia',
    accessibilityLabel: 'Reportar uma inundação na área',
  },
  {
    key: 'injured_animal',
    label: 'Animal Ferido',
    icon: 'paw',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Animal ferido, preso ou doente que precisa de ajuda',
    accessibilityLabel: 'Reportar um animal ferido',
  },
  {
    key: 'building_risk',
    label: 'Edifício em Risco',
    icon: 'office-building-cog',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Edifício em risco de colapso ou dano estrutural',
    accessibilityLabel: 'Reportar um edifício em risco',
  },
  {
    key: 'other',
    label: 'Outro',
    icon: 'dots-horizontal-circle',
    iconFamily: 'MaterialCommunityIcons',
    description: 'Outro tipo de incidente',
    accessibilityLabel: 'Reportar outro tipo de incidente',
  },
];

export function getCategoryMeta(key: IncidentCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[CATEGORIES.length - 1];
}
