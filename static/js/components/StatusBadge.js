const StatusBadge = {
    props: {
        status: {
            type: String,
            required: true
        }
    },
    
    computed: {
        badgeClass(){
            switch(this.status){
                case "Approved":
                case "Selected":
                    return "bg-success"

                case "Pending":
                case "Waiting":
                    return "bg-warning "

                case "Rejected":
                    return "bg-danger"

                case "Closed":
                    return "bg-secondary"

                default:
                    return "bg-primary"
            }
        }
    },
    
    template: `
    <span class="badge" :class="badgeClass">
        {{ status }}
    </span>
    `
}