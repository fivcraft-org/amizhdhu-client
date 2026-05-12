export const MILK_QUALITY_STANDARDS = {
    cow: {
        fat: { min: 3.2, max: 15.0 },
        snf: { min: 8.3, max: 15.0 },
        acidity: { min: 0.10, max: 0.18 },
        density: { min: 1.028, max: 1.032 },
    },
    buffalo: {
        fat: { min: 6.0, max: 15.0 },
        snf: { min: 9.0, max: 15.0 },
        acidity: { min: 0.10, max: 0.18 },
        density: { min: 1.028, max: 1.032 },
    },
    goat: {
        fat: { min: 3.5, max: 15.0 },
        snf: { min: 9.0, max: 15.0 },
        acidity: { min: 0.10, max: 0.18 },
        density: { min: 1.028, max: 1.032 },
    }
};

/**
 * @param {Object} data 
 * @param {string} milkType 
 * @returns {Object} 
 */
export const validateMilkQuality = (data, milkType) => {
    if (!milkType) return { status: "Approved", reason: null };

    const type = milkType.toLowerCase();
    const standards = MILK_QUALITY_STANDARDS[type];

    if (!standards) return { status: "Approved", reason: null, invalidFields: [] };

    let reasons = [];
    let invalidFields = [];

    if (data.fat !== undefined && data.fat !== "") {
        const fat = parseFloat(data.fat);
        if (fat < standards.fat.min || fat > standards.fat.max) {
            reasons.push(`FAT must be between ${standards.fat.min}% and ${standards.fat.max}% for ${milkType} milk`);
            invalidFields.push(`FAT (${fat}%)`);
        }
    }

    if (data.snf !== undefined && data.snf !== "") {
        const snf = parseFloat(data.snf);
        if (snf < standards.snf.min || snf > standards.snf.max) {
            reasons.push(`SNF must be between ${standards.snf.min}% and ${standards.snf.max}% for ${milkType} milk`);
            invalidFields.push(`SNF (${snf}%)`);
        }
    }

    if (data.acidity !== undefined && data.acidity !== "") {
        const acidity = parseFloat(data.acidity);
        if (acidity < standards.acidity.min || acidity > standards.acidity.max) {
            reasons.push(`Acidity must be between ${standards.acidity.min}% and ${standards.acidity.max}% for ${milkType} milk`);
            invalidFields.push(`Acidity (${acidity}%)`);
        }
    }

    if (data.density !== undefined && data.density !== "") {
        const density = parseFloat(data.density);
        if (density < standards.density.min || density > standards.density.max) {
            reasons.push(`Density must be between ${standards.density.min} and ${standards.density.max} for ${milkType} milk`);
            invalidFields.push(`Density (${density})`);
        }
    }

    if (reasons.length > 0) {
        return { 
            status: "Rejected", 
            reason: reasons.map(r => `• ${r}`).join("\n"), 
            invalidFields 
        };
    }

    return { status: "Approved", reason: null, invalidFields: [] };
};
