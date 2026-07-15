const ViewDrive = {
    data(){
        return{
            drive:{},
            applications: [],
            loading:false,
            showError:false,
            errorMessage:""
        }
    },

    async mounted(){
        await this.loadDrive();
        await this.loadApplications();
    },

    methods:{
        async loadDrive(){
            try{
                this.loading = true;
                const id = this.$route.params.id;
                this.drive=await API.getDrive(id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load drive.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async loadApplications(){
            try{
                this.loading = true;
                let user = JSON.parse(localStorage.getItem("user"));
                if (user.role != "student"){
                    this.applications = await API.getApplicationList({
                        drive_id : this.drive.drive_id
                    })
                }
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load applications.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
            
        },

        async apply(){
            try{
                await API.apply({drive_id: this.drive.drive_id});
                alert("Application Submitted");                
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to apply.";
                this.showError = true;
            }
        },

        async approve(){
            try{
                await API.approveDrive(this.drive.drive_id);
                alert("Drive Approved");
                this.$router.push("/admin");
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update drive.";
                this.showError = true;
            }
        },

        async reject(){
            try{
                await API.rejectDrive(this.drive.drive_id);
                alert("Drive Rejected");
                this.$router.push("/admin");
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update drive.";
                this.showError = true;
            }
        },

        async closeDrive(){
            try{
                await API.closeDrive(this.drive.drive_id);
                alert("Drive Closed");
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update drive.";
                this.showError = true;
            }
        },
        
        viewApplication(application){
            this.$router.push("/application/"+application.application_id);
        },
        viewInterview(application){
            if(!application.interview){
                alert("Interview has not been scheduled yet.");
                return;
            }            
            this.$router.push("/view_interview/" + application.interview.interview_id);
        },
    },

    computed:{
        user(){
            return JSON.parse(localStorage.getItem("user"));
        },
        role(){
            return this.user.role;
        },
        newApplications(){
            return this.applications.filter( application => application.status === "Waiting")
        },        
        shortlistedApplications(){
            return this.applications.filter( application => application.status === "Shortlisted")
        },
        upcomingInterviews(){            
            return this.applications.filter( application => application.status === "Interview" && application.interview.status === "Scheduled")
        },
        interviewedApplications(){            
            return this.applications.filter( application => application.status === "Interview" && application.interview.status === "Completed")
        },
    },

    template:`
    <div class="container py-4">    
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Drive...">
        </loader>

        <h2 class="mb-4">
            Drive Details
        </h2>
        
        <div class="card shadow">
            <div class="card-body">

                <p v-if="role=='admin' || role=='student'">
                    <strong>Company: </strong>
                    {{drive.company_name}}
                </p>
                <p>
                    <strong>Job Title:</strong>
                    {{drive.job_title}}
                </p>
                <p>
                    <strong>Salary: </strong>
                    {{drive.salary}}
                </p>
                <p>
                    <strong>Location: </strong>
                    {{drive.location}}
                </p>
                <p>
                    <strong>Deadline: </strong>
                    {{drive.application_deadline}}
                </p>
                <p>
                    <strong>Status: </strong>
                    <status-badge :status="drive.status">
                    </status-badge>
                </p>
                <p>
                    <strong>Required Skills: </strong>
                    {{drive.required_skills}}
                </p>
                <p>
                    <strong>Description: </strong>
                    {{drive.job_description}}
                </p>
                
                <div v-if="role == 'company' && drive.status === 'Approved'" >
                <div class="card shadow mt-5">
                    <div class="card-header">
                        <h4> New Applications: </h4>
                    </div>

                    <div class="card-body">
                        <table class="table table-bordered table-hover">
                            <thead class="table-success">
                                <tr>
                                    <th>Application ID</th>
                                    <th>Student Name</th>
                                    <th>Application Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="application in newApplications" :key="application.application_id">
                                    <td>
                                        {{application.application_id}}
                                    </td>
                                    <td>
                                        {{application.student_name}}
                                    </td>
                                    <td>
                                        {{application.application_date}}
                                    </td>
                                    <td>
                                        <button class="btn btn-success btn-sm me-1" @click="viewApplication(application)">
                                            Review Application
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card shadow mt-5">
                    <div class="card-header">
                        <h4> Shorlisted Applications: </h4>
                    </div>

                    <div class="card-body">
                        <table class="table table-bordered table-hover">
                            <thead class="table-warning">
                                <tr>
                                    <th>Application ID</th>
                                    <th>Student Name</th>
                                    <th>Application Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="application in shortlistedApplications" :key="application.application_id">
                                    <td>
                                        {{application.application_id}}
                                    </td>
                                    <td>
                                        {{application.student_name}}
                                    </td>
                                    <td>
                                        {{application.application_date}}
                                    </td>
                                    <td>
                                        <button class="btn btn-success btn-sm me-1" @click="viewApplication(application)">
                                            Review Applications
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card shadow mt-5">
                    <div class="card-header">
                        <h4> Upcoming Interviews: </h4>
                    </div>

                    <div class="card-body">
                        <table class="table table-bordered table-hover">
                            <thead class="table-danger">
                                <tr>
                                    <th>Application ID</th>
                                    <th>Student Name</th>
                                    <th>Application Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="application in upcomingInterviews" :key="application.application_id">
                                    <td>
                                        {{application.application_id}}
                                    </td>
                                    <td>
                                        {{application.student_name}}
                                    </td>
                                    <td>
                                        {{application.application_date}}
                                    </td>
                                    <td>
                                        <button class="btn btn-success btn-sm me-1" @click="viewInterview(application)">
                                            View Interview Schedule
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card shadow mt-5 mb-5">
                    <div class="card-header">
                        <h4> Interviewed Candidates: </h4>
                    </div>

                    <div class="card-body">
                        <table class="table table-bordered table-hover">
                            <thead class="table-primary">
                                <tr>
                                    <th>Application ID</th>
                                    <th>Student Name</th>
                                    <th>Application Date</th>
                                    <th>Action </th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr v-for="application in interviewedApplications" :key="application.application_id">
                                    <td>
                                        {{application.application_id}}
                                    </td>
                                    <td>
                                        {{application.student_name}}
                                    </td>
                                    <td>
                                        {{application.application_date}}
                                    </td>
                                    <td>
                                        <button class="btn btn-success btn-sm me-1" @click="viewApplication(application)">
                                            View Application
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>

                <div class="row">
                    <div class="col-9 d-flex justify-content-start">
                        <button class="btn btn-secondary" @click="$router.back()">
                            Back
                        </button>
                    </div>
                    <div v-if="role=='student' && drive.status == 'Approved'" class="col-3 d-flex justify-content-end">
                        <button class="btn btn-success me-2" @click="apply">
                            Apply
                        </button>
                    </div>
                    <div v-if="role=='admin' && drive.status == 'Pending'" class="col-3 d-flex justify-content-between">
                        <button class="btn btn-success me-2" @click="approve">
                            Approve
                        </button>
                        <button class="btn btn-danger me-2" @click="reject">
                            Reject
                        </button>
                    </div>
                    <div v-if="role=='admin' && drive.status == 'Approved'" class="col-3 d-flex justify-content-end">
                        <button class="btn btn-warning" @click="closeDrive">
                            Close Drive
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}
