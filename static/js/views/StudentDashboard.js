const StudentDashboard = {
    data() {
        return {
            loading: false,
            showError: false,
            errorMessage: "",
            dashboard: {},
            student: {},
            drives: [],
            applications: [],
            placements: [],
            searchMode: false
        }
    },

    async mounted(){
        await this.loadDashboard();
        await this.loadStudent();
        await this.loadDrives();
        await this.loadApplications();
        await this.loadPlacements();
    },

    methods:{
        //-------------------------
        // Dashboard
        //-------------------------
        async loadDashboard(){
            try{
                this.loading = true;
                this.dashboard = await API.getStudentDashboard();
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load dashboard.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        //-------------------------
        // Student Profile
        //-------------------------
        async loadStudent(){
            try{
                const id = this.$route.params.id;
                this.loading = true;
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
        async updateProfile(){
            this.$router.push("/student_profile/"+this.student.student_id);
        },

        //-------------------------
        // Drives
        //-------------------------
        async loadDrives(){
            try{
                this.loading = true;
                this.drives = await API.getDriveList({status: "Approved"});
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load drives.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
        async apply(drive){
            try{
                await API.apply({drive_id: drive.drive_id});
                alert("Application Submitted");
                this.loadApplications();
            }
            catch(error){                
                this.errorMessage = error.error_message || "Application failed.";
                this.showError = true;
            }
            
        },

        //-------------------------
        // Applications
        //-------------------------
        async loadApplications(){
            try{
                this.loading = true;
                this.applications = await API.getApplicationList({student_id: this.student.student_id});
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
        //-------------------------
        // Placement History
        //-------------------------
        async loadPlacements(){
            try{
                this.loading = true;
                this.placements = await API.getPlacementList({student_id: this.student.student_id});
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load placements";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
        viewDrive(drive){
            this.$router.push("/drive/"+drive.drive_id);
        },
        viewInterview(application){
            if(!application.interview){
                alert("Interview has not been scheduled yet.");
                return;
            }
            this.$router.push("/view_interview/"+application.interview.interview_id);
        },
        async exportCSV() {
            try{
                const response = await API.exportApplications();
                setTimeout(() => {
                    window.open(`/static/exports/student_${this.student.student_id}.csv`,"_blank");
                }, 3000);
                alert(response.message);                
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Export failed.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
        viewOffer(offer){
            this.$router.push("/view_offer/"+offer.placement_id);
        },
        async search(query){
            this.searchQuery = query;
            if(!this.searchQuery.trim()){
                this.searchMode = false
                this.loadDrives();
                this.loadApplications();
                this.loadPlacements();
                return;
            }
            try{
                this.searchMode = true
                this.loading = true;
                const results = await API.searchStudent(query)
                
                this.applications = results.applications || [];
                this.drives = results.drives || [];
                this.placements = results.placements || [];
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Search failed";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
    },
    computed:{
        my_applications(application){
            return this.applications.filter(application => application.status === "Waiting" || application.status === "Shortlisted" || application.status === "Rejected")
        },
        interviewapplications(application){
            return this.applications.filter(application => application.status === "Interview")
        },
        pendingplacements(offer){
            return this.placements.filter(offer => offer.offer_status === "Pending")
        },
        acceptedplacements(placement){
            return this.placements.filter(placement => placement.offer_status === "Accepted")
        },
    },

    template:`
    <div>
        <navbar-component
            title="Student Dashboard"
            showLogout=True>
        </navbar-component>

        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar -->
                <div class="col-md-2">
                    <sidebar-component
                    :menu-items="[
                    {
                    name:'Drives',
                    id:'drives'
                    },
                    {
                    name:'My Applications',
                    id:'applications'
                    },
                    {
                    name:'Placement Stats',
                    id:'history'
                    }
                    ]">
                    </sidebar-component>
                </div>

                <!-- Main Content -->
                <div class="col-md-10 p-4">
                    <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
                    </notification-toast>

                    <loader v-if="loading" message="Loading Dashboard...">
                    </loader>

                    <div class="d-flex justify-content-between align-items-center">
                        <h2 class="mb-4">
                            Welcome {{student.student_name}} !
                        </h2>
                        <button class="btn btn-primary btn-sm" @click="updateProfile()"> 
                            Edit Profile
                        </button>
                    </div>

                    <!-- Dashboard Cards -->
                    <div class="row g-3 mb-5">
                        <div class="col-md-3">
                            <dashboard-card title="Applied" :value="dashboard.applied_drives" subtitle="Applications" color="primary">
                            </dashboard-card>
                        </div>

                        <div class="col-md-3">
                            <dashboard-card title="Interviews" :value="dashboard.interviews" subtitle="Scheduled" color="success">
                            </dashboard-card>
                        </div>

                        <div class="col-md-3">
                            <dashboard-card title="Offers" :value="dashboard.offers" subtitle="Received" color="warning">
                            </dashboard-card>
                        </div>
                        <div class="col-md-3">
                            <dashboard-card title="Placements" :value="dashboard.placements" subtitle="Completed" color="danger">
                            </dashboard-card>
                        </div>
                    </div>
                    <br>
                    <search-bar
                        placeholder="Search Companies, Drives, Applications..."
                        @search="search">
                    </search-bar>

                    <!-- Available Drives -->
                    <section id="drives" v-if="!searchMode || drives.length" class="mt-4">
                    <h4>Drives</h4>

                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5>
                                Available Placement Drives
                            </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Job</th>
                                        <th>Deadline</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="drive in drives" :key="drive.drive_id">
                                        <td>
                                            {{drive.drive_id}}
                                        </td>
                                        <td>
                                            {{drive.company_name}}
                                        </td>
                                        <td>
                                            {{drive.job_title}}
                                        </td>
                                        <td>
                                            {{drive.application_deadline}}
                                        </td>
                                        <td>
                                            <button class="btn btn-success btn-sm" @click="viewDrive(drive)">
                                                View Drive
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </section>

                    <!-- My Applications -->
                    <section id="applications" v-if="!searchMode || my_applications.length || interviewapplications.length || pendingplacements.length">
                    <h4> My Applications </h4>
                    <div class="card shadow mt-4">
                        <div class="card-header">
                            <h5>
                                Applied Drives
                            </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-primary">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Drive</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    <tr v-for="application in my_applications" :key="application.application_id">
                                        <td>
                                            {{application.application_id}}
                                        </td>
                                        <td>
                                            {{application.company_name}}
                                        </td>
                                        <td>
                                            {{application.job_title}}

                                        </td>
                                        <td>
                                            <status-badge :status="application.status">
                                            </status-badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card shadow mt-4">
                        <div class="card-header">
                            <h5>
                                Upcoming Interviews
                            </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-success">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Drive</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    <tr v-for="application in interviewapplications" :key="application.application_id">
                                        <td>
                                            {{application.application_id}}
                                        </td>
                                        <td>
                                            {{application.company_name}}
                                        </td>
                                        <td>
                                            {{application.job_title}}
                                        </td>
                                        <td>
                                            {{ application.interview ? application.interview.date : "-" }}
                                        </td>
                                        <td>
                                            <button class="btn btn-success btn-sm" @click="viewInterview(application)">
                                                View Interview
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5>
                                Offers Received
                            </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-warning">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Position</th>
                                        <th>Salary</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    <tr v-for="offer in pendingplacements" :key="offer.placement_id">
                                        <td>
                                            {{offer.placement_id}}
                                        </td>
                                        <td>
                                            {{offer.company_name}}
                                        </td>
                                        <td>
                                            {{offer.position}}
                                        </td>
                                        <td>
                                            {{offer.salary}}
                                        </td>
                                        <td>
                                            <button class="btn btn-success btn-sm" @click="viewOffer(offer)">
                                                View Offer
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </section>

                    <!-- Placement History -->
                    <section id="history" v-if="!searchMode || acceptedplacements.length">
                    <h4>Placement Stats</h4>
                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5>
                                Placement History
                            </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-danger">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Job Title</th>
                                        <th>Salary</th>
                                        <th>Offer Status</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    <tr v-for="placement in acceptedplacements" :key="placement.placement_id">
                                        <td>
                                            {{placement.placement_id}}
                                        </td>
                                        <td>
                                            {{placement.company_name}}
                                        </td>
                                        <td>
                                            {{placement.position}}
                                        </td>
                                        <td>
                                            {{placement.salary}}
                                        </td>
                                        <td>
                                            <status-badge :status="placement.offer_status">
                                            </status-badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>                    
                    <button class="btn btn-warning" @click="exportCSV">
                        Export Applications
                    </button>
                    </section>
                    <div class="card shadow mt-2 mb-5 text-center" v-else>
                        <div class="card-header">
                            <h5>
                                No match found.
                            </h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <footer-component> </footer-component>
    </div>
    `
}