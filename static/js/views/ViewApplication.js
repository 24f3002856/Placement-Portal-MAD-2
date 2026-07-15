const ViewApplication={
    data(){
        return{
            application:{},
            student:{},
            loading:false,
            showError:false,
            errorMessage:""
        }
    },

    async mounted(){
        await this.loadApplication();
        await this.loadStudent();
    },

    methods:{
        async loadApplication(){
            try{
                this.loading = true;
                const id=this.$route.params.id;
                this.application = await API.getApplication(id);
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

        async loadStudent(){
            try{
                this.loading = true;
                this.student = await API.getStudent(this.application.student_id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load student.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async shortlist(){
            try{
                this.application.status="Shortlisted";
                await API.updateApplication(this.application.application_id, this.application);
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update application.";
                this.showError = true;
            }
        },

        async reject(){
            try{
                this.application.status="Rejected";
                await API.updateApplication(this.application.application_id, this.application);
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update application.";
                this.showError = true;
            }
        },

        async interview(){
            this.$router.push("/schedule_interview/" + this.application.application_id);
        },

        async select(){
            try{
                this.application.status="Selected";
                await API.updateApplication(this.application.application_id, this.application);
                this.$router.push("/placement/" + this.application.application_id);
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update application.";
                this.showError = true;
            }
        },

        viewResume(){
            window.open("/" + this.student.resume, "_blank");
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

        <loader v-if="loading" message="Loading Application...">
        </loader>

        <h2>
            Application Details
        </h2>
        <div class="card shadow">
            <div class="card-body">
                <p>
                    <strong>Student Name:</strong>
                    {{student.student_name}}
                </p>
                <p>
                    <strong>Drive Applied:</strong>
                    {{application.job_title}}
                </p>
                <p>
                    <strong>Gender:</strong>
                    {{student.gender}}
                </p>
                <p>
                    <strong>Department:</strong>
                    {{student.department}}
                </p>
                <p>
                    <strong>Education:</strong>
                    {{student.education}}
                </p>
                <p>
                    <strong>CGPA:</strong>
                    {{student.cgpa}}
                </p>
                <p>
                    <strong>Skills:</strong>
                    {{student.skills}}
                </p>
                <p>
                    <strong>Contact:</strong>
                    {{student.contact}}
                </p>
                <p>
                    <strong>Status:</strong>
                    <status-badge :status="application.status">
                    </status-badge>
                </p>

                <div class="mt-4 mb-4">
                    <button class="btn btn-outline-primary" @click="viewResume">
                        View Resume
                    </button>
                </div>
                
                <div class="row">
                    <div class="col-8 d-flex justify-content-start">
                        <button class="btn btn-secondary" @click="$router.back()">
                            Back
                        </button>
                    </div>
                    <div class="col-4 d-flex justify-content-between">
                        <button v-if="role=='company' && application.status === 'Waiting' " class="btn btn-success me-2" @click="shortlist">
                            Shortlist
                        </button>
                        <button v-if="role=='company' && application.status === 'Shortlisted'" class="btn btn-primary me-2" @click="interview">
                            Schedule Interview
                        </button>
                        <button v-if="role=='company' && application.status === 'Interview'" class="btn btn-success me-2" @click="select">
                            Select & Offer-Letter
                        </button>
                        <button v-if="role=='company'" class="btn btn-danger me-2" @click="reject">
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}