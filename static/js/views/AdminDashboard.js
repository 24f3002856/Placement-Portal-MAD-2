const AdminDashboard = {
    data() {
        return {
            loading: false,
            dashboard: {},
            companies: [],
            students: [],
            drives: [],
            applications: [],
            placements: [],
            searchQuery: "",
            notification: {
                show: false,
                type: "success",
                message: ""
            },
            errorMessage: "",
            showError: false,
            searchMode: false
        }
    },

    async mounted(){
        await this.loadDashboard();
        await this.loadCompanies();
        await this.loadStudents();
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
                this.dashboard = await API.getAdminDashboard();
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
        // Companies
        //-------------------------
        async loadCompanies(){
            try{
                this.loading = true;
                this.companies = await API.getCompanyList();
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load companies.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async approveCompany(company){
            await API.approveCompany(company.company_id);
            this.loadCompanies();
        },
        async rejectCompany(company){
            await API.rejectCompany(company.company_id);
            this.loadCompanies();
        },
        async blacklistCompany(company){
            await API.blacklistCompany(company.company_id);
            this.loadCompanies();
        },
        async whitelistCompany(company){
            await API.whitelistCompany(company.company_id);
            this.loadCompanies();
        },

        //-------------------------
        // Students
        //-------------------------
        async loadStudents(){
            try{
                this.loading = true;
                this.students = await API.getStudentList();
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load students.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async blacklistStudent(student){
            await API.blacklistStudent(student.student_id);
            this.loadStudents();
        },
        async whitelistStudent(student){
            await API.whitelistStudent(student.student_id);
            this.loadStudents();
        },

        //-------------------------
        // Drives
        //-------------------------
        async loadDrives(){
            try{
                this.loading = true;
                this.drives = await API.getDriveList();
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

        //-------------------------
        // Applications
        //-------------------------
        async loadApplications(){
            try{
                this.loading = true;
                this.applications = await API.getApplicationList();
            }
            catch(error){
                this.loading = false;
                cthis.errorMessage = error.error_message || "Unable to load applications.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        //-------------------------
        // Placements
        //-------------------------
        async loadPlacements(){
            try{
                this.loading = true;
                this.placements = await API.getPlacementList({offer_status: "Accepted"});
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

        //-------------------------
        // Search
        //-------------------------
        async search(query){
            this.searchQuery = query;
            if(!this.searchQuery.trim()){                
                this.searchMode = false

                this.loadCompanies();
                this.loadStudents();
                this.loadDrives();
                this.loadApplications();
                this.loadPlacements();
                return;
            }
            try{
                this.searchMode = true
                this.loading = true;
                const results = await API.searchAdmin(query)
                
                this.companies = results.companies || [];
                this.students = results.students || [];
                this.drives = results.drives || [];
                this.applications = results.applications || [];
                this.placements = results.placements || [];
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Search failed.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },
        viewDrive(drive){
            this.$router.push("/drive/"+drive.drive_id);
        },
        viewApplication(application){
            this.$router.push("/application/"+application.application_id);
        },
    },

    computed:{
        pendingCompanies(){            
            return this.companies.filter(company => company.approval_status==="Pending")
        },
        approvedCompanies(){
            return this.companies.filter( company => (company.approval_status==="Approved") && (company.blacklist_flag==="No"))
        },
        blacklistedCompanies(){
            return this.companies.filter( company => company.approval_status==="Approved" && company.blacklist_flag==="Yes")
        },
        activeStudents(){
            return this.students.filter( student => student.blacklist_flag==="No")
        },
        blacklistedStudents(){
            return this.students.filter( student => student.blacklist_flag==="Yes")
        },
        pendingDrives(){
            return this.drives.filter( drive => drive.status==="Pending")
        },
        approvedDrives(){
            return this.drives.filter( drive => drive.status==="Approved")
        },
        nonselectedApplications(){
            return this.applications.filter(application => application.status != "Selected")
        }
    },

    template:`
    <div>
        <navbar-component
            title="Admin Dashboard"
            :showLogout="true">
        </navbar-component>

        <div class="container-fluid">
            <div class="row">

                <!-- Sidebar -->
                <div class="col-md-2">
                    <sidebar-component
                        :menu-items="[
                        {
                            name:'Companies',
                            id:'companies'
                        },
                        {
                            name:'Students',
                            id:'students'
                        },
                        {
                            name:'Drives',
                            id:'drives'
                        },
                        {
                            name:'Applications',
                            id:'applications'
                        },
                        {
                            name:'Placements',
                            id:'placements'
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
                    
                    <h2 class="mb-4">
                        Welcome Admin !
                    </h2>

                    <!-- Dashboard Cards -->
                    <div class="row justify-content-center g-3 ">
                        <div class="col-lg-3">
                            <dashboard-card title="Registered Companies" :value="dashboard.registered_companies" subtitle="Registered" color="success">
                            </dashboard-card>
                        </div>

                        <div class="col-lg-3">
                            <dashboard-card title="Registered Students" :value="dashboard.registered_students" subtitle="Registered" color="primary">
                            </dashboard-card>
                        </div>

                        <div class="col-lg-3">
                            <dashboard-card title="Ongoing Drives" :value="dashboard.ongoing_drives" subtitle="Placement Drives" color="warning">
                            </dashboard-card>
                        </div>
                    </div>
                    <br>
                    <div class="row justify-content-center g-3 mb-5">
                        <div class="col-lg-3">
                            <dashboard-card title="Job Applications" :value="dashboard.applications" subtitle="Applications" color="danger">
                            </dashboard-card>
                        </div>

                        <div class="col-lg-3">
                            <dashboard-card title="Placements" :value="dashboard.placed_students" subtitle="Placements" color="info">
                            </dashboard-card>
                        </div>
                    </div>
                    <br>
                    <search-bar
                        placeholder="Search Companies, Students, Drives, Applications..."
                        @search="search">
                    </search-bar>                    

                    <!-- Company Management -->                    
                    
                    <section id="companies" v-if="!searchMode || pendingCompanies.length || approvedCompanies.length || blacklistedCompanies.length" class="mt-5">
                    <h4> Company Management </h4>

                    <div class="card shadow mt-4">
                        <div class="card-header">
                            <h5>
                                Company Applications
                            </h5>
                        </div>

                        <div class="card-body">
                            <table class="table table-hover table-bordered">
                                <thead class="table-success">
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Action 1</th>
                                        <th>Action 2</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="company in pendingCompanies" :key="company.company_id">                                        
                                        <td>
                                            {{company.company_id}}
                                        </td>
                                        <td>
                                            {{company.company_name}}
                                        </td>
                                        <td>
                                            <status-badge :status="company.approval_status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-success btn-sm me-1" @click="approveCompany(company)">
                                                Approve
                                            </button>
                                        </td>
                                        <td>
                                            <button class="btn btn-danger btn-sm me-1" @click="rejectCompany(company)">
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card shadow mt-4">
                        <div class="card-header">
                            <h5>
                                Registered Companies
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered mt-3">
                                <thead class="table-success">
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Website</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="company in approvedCompanies" :key="company.company_id">
                                        <td>
                                            {{company.company_id}}
                                        </td>
                                        <td>
                                            {{company.company_name}}
                                        </td>
                                        <td>
                                            {{company.website}}
                                        </td>
                                        <td>
                                            <status-badge :status="company.approval_status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-danger btn-sm" @click="blacklistCompany(company)">
                                                Blacklist
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
                                Blacklisted Companies
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered mt-3">
                                <thead class="table-success">
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Website</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="company in blacklistedCompanies" :key="company.company_id">
                                        <td>
                                            {{company.company_id}}
                                        </td>
                                        <td>
                                            {{company.company_name}}
                                        </td>
                                        <td>
                                            {{company.website}}
                                        </td>
                                        <td>
                                            <status-badge :status="company.approval_status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-warning btn-sm" @click="whitelistCompany(company)">
                                                Whitelist
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </section>
                    <br>

                    <!-- Student Management -->
                    <div id="students" v-if="!searchMode || activeStudents.length || blacklistedStudents.length">
                    <h4> Student Management </h4>

                    <div class="card shadow mt-4">
                        <div class="card-header">
                            <h5>
                                Registered Students
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered mt-3">
                                <thead class="table-primary">
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Gender</th>
                                        <th>Department</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="student in activeStudents" :key="student.student_id">
                                        <td>
                                            {{student.student_id}}
                                        </td>
                                        <td>
                                            {{student.student_name}}
                                        </td>
                                        <td>
                                            {{student.gender}}
                                        </td>
                                        <td>
                                            {{student.department}}
                                        </td>
                                        <td>
                                            <button class="btn btn-danger btn-sm" @click="blacklistStudent(student)">
                                                Blacklist
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
                                Blacklisted Students
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered mt-3">
                                <thead class="table-primary">
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Gender</th>
                                        <th>Department</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    <tr v-for="student in blacklistedStudents" :key="student.student_id">
                                        <td>
                                            {{student.student_id}}
                                        </td>
                                        <td>
                                            {{student.student_name}}
                                        </td>
                                        <td>
                                            {{student.gender}}
                                        </td>
                                        <td>
                                            {{student.department}}
                                        </td>
                                        <td>
                                            <button class="btn btn-success btn-sm" @click="whitelistStudent(student)">
                                                Whitelist
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                    <br>

                    <!-- Drive Management -->
                    <div id="drives" v-if="!searchMode || pendingDrives.length || approvedDrives.length">
                    <h4> Drive Management </h4>

                    <div class="card shadow mt-4">
                        <div class="card-header">
                            <h5>
                                Drive Applications
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered">
                                <thead class="table-warning">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Job Title</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="drive in pendingDrives" :key="drive.drive_id">
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
                            <h5>
                                Ongoing Drives
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered">
                                <thead class="table-warning">
                                    <tr>
                                        <th>ID</th>
                                        <th>Company</th>
                                        <th>Job Title</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr v-for="drive in approvedDrives" :key="drive.drive_id">
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
                                            <status-badge :status="drive.status">
                                            </status-badge>
                                        </td>
                                        <td>
                                            <button class="btn btn-warning btn-sm me-1" @click="viewDrive(drive)">
                                                View Drive
                                            </button>                                          
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                    <br>

                    <!-- Application Management -->
                    <div id="applications" v-if="!searchMode || nonselectedApplications.length">
                    <h4> Application Management </h4>
                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5>
                                Student Applications
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered">
                                <thead class="table-danger">
                                    <tr>
                                        <th>ID</th>
                                        <th>Student</th>
                                        <th>Company</th>
                                        <th>Drive</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="application in nonselectedApplications" :key="application.application_id">
                                        <td>
                                            {{application.application_id}}
                                        </td>
                                        <td>
                                            {{application.student_name}}
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
                                        <td>
                                            <button class="btn btn-warning btn-sm me-1" @click="viewApplication(application)">
                                                View Application
                                            </button>                                          
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                    <br>

                    <!-- Placements -->
                    <div id="placements" v-if="!searchMode || placements.length">
                    <h4> Placements </h4>
                    <div class="card shadow mt-4 mb-5">
                        <div class="card-header">
                            <h5>
                                Student Placements
                            </h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-hover table-bordered">
                                <thead class="table-info">
                                    <tr>
                                        <th>ID</th>
                                        <th>Student</th>
                                        <th>Company</th>
                                        <th>Position</th>
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
                                            {{placement.company_name}}
                                        </td>
                                        <td>
                                            {{placement.position}}
                                        </td>
                                        <td>
                                            {{placement.joining_date}}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>

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
