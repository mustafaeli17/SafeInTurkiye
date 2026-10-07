// Opt in only after migration 0005 has been applied to the target environment.
// Production stays on its existing schema until explicitly approved.
export const foundationEnabled = import.meta.env.VITE_PLATFORM_FOUNDATION === 'true'
