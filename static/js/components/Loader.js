const Loader = {
    props: {
        message: {
            type: String,
            default: "Loading..."
        }
    },
    
    template: `
    <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
        </div>
        <p class="mt-3 text-muted">
            {{ message }}
        </p>
    </div>
    `
}