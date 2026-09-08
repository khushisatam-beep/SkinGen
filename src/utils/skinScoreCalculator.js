// ============================================================================
// Skin Health Score & Dermatology Recommendation Engine
// Computes clinical metrics from Age, Skin Type, Water Intake, & Sun Exposure
// ============================================================================

export function calculateSkinScore({ skinType, age, waterIntake, sunExposure }) {
  let score = 88; // Starting baseline

  // 1. Skin Type baseline impact
  switch (skinType) {
    case 'Normal':
      score += 4;
      break;
    case 'Combination':
      score -= 6;
      break;
    case 'Oily':
      score -= 9;
      break;
    case 'Dry':
      score -= 10;
      break;
    default:
      break;
  }

  // 2. Hydration / Water Intake Impact (Target: >= 2.5L)
  const water = parseFloat(waterIntake) || 2;
  if (water >= 3.0) {
    score += 6;
  } else if (water >= 2.5) {
    score += 2;
  } else if (water >= 2.0) {
    score -= 4;
  } else if (water >= 1.5) {
    score -= 12;
  } else {
    score -= 20; // High dehydration penalty
  }

  // 3. Age Cellular Renewal Factor
  const userAge = parseInt(age, 10) || 24;
  if (userAge <= 22) {
    score += 2;
  } else if (userAge <= 30) {
    score -= 2;
  } else if (userAge <= 42) {
    score -= 8;
  } else if (userAge <= 55) {
    score -= 14;
  } else {
    score -= 18;
  }

  // 4. Sun Exposure / UV Index Impact
  const sun = parseFloat(sunExposure) || 1.5;
  if (sun <= 1) {
    score += 2;
  } else if (sun <= 2.5) {
    score -= 4;
  } else if (sun <= 4) {
    score -= 12;
  } else {
    score -= 20; // High photo-damage risk
  }

  // Clamp score between 25 and 98 for realistic dermatological scoring
  const finalScore = Math.max(25, Math.min(98, Math.round(score)));

  // Risk Classification matching Figma design ("Moderate", "Low", "High")
  let riskLevel = 'Moderate';
  let riskColor = '#d97706'; // Amber

  if (finalScore >= 78) {
    riskLevel = 'Low';
    riskColor = '#15803d'; // Green
  } else if (finalScore >= 55) {
    riskLevel = 'Moderate';
    riskColor = '#b45309'; // Amber
  } else {
    riskLevel = 'Elevated';
    riskColor = '#b91c1c'; // Red
  }

  return {
    score: finalScore,
    riskLevel,
    riskColor,
    factors: {
      hydrationRating: water >= 2.5 ? 'Good' : water >= 1.8 ? 'Fair' : 'Needs Attention',
      uvRisk: sun > 2.5 ? 'Elevated UV Exposure' : 'Well Managed',
      skinTypeBalance: skinType === 'Normal' ? 'Balanced' : 'Targeted Care Needed'
    }
  };
}

export function getSkinRecommendations(skinType, score, riskLevel) {
  const amRoutines = {
    Normal: ['Gentle Gel Cleanser', 'Vitamin C 10% Brightening Serum', 'Lightweight Ceramide Moisturizer', 'Broad Spectrum SPF 50+ PA++++'],
    Dry: ['Hydrating Milk Cleanser', 'Hyaluronic Acid 2% + B5 Serum', 'Rich Barrier Cream with Squalane', 'Nourishing Mineral Sunscreen SPF 50+'],
    Oily: ['Salicylic Acid 1.5% Foaming Cleanser', 'Niacinamide 10% + Zinc 1% Serum', 'Oil-Free Mattifying Water Gel', 'Ultra-Light Fluid Sunscreen SPF 50+'],
    Combination: ['Gentle Balancing Cleanser', 'Niacinamide 5% Pore Refining Serum', 'Dual-Zone Hydrating Emulsion', 'Non-Comedogenic Sunscreen SPF 50+']
  };

  const pmRoutines = {
    Normal: ['Micellar Water Makeup/Pollution Removal', 'Gentle Foaming Cleanser', 'Peptide Night Recovery Cream'],
    Dry: ['Oil-Based Cleansing Balm', 'Hydrating Milk Wash', 'Ceramide + Fatty Acid Barrier Repair Night Mask'],
    Oily: ['Gentle Gel Cleanser', 'BHA Exfoliant (2x weekly)', 'Centella Asiatica Soothing Gel Moisturizer'],
    Combination: ['Balancing Cleanser', 'Hyaluronic Acid on Cheeks, Gentle AHA/BHA on T-Zone', 'Lightweight Overnight Repair Lotion']
  };

  const actions = [
    {
      title: 'Daily SPF Log',
      desc: 'Apply broad-spectrum sunscreen 15 minutes before UV exposure.',
      tag: 'Daily Routine',
      icon: 'sun'
    },
    {
      title: 'Hydration Target',
      desc: 'Drink at least 2.5L of water daily to maintain cellular skin turgor.',
      tag: 'Lifestyle',
      icon: 'droplet'
    },
    {
      title: 'Routine Lesion Photo Check',
      desc: 'Capture periodic photos of any moles or spots to track changes.',
      tag: 'Precaution',
      icon: 'camera'
    }
  ];

  return {
    amRoutine: amRoutines[skinType] || amRoutines['Combination'],
    pmRoutine: pmRoutines[skinType] || pmRoutines['Combination'],
    actions,
    summary: `Based on your ${skinType} skin profile and current health score of ${score}/100, your skin barrier requires balanced hydration and antioxidant protection against environmental stressors.`
  };
}
