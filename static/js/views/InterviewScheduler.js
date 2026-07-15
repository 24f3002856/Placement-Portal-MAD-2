const InterviewScheduler = {
    data(){
        return{
            interview:{
                application_id:null,
                date:"",
                time:"",
                mode:"Online",
                meeting_link:"",
                instructions:""
            },
            application:{},
            loading:false,
            errorMessage: "",
            showError: false
        }
    },

    async mounted(){
        await this.loadApplication();
    },

    methods:{
        async loadApplication(){
            try{
                const id = this.$route.params.id;
                this.loading = true
                this.application = await API.getApplication(id);
                this.interview.application_id = id;
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

        async scheduleInterview(){
            try{
                await API.scheduleInterview(this.interview);
                alert("Interview Scheduled Successfully");
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to schedule interview";
                this.showError = true;
            }
        }
    },

    template:`
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Interview Form...">
        </loader> 

        <h2 class="mb-4">
            Schedule Interview
        </h2>

        <div class="card shadow">
            <div class="card-body">
                <p>
                    <strong>Student:</strong>
                    {{application.student_name}}
                </p>

                <p>
                    <strong>Job Title:</strong>
                    {{application.job_title}}
                </p>

                <p>
                    <strong>Current Status: </strong>
                    <status-badge :status="application.status">
                    </status-badge>
                </p>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Interview Date: 
                        </label>
                        <input type="date" class="form-control" v-model="interview.date">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Interview Time: 
                        </label>
                        <input type="time" class="form-control" v-model="interview.time">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Interview Mode: 
                        </label>
                        <select class="form-select" v-model="interview.mode">
                           <option>Online</option>
                           <option>Offline</option>
                        </select>
                    </div>

                    <div v-if="interview.mode == 'Online'" class="col-md-6 mb-3">
                        <label class="form-label">
                            Meeting Link: 
                        </label>
                        <input type="text" class="form-control" v-model="interview.meeting_link">
                    </div>

                    <div class="col-12 mb-3">
                        <label class="form-label">
                            Instructions: 
                        </label>
                        <textarea rows="4" class="form-control" v-model="interview.instructions">
                       </textarea>
                    </div>
                </div>

                <div class="row">
                    <div class="col-9 d-flex justify-content-start">
                        <button class="btn btn-secondary" @click="$router.back()">
                            Back
                        </button>
                    </div>
                    <div class="col-3 d-flex justify-content-end">
                        <button class="btn btn-primary me-2" @click="scheduleInterview">
                            Schedule Interview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}