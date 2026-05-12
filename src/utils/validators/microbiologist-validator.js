import Joi from "joi";

export const qualityTestSchema = Joi.object({
    fat: Joi.number().min(0).max(100).allow(null).optional().messages({
        "number.base": "FAT must be a number",
        "number.min": "FAT cannot be negative",
        "number.max": "FAT cannot exceed 100%"
    }),
    snf: Joi.number().min(0).max(100).allow(null).optional().messages({
        "number.base": "SNF must be a number",
        "number.min": "SNF cannot be negative",
        "number.max": "SNF cannot exceed 100%"
    }),
    density: Joi.number().min(0).allow(null).optional().messages({
        "number.base": "Density must be a number",
        "number.min": "Density cannot be negative"
    }),
    acidity: Joi.number().min(0).max(100).allow(null).optional().messages({
        "number.base": "Acidity must be a number",
        "number.min": "Acidity cannot be negative"
    }),
    temperature: Joi.number().allow(null).optional().messages({
        "number.base": "Temperature must be a number",
    }),
    freezingPoint: Joi.number().allow(null).optional().messages({
        "number.base": "Freezing point must be a number",
    }),
    ph: Joi.number().min(0).max(14).allow(null).optional().messages({
        "number.base": "pH must be a number",
        "number.min": "pH must be between 0 and 14",
        "number.max": "pH must be between 0 and 14"
    }),
    alcoholTest: Joi.string().trim().allow("").optional().messages({
        "string.empty": "Alcohol test result is required",
    }),
    cobTest: Joi.string().trim().allow("").optional().messages({
        "string.empty": "COB test result is required",
    }),
    sedimentTest: Joi.string().valid("Sediments Found", "Sediments Not Found").allow("").optional().messages({
        "string.empty": "Sediment test result is required",
        "any.only": "Please select a valid sediment test result"
    }),
    ageOfMilk: Joi.string().trim().allow("").optional().messages({
        "string.empty": "Age of milk is required",
    }),
    appearance: Joi.string().trim().allow("").optional().messages({
        "string.empty": "Appearance description is required",
    }),
    smell: Joi.string().trim().allow("").optional().messages({
        "string.empty": "Smell description is required",
    }),
    taste: Joi.string().trim().allow("").optional().messages({
        "string.empty": "Taste description is required",
    }),

    // Safety Checks (Yes/No)
    preservatives: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Preservatives status is required",
        "any.only": "Preservatives status must be Yes or No"
    }),
    adulterants: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Adulterants status is required",
        "any.only": "Adulterants status must be Yes or No"
    }),
    neutralizers: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Neutralizers status is required",
        "any.only": "Neutralizers status must be Yes or No"
    }),
    addedWater: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Added Water status is required",
        "any.only": "Added Water status must be Yes or No"
    }),
    foreignMaterials: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Foreign Materials status is required",
        "any.only": "Foreign Materials status must be Yes or No"
    }),
    powderedMilk: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Powdered Milk status is required",
        "any.only": "Powdered Milk status must be Yes or No"
    }),
    otherMilkProducts: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Other Milk Products status is required",
        "any.only": "Other Milk Products status must be Yes or No"
    }),
    antimicrobialResidues: Joi.string().valid("Yes", "No").allow("").optional().messages({
        "string.empty": "Antimicrobial Residues status is required",
        "any.only": "Antimicrobial Residues status must be Yes or No"
    }),

    bacSomatic: Joi.string().trim().allow("").optional().messages({
        "string.empty": "BacSomatic result is required",
    }),
    milkoScan: Joi.string().trim().allow("").optional().messages({
        "string.empty": "MilkoScan result is required",
    }),
    kurienScan: Joi.string().trim().allow("").optional().messages({
        "string.empty": "KurienScan result is required",
    }),
    remarks: Joi.string().allow("").optional(),
    status: Joi.string().valid("APPROVED", "REJECTED").optional().messages({
        "any.only": "A decision (Approve/Reject) is required"
    }),
    rejectionReason: Joi.string().when("status", {
        is: "REJECTED",
        then: Joi.required(),
        otherwise: Joi.optional().allow("")
    }).messages({
        "any.required": "Rejection reason is required when rejecting milk",
        "string.empty": "Rejection reason is required when rejecting milk"
    }),
    evidence: Joi.any().required().invalid(null).messages({
        "any.invalid": "Evidence image/document is required",
        "any.required": "Evidence image/document is required"
    })
});

export const certificationSchema = Joi.object({
    certId: Joi.string().required().messages({
        "string.empty": "Certification ID is required",
        "any.required": "Certification ID is required"
    }),
    title: Joi.string().required().messages({
        "string.empty": "Certification title is required",
        "any.required": "Certification title is required"
    }),
    category: Joi.string().required().messages({
        "string.empty": "Category is required",
        "any.required": "Category is required"
    }),
    issueDate: Joi.date().required().messages({
        "date.base": "A valid issue date is required",
        "any.required": "Issue date is required"
    }),
    expiryDate: Joi.date().greater(Joi.ref("issueDate")).required().messages({
        "date.base": "A valid expiry date is required",
        "date.greater": "Expiry date must be after issue date",
        "any.required": "Expiry date is required"
    }),
    document: Joi.any().required().messages({
        "any.required": "Certification document is required"
    })
});

export const raiseQuerySchema = Joi.object({
    name: Joi.string().required().messages({
        "string.empty": "Name is required",
        "any.required": "Name is required"
    }),
    email: Joi.string().email({ tlds: { allow: false } }).required().messages({
        "string.email": "Please enter a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required"
    }),
    phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        "string.pattern.base": "Phone number must be between 10-15 digits",
        "string.empty": "Contact number is required",
        "any.required": "Contact number is required"
    }),
    query: Joi.string().required().min(10).messages({
        "string.min": "Query must be at least 10 characters long",
        "string.empty": "Query description is required",
        "any.required": "Query description is required"
    })
});
