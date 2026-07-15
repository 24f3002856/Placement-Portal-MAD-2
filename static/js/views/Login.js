const Login = {
    data() {
        return {
            username: "",
            password: "",
            loading: false,
            errorMessage: "",
            showError: false
       }
    },

    methods: {
        async login() {
            this.showError = false;
            if (!this.username || !this.password) {
                this.errorMessage = "Please enter Username and Password.";
                this.showError = true;
                return;
            }
            try {
                this.loading = true;
                const response = await API.login({
                    username: this.username,
                    password: this.password
                });

                localStorage.setItem("user", JSON.stringify({
                    role: response.role,
                    user_id: response.user_id,
                    student_id: response.student_id,
                    company_id: response.company_id
                }));

                if (response.role === "admin") {
                    this.$router.push("/admin");
                }
                else if (response.role === "company") {
                    this.$router.push("/company/" + response.company_id);
                }
                else if (response.role === "student") {
                    this.$router.push("/student/" + response.student_id);
                }
            }
            catch (error) {
                this.loading = false;
                this.errorMessage = error.message || "Invalid Username or Password";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        }
    },

    template: `
    <div>
        <navbar-component title="Placement Portal"></navbar-component>
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-5">
                    <div class="card shadow">
                        <div class="card-body">

                            <h2 class="text-center mb-4">
                                Login
                            </h2>

                            <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
                            </notification-toast>

                            <div class="mb-3">
                                <label class="form-label">
                                    Username
                                </label>
                                <input type="text" class="form-control" v-model="username">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Password
                                </label>
                                <input type="password" class="form-control" v-model="password" @keyup.enter="login">
                            </div>
                            <button class="btn btn-primary w-100" @click="login" :disabled="loading">
                                Login
                            </button>
                            
                            <loader v-if="loading" message="Authenticating...">
                            </loader>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer-component></footer-component>
    </div>
    `
}