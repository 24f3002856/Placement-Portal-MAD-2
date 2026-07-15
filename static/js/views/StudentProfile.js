const StudentProfile = {
    data() {
        return {
            student: {},
            resumeFile: null,
            loading: false,
            showError: false,
            errorMessage: "",
        }
    },

    async mounted() {
        await this.loadStudent();
    },

    methods: {
        async loadStudent() {
            try{
                const id = this.$route.params.id;
                this.student = await API.getStudent(id);
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

        selectResume(event){
            this.resumeFile = event.target.files[0];
        },
        async updateProfile(){
            try{
                const formData = new FormData();
                
                formData.append("student_name", this.student.student_name);
                formData.append("gender", this.student.gender);
                formData.append("contact", this.student.contact);
                formData.append("department", this.student.department);
                formData.append("education", this.student.education);
                formData.append("cgpa", this.student.cgpa);
                formData.append("skills", this.student.skills);
                
                if(this.resumeFile){
                    formData.append("resume", this.resumeFile);
                }        
                await API.updateStudent(this.student.student_id,formData);        
                alert("Student Profile Updated");        
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to load dashboard.";
                this.showError = true;
            }
        },
    },

    template: `
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Student Form...">
        </loader>

        <h2 class="mb-4">Student Profile</h2>

        <div class="card shadow">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Student Name
                        </label>
                        <input class="form-control" v-model="student.student_name">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Gender
                        </label>
                        <input class="form-control" v-model="student.gender">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Contact
                        </label>
                        <input class="form-control" v-model="student.contact">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Department
                        </label>
                        <input class="form-control" v-model="student.department">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Eduction
                        </label>
                        <input class="form-control" v-model="student.education">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            CGPA
                        </label>
                        <input class="form-control" v-model="student.cgpa">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Skills
                        </label>
                        <input class="form-control" v-model="student.skills">
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Resume
                        </label>
                        <input class="form-control" type="file" accept=".pdf" @change="selectResume">
                    </div>
                </div>                    

                <div class="mt-4 d-flex justify-content-between">
                    <button class="btn btn-warning" @click="$router.back()">
                        Back
                    </button>

                    <button class="btn btn-success" @click="updateProfile()">
                        Save Profile
                    </button>                  
                </div>

            </div>
        </div>
    </div>    
    `
}