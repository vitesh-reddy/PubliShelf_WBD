export const firstnameRules = {
  required: "First name is required",
  pattern: {
    value: /^[A-Za-z\s]+$/,
    message: "Only alphabets allowed"
  }
};

export const lastnameRules = {
  required: "Last name is required",
  pattern: {
    value: /^[A-Za-z\s]+$/,
    message: "Only alphabets allowed"
  }
};

export const emailRules = {
  required: "Email is required",
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Invalid email"
  }
};

export const currentPasswordRules = {
  required: "Current password is required"
};

export const newPasswordRules = {
  minLength: {
    value: 3,
    message: "Minimum 3 characters"
  }
};

export const confirmPasswordRules = (newPassword) => ({
  validate: v => v === newPassword || "Passwords do not match"
});
