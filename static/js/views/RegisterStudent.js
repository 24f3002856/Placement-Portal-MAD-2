const RegisterStudent = {
    data() {
        return {
            student: {
                student_name: "",
                username: "",
                email: "",
                password: "",
                confirm_password: ""
            },
            loading: false,
            showError: false,
            errorMessage: ""
        }
    },

    methods: {
        async registerStudent() {
            this.showError = false;
            if (
                !this.student.student_name ||
                !this.student.username ||
                !this.student.email ||
                !this.student.password ||
                !this.student.confirm_password
            ) {
                this.errorMessage = "All fields are required.";
                this.showError = true;
                return;
            }
            if (this.student.password !== this.student.confirm_password) {
                this.errorMessage = "Passwords do not match.";
                this.showError = true;
                return;
            }
            try {
                this.loading = true;
                
                await API.registerStudent({
                    student_name: this.student.student_name,
                    username: this.student.username,
                    email: this.student.email,
                    password: this.student.password
                });
                alert("Registration Successful.");
                this.$router.push("/login");
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Registration Failed";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        }
    },

    template:`
    <div>
        <navbar-component></navbar-component>
        <div class="container py-5">
            <div class="row justify-content-center">
                <div class="col-lg-6">
                    <div class="card shadow">
                        <div class="card-body">
                            <h2 class="text-center mb-4">
                                Student Registration
                            </h2>

                            <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
                            </notification-toast>

                            <div class="mb-3">
                                <label class="form-label">
                                    Student Name
                                </label>
                                <input class="form-control" v-model="student.student_name">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Username
                                </label>
                                <input class="form-control" v-model="student.username">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Email
                                </label>
                                <input type="email" class="form-control" v-model="student.email">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Password
                                </label>
                                <input type="password" class="form-control" v-model="student.password">
                            </div>

                            <div class="mb-4">
                                <label class="form-label">
                                    Confirm Password
                                </label>
                                <input type="password" class="form-control" v-model="student.confirm_password" @keyup.enter="registerStudent">
                            </div>

                            <button class="btn btn-success w-100" :disabled="loading" @click="registerStudent">
                                Register
                            </button>

                            <loader v-if="loading" message="Creating Account...">
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