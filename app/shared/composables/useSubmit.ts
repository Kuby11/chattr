export function useSubmit() {
	const serverError = ref<string | null>(null)
	const isSubmitting = ref<boolean>(false)
	const isSubmitted = ref<boolean>(false)
	const isSuccess = ref<boolean>(false)

	const handleSubmit = async (submitFn: unknown) => {
		isSubmitting.value = true
		isSubmitted.value = true
		serverError.value = null

		try {
			if (typeof submitFn === "function") {
				await submitFn()
			} else {
				await submitFn
			}

			isSuccess.value = true
		} catch (error) {
			if (error instanceof Error) {
				serverError.value = error.message
			} else {
				serverError.value = String(error)
			}

		} finally {
			isSubmitting.value = false
		}
	}

	return {
		serverError,
		isSubmitted,
		isSubmitting,
		isSuccess,
		handleSubmit
	}
}
