const RegisterCompany = {
    data(){
        return{
            company:{
                company_name:"",
                username:"",
                email:"",
                password:"",
                confirm_password:""
          },
            loading:false,
            showError:false,
            errorMessage:""
        }
    },

    methods:{
        async registerCompany(){
            this.showError = false;
            if(
                !this.company.company_name ||
                !this.company.username ||
                !this.company.email ||
                !this.company.password ||
                !this.company.confirm_password
            ){
                this.errorMessage = "All fields are required.";
                this.showError = true;
                return;
            }
            if(this.company.password !== this.company.confirm_password){
                this.errorMessage = "Passwords do not match.";
                this.showError = true;
                return;
            }
            try{
                this.loading = true;
                await API.registerCompany({
                    company_name:this.company.company_name,
                    username:this.company.username,
                    email:this.company.email,
                    password:this.company.password
                });
                alert("Registration Request Submitted.");
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
                                Company Registration
                            </h2>

                            <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
                            </notification-toast>

                            <div class="mb-3">
                                <label class="form-label">
                                    Company Name
                                </label>
                                <input class="form-control" v-model="company.company_name">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Username
                                </label>
                                <input class="form-control" v-model="company.username">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Email
                                </label>
                                <input type="email" class="form-control" v-model="company.email">
                            </div>

                            <div class="mb-3">
                                <label class="form-label">
                                    Password
                                </label>
                                <input type="password" class="form-control" v-model="company.password">
                            </div>

                            <div class="mb-4">
                                <label class="form-label">
                                    Confirm Password
                                </label>
                                <input type="password" class="form-control" v-model="company.confirm_password" @keyup.enter="registerCompany">
                            </div>

                            <button class="btn btn-warning w-100" :disabled="loading" @click="registerCompany">
                                Register
                            </button>

                            <loader v-if="loading" message="Submitting Registration...">
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