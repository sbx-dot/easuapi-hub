export const defaultSupportEmail = "bx@eelapi.com";

export const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || defaultSupportEmail;
