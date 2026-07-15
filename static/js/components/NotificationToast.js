const NotificationToast = {
    props:{
        type:{
            type:String,
            default:"success"
        },
        message:{
            type:String,
            required:true
        }
    },

    computed:{
        alertClass(){
            return{
                success:"alert-success",
                danger:"alert-danger",
                warning:"alert-warning",
                info:"alert-info"
            }[this.type]
        }
    },

    emits:["close"],
    
    template:`
    <div class="alert d-flex justify-content-between align-items-center" :class="alertClass">
        <span>
            {{ message }}
        </span>
        <button class="btn-close" @click="$emit('close')">
        </button>
    </div>
    `
}