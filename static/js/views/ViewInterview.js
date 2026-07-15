const ViewInterview={
    data(){
        return{
            interview:{},
            application:{},
            loading:false,
            showError:false,
            errorMessage:""
        }
    },

    async mounted(){
        await this.loadInterview();
        await this.loadApplication();
    },

    methods:{
        async loadInterview(){
            try{
                this.loading = true;
                const id = this.$route.params.id;
                this.interview = await API.getInterview(id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load interview.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async loadApplication(){
            try{
                this.loading = true;
                this.application = await API.getApplication(this.interview.application_id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load application.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async cancelInterview(){
            try{
                this.interview.status="Cancelled";
                await API.updateInterview(this.interview.interview_id, this.interview);
                this.$router.back()
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update interview.";
                this.showError = true;
            }

        },
        async completeInterview(){
            try{
                this.interview.status="Completed";
                await API.updateInterview(this.interview.interview_id, this.interview);
                this.$router.back()
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update interview.";
                this.showError = true;
            }
        },
    },

    computed:{
        user(){
            return JSON.parse(localStorage.getItem("user"));
        },
        role(){
            return this.user.role;
        },
    },

    template:`
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Interview...">
        </loader>

        <h2>
            Interview Details
        </h2>
        <div class="card shadow">
            <div class="card-body">
                <p>
                    <strong>Interview Date:</strong>
                    {{interview.date}}
                </p>
                <p>
                    <strong>Mode:</strong>
                    {{interview.mode}}
                </p>
                <p>
                    <strong>Time:</strong>
                    {{interview.time}}
                </p>
                <p v-if="interview.mode == 'Online'">
                    <strong>Meeting Link:</strong>
                    {{interview.meeting_link}}
                </p>
                <p>
                    <strong>Instructions:</strong>
                    {{interview.instructions}}
                </p>

                <div class="row">
                    <div class="col-7 d-flex justify-content-start">
                        <button class="btn btn-warning" @click="$router.back()">
                            Back
                        </button>
                    </div> 
                    <div class="col-5 d-flex justify-content-between">                 
                        <button v-if="role=='company' && application.status === 'Interview'" class="btn btn-primary me-2" @click="completeInterview">
                            Mark as Complete
                        </button>
                        <button v-if="role=='company' && application.status === 'Interview'" class="btn btn-danger me-2" @click="cancelInterview">
                            Cancel Interview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}