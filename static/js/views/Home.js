const Home = {
template:`
<div>
    <navbar-component
        title="Placement Portal">
    </navbar-component>

    <div class="container py-5">
        <!-- Hero Section -->
        <div class="text-center">
            <h1 class="display-4 fw-bold">
                Placement Portal
            </h1>

            <p class="lead text-muted">
                Modern Placement Management System
            </p>
        </div>

        <!-- Login Card -->
        <div class="row justify-content-center mt-5">
            <div class="col-lg-5">
                <div class="card shadow">
                    <div class="card-body text-center">
                        <h3>
                            Welcome
                        </h3>

                        <p class="text-muted">
                            Login to continue
                        </p>

                        <router-link to="/login" class="btn btn-primary w-100">
                            Login
                        </router-link>
                        <hr>
                        <h5>
                            New User ?
                        </h5>
                        <div class="d-grid gap-2 mt-3">
                            <router-link to="/register/student" class="btn btn-outline-success">
                                Register Student
                            </router-link>

                            <router-link to="/register/company" class="btn btn-outline-warning">
                                Register Company
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features -->
        <div class="row mt-5">
            <div class="col-md-3">
                <dashboard-card title="Jobs" value="100+" subtitle="Placement Drives" color="primary">
                </dashboard-card>
            </div>

            <div class="col-md-3">
                <dashboard-card title="Companies" value="50+" subtitle="Recruiters" color="success">
                </dashboard-card>
            </div>

            <div class="col-md-3">
                <dashboard-card title="Interviews" value="Online" subtitle="Scheduling" color="warning">
                </dashboard-card>
            </div>

            <div class="col-md-3">
                <dashboard-card title="Offers" value="PDF" subtitle="Offer Letters" color="danger">
                </dashboard-card>
            </div>
        </div>
    </div>
    <footer-component> </footer-component>
</div>
`
}