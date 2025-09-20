// ============================================================================
// APPLICATION CONFIGURATION
// Central configuration file to eliminate hardcoded values throughout the app
// ============================================================================

export interface ProjectConfig {
  cacn: string;
  relatedSystems: string;
  relatedBuildings: string;
  relatedEquipment: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  projectType: string;
}

export interface FormConfig {
  formNumber: string;
  formRevision: string;
  formTitle: string;
  pageCount: number;
  preparedFor: string;
  preparedBy: string;
  contractorInfo: string;
  contractNumber: string;
  formReference: string;
  disclaimer: string;
}

export interface AppConfig {
  // Form Configuration
  defaultForm: FormConfig;
  
  // Project Type Mappings
  projectMappings: {
    [key: string]: ProjectConfig;
  };
  
  // System Classifications
  systemTypes: {
    safety: string[];
    operational: string[];
    support: string[];
  };
  
  // Animation and UI Settings
  ui: {
    animationDuration: number;
    spacshipAnimationDuration: number;
    messageDelay: number;
    maxConsoleLogLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  };
  
  // Document Settings
  document: {
    maxFileSize: number; // in bytes
    allowedFileTypes: string[];
    defaultFacility: string;
    defaultPreparer: string;
  };
  
  // Date and Time Formatting
  dateFormat: {
    display: string;
    storage: string;
    timeFormat: '12h' | '24h';
  };
}

// Default configuration - can be overridden by environment variables or user settings
export const defaultConfig: AppConfig = {
  defaultForm: {
    formNumber: 'MT-50231',
    formRevision: 'Rev.00',
    formTitle: 'MODIFICATION TRAVELER',
    pageCount: 2,
    preparedFor: 'U.S. Department of Energy, Assistant Secretary for Environmental Management',
    preparedBy: 'Washington River Protection Solutions, LLC., PO Box 850, Richland, WA 99352',
    contractorInfo: 'Contractor For U.S. Department of Energy, Office of River Protection',
    contractNumber: 'Contract DE-AC27-08RV14800',
    formReference: 'SPF-015 (Rev.B1)',
    disclaimer: 'Reference herein to any specific commercial product, process, or service by trade name, trademark, manufacturer, or otherwise, does not necessarily constitute or imply its endorsement, recommendation, or favoring by the United States Government or any agency thereof or its contractors or subcontractors. Printed in the United States of America.'
  },
  
  projectMappings: {
    'emergency_diesel_generator': {
      cacn: 'EDG-CTRL-2025',
      relatedSystems: 'Emergency Diesel Generator System',
      relatedBuildings: 'Emergency Power Building',
      relatedEquipment: 'Emergency Diesel Generator, Control Panels, Cable Runs',
      priority: 'High',
      projectType: 'Safety System Upgrade'
    },
    'reactor_coolant_pump': {
      cacn: 'RCS-VALVE-2025',
      relatedSystems: 'Chemical Volume Control System (CVCS), Reactor Coolant System (RCS)',
      relatedBuildings: 'Reactor Building, Auxiliary Building',
      relatedEquipment: 'Reactor Coolant Pump, Flow Control Valve FCV-001, CVCS Components',
      priority: 'High',
      projectType: 'Safety System Component Replacement'
    },
    'emergency_core_cooling': {
      cacn: 'ECCS-MOTOR-2025',
      relatedSystems: 'Emergency Core Cooling System (ECCS)',
      relatedBuildings: 'Reactor Building, Auxiliary Building',
      relatedEquipment: 'ECCS Motors, Pumps, Valves',
      priority: 'High',
      projectType: 'Safety System Component Replacement'
    },
    'reactor_coolant_system_safety': {
      cacn: 'RCS-SAFETY-2025',
      relatedSystems: 'Reactor Coolant System (RCS), Plant Protection System',
      relatedBuildings: 'Reactor Building',
      relatedEquipment: 'Safety-Critical Valve, Associated Piping, Control Systems',
      priority: 'High',
      projectType: 'Safety System Component Replacement'
    },
    'ax_retrieval_project': {
      cacn: '202991',
      relatedSystems: 'Waste Retrieval System',
      relatedBuildings: 'Tank Farm, Processing Facility',
      relatedEquipment: 'Chemical Addition Manifold, Retrieval Equipment',
      priority: 'High',
      projectType: 'Retrieval'
    },
    'default': {
      cacn: 'TBD-2025',
      relatedSystems: 'To Be Determined During Engineering Review',
      relatedBuildings: 'To Be Determined During Site Survey',
      relatedEquipment: 'To Be Determined During Component Analysis',
      priority: 'Medium',
      projectType: 'Component Modification'
    }
  },
  
  systemTypes: {
    safety: [
      'Emergency Diesel Generator System',
      'Emergency Core Cooling System (ECCS)',
      'Reactor Coolant System (RCS)',
      'Plant Protection System',
      'Chemical Volume Control System (CVCS)'
    ],
    operational: [
      'Waste Retrieval System',
      'Process Control System',
      'Ventilation System',
      'Electrical Distribution System'
    ],
    support: [
      'Fire Protection System',
      'Communication System',
      'Lighting System',
      'Maintenance System'
    ]
  },
  
  ui: {
    animationDuration: 2500,
    spacshipAnimationDuration: 3500,
    messageDelay: 500,
    maxConsoleLogLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
  },
  
  document: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    defaultFacility: 'Hanford Site',
    defaultPreparer: 'Engineering Team'
  },
  
  dateFormat: {
    display: 'MM/DD/YYYY',
    storage: 'YYYY-MM-DD',
    timeFormat: '12h'
  }
};

// Project detection utility
export function detectProjectType(message: string): ProjectConfig {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('emergency diesel generator') || messageLower.includes('edg')) {
    return defaultConfig.projectMappings.emergency_diesel_generator;
  } else if (messageLower.includes('reactor coolant pump') || messageLower.includes('rcp') || 
             messageLower.includes('seal injection') || messageLower.includes('fcv-')) {
    return defaultConfig.projectMappings.reactor_coolant_pump;
  } else if (messageLower.includes('emergency core cooling') || messageLower.includes('eccs')) {
    return defaultConfig.projectMappings.emergency_core_cooling;
  } else if (messageLower.includes('reactor coolant system') || 
             (messageLower.includes('valve') && messageLower.includes('safety-critical'))) {
    return defaultConfig.projectMappings.reactor_coolant_system_safety;
  } else if (messageLower.includes('a/ax retrieval') || messageLower.includes('chemical addition manifold')) {
    return defaultConfig.projectMappings.ax_retrieval_project;
  }
  
  return defaultConfig.projectMappings.default;
}

// Logging utility to respect configuration
export function configuredLog(level: 'error' | 'warn' | 'info' | 'debug', message: string, ...args: any[]) {
  const maxLevel = defaultConfig.ui.maxConsoleLogLevel;
  
  if (maxLevel === 'none') return;
  
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const maxLevelNum = levels[maxLevel] || 0;
  const currentLevelNum = levels[level] || 0;
  
  if (currentLevelNum <= maxLevelNum) {
    console[level](message, ...args);
  }
}

// Generate CACN based on project type and year
export function generateCACN(projectType: string, year?: number): string {
  const currentYear = year || new Date().getFullYear();
  
  // Check for known project types first
  for (const [key, config] of Object.entries(defaultConfig.projectMappings)) {
    if (projectType.toLowerCase().includes(key.replace(/_/g, ' ')) || 
        config.projectType.toLowerCase().includes(projectType.toLowerCase())) {
      return config.cacn;
    }
  }
  
  // Generate a new CACN
  return `${currentYear}-MT-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

export { defaultConfig as appConfig };