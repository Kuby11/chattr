export const safeValue = (value: string) => value.replace(/[&%]/g, "")
