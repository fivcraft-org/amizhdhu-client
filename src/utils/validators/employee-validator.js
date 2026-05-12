import Joi from "joi";

export const employeeSchema = Joi.object({
  employeeName: Joi.string()
    .required()
    .pattern(/^[A-Za-z\s]+$/)
    .messages({
      "string.empty": "Employee name is required.",
      "string.pattern.base": "Employee name should contain only alphabets.",
    }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email is required.",
      "string.email": "Enter a valid email address.",
    }),
  phoneNumber: Joi.string()
    .required()
    .length(10)
    .pattern(/^[6-9]/)
    .messages({
      "string.empty": "Phone number is required.",
      "string.length": "Phone number must contain 10 digits.",
      "string.pattern.base": "Number must start with 6, 7, 8, or 9.",
    }),
  role: Joi.string().required().messages({
    "string.base": "Role is required.",
    "any.required": "Role is required.",
    "string.empty": "Role is required.",
  }),
  centerId: Joi.string().when("isCollector", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional().allow(""),
  }).messages({
    "any.required": "Collection Center is required.",
    "string.empty": "Collection Center is required.",
  }),
  joiningDate: Joi.string().required().messages({
    "string.empty": "Joining date is required.",
  }),
  employeeAddress: Joi.string().required().max(150).messages({
    "string.empty": "Address is required.",
    "string.max": "Address cannot exceed 150 characters.",
  }),
});
 