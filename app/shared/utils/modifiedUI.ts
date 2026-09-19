export const modifiedUI = <T extends Record<string, any> | undefined>(
	modifications: Partial<NonNullable<T>>,
	baseUI?: T,
): ComputedRef<Partial<NonNullable<T>>> => computed(() => {
	return {
		...modifications,
		...(baseUI || {})
	} as Partial<NonNullable<T>>
})
