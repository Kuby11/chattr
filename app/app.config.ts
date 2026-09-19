export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'neutral'
    },
    main: {
      base: 'min-h-0'
    },
    input: {
      compoundVariants: [{ class: "transition" }]
    },
    button: {
      compoundVariants: [{ class: 'cursor-pointer' }]
    },
    textarea: {
      compoundVariants: [{ class: "transition-colors" }]
    },
    modal: {
      slots: {
        overlay: 'backdrop-blur-sm',
        content: 'sm:p-8 p-4'
      }
    }
  }
})
