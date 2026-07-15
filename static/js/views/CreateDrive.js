const CreateDrive = {
    data() {
        return {
            drive: {
                job_title: "",
                job_description: "",
                required_skills: "",
                salary: "",
                location: "",
                application_deadline: ""
            },
            loading: false,
            showError: false,
            errorMessage: "",
        }
    },

    methods: {
        async createDrive() {
            try{
                this.loading = true
                await API.createDrive(this.drive);
                alert("Placement Drive Created Successfully");
                this.$router.back();
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to create drive.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        resetForm() {
            this.drive = {
                job_title: "",
                job_description: "",
                required_skills: "",
                salary: "",
                location: "",
                application_deadline: ""
            };
        }
    },

    template: `
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>
        
        <h2 class="mb-4">
            Create Placement Drive
        </h2>

        <div class="card shadow">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Job Title
                        </label>
                        <input class="form-control" v-model="drive.job_title">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Salary (LPA)
                        </label>
                        <input type="number" class="form-control" v-model="drive.salary">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Job Location
                        </label>
                        <input class="form-control" v-model="drive.location">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Application Deadline
                        </label>
                        <input type="date" class="form-control" v-model="drive.application_deadline">
                    </div>

                    <div class="col-12 mb-3">
                        <label class="form-label">
                            Required Skills
                        </label>
                        <textarea rows="4" class="form-control" v-model="drive.required_skills">
                        </textarea>
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Minimum CGPA
                        </label>
                        <input type="number" class="form-control" v-model="drive.minimum_cgpa">
                    </div>

                    <div class="col-12 mb-3">
                        <label class="form-label">
                            Job Description
                        </label>
                        <textarea rows="6" class="form-control" v-model="drive.job_description">
                        </textarea>
                    </div>
                </div>

                <div class="row">
                    <div class="col-8 d-flex justify-content-start">
                        <button class="btn btn-secondary" @click="$router.back()">
                            Back
                        </button>
                    </div>
                    <div class="col-4 d-flex justify-content-between">
                        <button class="btn btn-success me-2" @click="createDrive">
                            Create Drive
                        </button>
                        <button class="btn btn-warning me-2" @click="resetForm">
                            Reset
                        </button>                    
                    </div>
                </div>
                
                <loader v-if="loading" message="Creating Drive...">
                </loader>  
            </div>
        </div>
    </div>
    `
}