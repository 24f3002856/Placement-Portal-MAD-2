const DashboardCard = {
    props: {
        title: {
            type: String,
            required: true
        },
        value: {
            type: [String, Number],
            required: true
        },
        subtitle: {
            type: String,
            default: ""
        },
        color: {
            type: String,
            default: "primary"
        }
    },

    computed: {
        cardClass() {
            return ["border-2","border-" + this.color]
        },
        textClass() {
            return "text-" + this.color;
        }
    },
    
    template: `
    <div class="card shadow-sm h-100" :class="cardClass">
        <div class="card-body text-center">
            <h6 class="text-muted">
                {{ title }}
            </h6>
            <h1 class="fw-bold my-3" :class="textClass">
                {{ value }}
            </h1>
            <small class="text-muted">
                {{ subtitle }}
            </small>
        </div>
    </div>
    `
}