import { breakpointsTailwind, useBreakpoints } from "@vueuse/core"

export const useBreakpoint = () => {
	const breakpoints = useBreakpoints({...breakpointsTailwind, 'xs': 480})

	return {
		'xs': breakpoints.isSmallerOrEqual('xs'),
		'sm': breakpoints.isSmallerOrEqual('sm'),
		'md': breakpoints.isSmallerOrEqual('md'),
		'lg': breakpoints.isSmallerOrEqual('lg'),
		'xl': breakpoints.isSmallerOrEqual('xl'),
		'2xl': breakpoints.isSmallerOrEqual('2xl'),
	}
}
