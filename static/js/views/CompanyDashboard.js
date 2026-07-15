const CompanyDashboard = {
    data() {
        return {
            loading: false,
            showError: false,
            errorMessage: "",
            dashboard: {},
            company: {},
            drives: [],
            applications: [],
            placements: [],
        }
    },

    async mounted(){
        await this.loadDashboard();
        await this.loadCompany();
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
                this.dashboard = await API.getCompanyDashboard();
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
        // Company Profile
        //-------------------------
        async loadCompany(){
            try{
                const id = this.$route.params.id;
                this.loading = true;
                this.company = await API.getCompany(id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load company.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
        async updateCompanyProfile(){
            this.$router.push("/company_profile/"+ this.company.company_id);
        },

        //-------------------------
        // Placement Drives
        //-------------------------
        async loadDrives(){
            try{
                this.loading = true;
                this.drives = await API.getDriveList({
                    company_id: this.company.company_id
                });
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
        async createDrive(){
            this.$router.push("/create_drive");
        },
        async closeDrive(drive){
            try{
                await API.closeDrive(drive.drive_id);
                this.loadDrives();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to load drives.";
                this.showError = true;
            }
        },
        viewDrive(drive){
            this.$router.push("/drive/"+drive.drive_id);
        },

        //-------------------------
        // Applications
        //-------------------------
        async loadApplications(){
            try{
                this.loading = true;
                this.applications = await API.getApplicationList({
                    company_id: this.company.company_id
                });
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
        async shortlist(application){
            try{
                application.status="Shortlisted";
                await API.updateApplication( application.application_id, application);
                this.loadApplications();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update application.";
                this.showError = true;
            }
        },
        async reject(application){
            try{
                application.status="Rejected";
                await API.updateApplication(application.application_id,application);
                this.loadApplications();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update application.";
                this.showError = true;
            }
        },
        viewApplication(application){
            this.$router.push("/application/" + application.application_id);
        },

        //-------------------------
        // Interview
        //-------------------------
        async scheduleInterview(application){
            this.$router.push("/schedule_interview/"+application.application_id);
        },

        async loadPlacements(){
            try{
                this.loading = true;
                this.placements = await API.getPlacementList({
                    company_id: this.company.company_id,
                    offer_status: "Accepted"
                });
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load placements.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
    },

    computed: {
        pendingDrives(){
            return this.drives.filter( drive => drive.status==="Pending")
        },
        approvedDrives(){
            return this.drives.filter( drive => drive.status==="Approved")
        },
        closedDrives(){
            return this.drives.filter( drive => drive.status==="Closed")
        },
        studentsPlaced(){
            return this.placements
        }
    },

    template:`
    <div>
        <navbar-component title="Company Dashboard" showLogout=True>
        </navbar-component>

        <div class="container-fluid">
            <div class="row">

                <!-- Sidebar -->
                <div class="col-md-2">
                    <sidebar-component
                    :menu-items="[               
                    {
                    name:'My Drives',
                    id:'drives'
                    },
                    {
                    name:'Placed Students',
                    id:'placements'
                    }
                    ]">
                    </sidebar-component>
                </div>

                <!-- Main -->
                <div class="col-md-10 p-4">
                    <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
                    </notification-toast>

                    <loader v-if="loading" message="Loading Dashboard...">
                    </loader>

                    <div class="d-flex justify-content-between align-items-center">
                        <h2 class="mb-4">
                            Welcome {{company.company_name}} !
                        </h2>
                        <button class="btn btn-primary btn-sm" @click="updateCompanyProfile()"> 
                            Edit Profile
                        </button>
                    </div>

                    <!-- Dashboard Cards -->
                    <div class="row g-3 mb-5">
                        <div class="col-md-3">
                            <dashboard-card title="Ongoing Drives" :value="dashboard.ongoing_drives" subtitle="Created" color="primary">
                            </dashboard-card>
                        </div>

                        <div class="col-md-3">
                            <dashboard-card title="Total Applications" :value="dashboard.applications" subtitle="Received" color="success">
                            </dashboard-card>
                        </div>
                        
                        <div class="col-md-3">
                            <dashboard-card title="Shortlisted Students" :value="dashboard.shortlisted_students" subtitle="Students" color="warning">
                            </dashboard-card>
                        </div>

                        <div class="col-md-3">
                            <dashboard-card title="Placements" :value="dashboard.placed_students" subtitle="Selected" color="danger">
                            </dashboard-card>
                        </div>
                    </div>                                        
                    
                    <!-- My Placement Drives -->
                    <section id="drives">
                    <h4> My Placement Drives </h4>

                    <div class="card shadow mt-4">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5> Ongoing Drives </h5>
                            <button class="btn btn-warning" @click="createDrive()"> Create Drive </button>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-primary">
                                    <tr>
                                        <th>ID</th>
                                        <th>Job Title</th>
                                        <th>Deadline</th>
                                        <th>Status</th>
                                        <th>Action 1</th>
                                        <th>Action 2</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="drive in approvedDrives" :key="drive.drive_id">
                                        <td>
                                            {{drive.drive_id}}
                                        </td>
                                        <td>
                                            {{drive.job_title}}
                                        </td>
                                        <td>
                                            {{drive.application_deadline}}
                                        </td>
                                        <td>
                                            <status-badge :status="drive.status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-info btn-sm" @click="viewDrive(drive)">
                                                View Drive
                                            </button>
                                        </td>
                                        <td>
                                            <button class="btn btn-warning btn-sm" @click="closeDrive(drive)">
                                                Close Drive
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5> Applied Drives </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-primary">
                                    <tr>
                                        <th>ID</th>
                                        <th>Job Title</th>
                                        <th>Deadline</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="drive in pendingDrives" :key="drive.drive_id">
                                        <td>
                                            {{drive.drive_id}}
                                        </td>
                                        <td>
                                            {{drive.job_title}}
                                        </td>
                                        <td>
                                            {{drive.application_deadline}}
                                        </td>
                                        <td>
                                            <status-badge :status="drive.status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-info btn-sm" @click="viewDrive(drive)">
                                                View Drive
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5> Closed Drives </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-primary">
                                    <tr>
                                        <th>ID</th>
                                        <th>Job Title</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="drive in closedDrives" :key="drive.drive_id">
                                        <td>
                                            {{drive.drive_id}}
                                        </td>
                                        <td>
                                            {{drive.job_title}}
                                        </td>
                                        <td>
                                            <status-badge :status="drive.status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-info btn-sm" @click="viewDrive(drive)">
                                                View Drive
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </section>

                    <!-- Placed Students -->
                    <section id="placements">
                    <h4> Placements </h4>

                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5> Placed Students </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-bordered table-hover">
                                <thead class="table-danger">
                                    <tr>
                                        <th>ID</th>
                                        <th>Student Name</th>
                                        <th>Position</th>
                                        <th>Salary</th>
                                        <th>Joining Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="placement in placements" :key="placement.placement_id">
                                        <td>
                                            {{placement.placement_id}}
                                        </td>
                                        <td>
                                            {{placement.student_name}}
                                        </td>
                                        <td>
                                            {{placement.position}}
                                        </td>
                                        <td>
                                            {{placement.salary}}
                                        </td>
                                        <td>
                                            {{placement.joining_date}}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </section>
                </div>
            </div>
        </div>
        <footer-component> </footer-component>
    </div>
    `
}