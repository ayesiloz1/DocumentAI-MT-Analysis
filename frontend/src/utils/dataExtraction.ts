// ============================================================================
// HELPER FUNCTIONS FOR INTELLIGENT DATA EXTRACTION
// These functions parse user messages and AI responses to extract meaningful information
// for pre-filling MT document fields automatically
// ============================================================================

/**
 * Extracts modification title from user message and AI response
 * Uses pattern matching to identify common modification types
 * @param userMessage - The user's input message
 * @param aiResponse - The AI's response message
 * @returns Extracted title or default based on content analysis
 */
export function extractModificationTitle(userMessage: string, aiResponse: string): string {
  // Convert to lowercase for easier pattern matching
  const message = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();
  const fullText = (userMessage + ' ' + aiResponse).toLowerCase();
  
  // ============================================================================
  // PATTERN MATCHING FOR SPECIFIC EQUIPMENT TYPES
  // These patterns identify common nuclear plant equipment modifications
  // ============================================================================
  
  // Enhanced RCP (Reactor Coolant Pump) valve extraction with specific valve IDs
  if (message.includes('reactor coolant pump') || message.includes('rcp')) {
    if (message.includes('seal injection') || message.includes('flow control valve')) {
      // Look for specific valve ID using regex pattern
      const valveMatch = fullText.match(/fcv[-_]?(\d+[a-z]?)/i);
      if (valveMatch) {
        const valveId = valveMatch[0].toUpperCase(); // Convert to standard format
        if (fullText.includes('digital') || fullText.includes('smart valve')) {
          return `RCP Seal Injection Flow Control Valve ${valveId} Digital Replacement`;
        }
        return `RCP Seal Injection Flow Control Valve ${valveId} Modification`;
      }
      return 'RCP Seal Injection Flow Control System Modification';
    }
    return 'Reactor Coolant Pump System Modification';
  }
  
  // Enhanced pump pattern recognition with pump IDs
  if (message.includes('pump')) {
    const pumpMatch = fullText.match(/(pump\s+)([a-z]+\d+|p[-_]?\d+[a-z]?)/i);
    if (pumpMatch) {
      const pumpId = pumpMatch[2].toUpperCase();
      if (message.includes('replacement') || response.includes('replace')) {
        return `Pump ${pumpId} Replacement`;
      }
      if (message.includes('upgrade') || message.includes('digital')) {
        return `Pump ${pumpId} Digital Upgrade`;
      }
      return `Pump ${pumpId} Modification`;
    }
    
    // Generic pump modifications
    if (message.includes('centrifugal')) return 'Centrifugal Pump System Modification';
    if (message.includes('service water')) return 'Service Water Pump Modification';
    if (message.includes('component cooling')) return 'Component Cooling Water Pump Modification';
    return 'Pump System Modification';
  }
  
  // Motor and electrical equipment
  if (message.includes('motor')) {
    if (message.includes('480v') || message.includes('4160v')) {
      const voltageMatch = fullText.match(/(\d+)v/i);
      const voltage = voltageMatch ? voltageMatch[1] : 'unknown';
      return `${voltage}V Motor Replacement`;
    }
    return 'Motor Replacement';
  }
  
  // Valve modifications with enhanced ID detection
  if (message.includes('valve')) {
    // Look for valve ID patterns (MOV, AOV, HCV, etc.)
    const valveIdMatch = fullText.match(/([a-z]{2,4}[-_]?\d+[a-z]?)/i);
    if (valveIdMatch) {
      const valveId = valveIdMatch[1].toUpperCase();
      if (message.includes('motor operated') || valveId.startsWith('MOV')) {
        return `Motor Operated Valve ${valveId} Modification`;
      }
      if (message.includes('air operated') || valveId.startsWith('AOV')) {
        return `Air Operated Valve ${valveId} Modification`;
      }
      if (message.includes('hydraulic') || valveId.startsWith('HCV')) {
        return `Hydraulic Control Valve ${valveId} Modification`;
      }
      return `Valve ${valveId} Modification`;
    }
    
    // Generic valve modifications
    if (message.includes('safety relief')) return 'Safety Relief Valve Modification';
    if (message.includes('check valve')) return 'Check Valve Replacement';
    if (message.includes('isolation')) return 'Isolation Valve Modification';
    return 'Valve Modification';
  }
  
  // Enhanced instrumentation and control patterns
  if (message.includes('instrument') || message.includes('sensor') || message.includes('transmitter')) {
    // Look for tag numbers (common format: PT-1234, TE-5678, etc.)
    const tagMatch = fullText.match(/([a-z]{2}[-_]?\d+[a-z]?)/i);
    if (tagMatch) {
      const tagId = tagMatch[1].toUpperCase();
      if (message.includes('pressure') || tagId.startsWith('PT')) {
        return `Pressure Transmitter ${tagId} Replacement`;
      }
      if (message.includes('temperature') || tagId.startsWith('TE') || tagId.startsWith('TT')) {
        return `Temperature Element ${tagId} Replacement`;
      }
      if (message.includes('level') || tagId.startsWith('LT') || tagId.startsWith('LE')) {
        return `Level Transmitter ${tagId} Replacement`;
      }
      if (message.includes('flow') || tagId.startsWith('FT') || tagId.startsWith('FE')) {
        return `Flow Transmitter ${tagId} Replacement`;
      }
      return `Instrument ${tagId} Replacement`;
    }
    
    // Generic instrumentation
    if (message.includes('pressure')) return 'Pressure Instrumentation Modification';
    if (message.includes('temperature')) return 'Temperature Instrumentation Modification';
    if (message.includes('level')) return 'Level Instrumentation Modification';
    if (message.includes('flow')) return 'Flow Instrumentation Modification';
    return 'Instrumentation Modification';
  }
  
  // System-level modifications
  if (message.includes('system')) {
    if (message.includes('hvac')) return 'HVAC System Modification';
    if (message.includes('electrical')) return 'Electrical System Modification';
    if (message.includes('piping')) return 'Piping System Modification';
    if (message.includes('fire protection')) return 'Fire Protection System Modification';
    return 'System Modification';
  }
  
  // Cable and electrical
  if (message.includes('cable')) {
    if (message.includes('replacement')) return 'Cable Replacement';
    if (message.includes('routing')) return 'Cable Routing Modification';
    return 'Cable Modification';
  }
  
  // Default fallback with some intelligence
  if (message.includes('replacement')) return 'Equipment Replacement';
  if (message.includes('upgrade')) return 'Equipment Upgrade';
  if (message.includes('modification')) return 'Equipment Modification';
  if (message.includes('installation')) return 'Equipment Installation';
  
  return 'Plant Modification'; // Ultimate fallback
}

/**
 * Extracts project number from user message and AI response
 * Looks for common project number patterns used in nuclear facilities
 */
export function extractProjectNumber(userMessage: string, aiResponse: string): string {
  const fullText = userMessage + ' ' + aiResponse;
  
  // Common project number patterns:
  // MT-YYYY-### (Modification Traveler format)
  const mtPattern = fullText.match(/MT[-_]?(\d{4})[-_]?(\d{3,4})/i);
  if (mtPattern) {
    return `MT-${mtPattern[1]}-${mtPattern[2]}`;
  }
  
  // ECR-##### (Engineering Change Request)
  const ecrPattern = fullText.match(/ECR[-_]?(\d{4,6})/i);
  if (ecrPattern) {
    return `ECR-${ecrPattern[1]}`;
  }
  
  // WO-##### (Work Order)
  const woPattern = fullText.match(/WO[-_]?(\d{4,8})/i);
  if (woPattern) {
    return `WO-${woPattern[1]}`;
  }
  
  // DCR-##### (Design Change Request)
  const dcrPattern = fullText.match(/DCR[-_]?(\d{4,6})/i);
  if (dcrPattern) {
    return `DCR-${dcrPattern[1]}`;
  }
  
  // Generic numeric patterns (4-8 digits)
  const numericPattern = fullText.match(/\b(\d{4,8})\b/);
  if (numericPattern) {
    return `MT-${new Date().getFullYear()}-${numericPattern[1]}`;
  }
  
  // Generate based on current date if no pattern found
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  
  return `MT-${year}-${month}${day}${time}`;
}