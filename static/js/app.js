// const app = Vue.createApp({
//     delimiters : ['${', '}'],
//     data() {
//         return {
//             msg : "Hello World from Vue"
//         }
//     }
// });

// app.mount("#app");

const app = Vue.createApp({
    data(){
        return{
            user:null,
            loading:false
        }
    },

    methods:{
        startLoading(){
            this.loading=true
        },

        stopLoading(){
            this.loading=false
        }
    }
})

registerComponents(app)
app.use(router)
app.mount("#app")