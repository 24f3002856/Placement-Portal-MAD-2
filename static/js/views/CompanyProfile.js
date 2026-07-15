const CompanyProfile = {
    data() {
        return {
            company: {},
            loading: false,
            showError: false,
            errorMessage: "",
        }
    },

    async mounted() {
        await this.loadCompany();
    },

    methods: {
        async loadCompany() {
            try{
                const id = this.$route.params.id;
                this.loading = true
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

        async updateProfile() {
            try{
                await API.updateCompany(this.company.company_id, this.company);
                alert("Company Profile Updated");
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to update profile.";
                this.showError = true;
            }
        }
    },

    template: `
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Company Form...">
        </loader>    

        <h2 class="mb-4">Company Profile</h2>
        <div class="card shadow">
            <div class="card-body">
                <div class="row">

                    <div class="col-md-6 mb-3">
                        <label class="form-label">Company Name</label>
                        <input class="form-control" v-model="company.company_name">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">Contact</label>
                        <input class="form-control" v-model="company.hr_contact">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">Website</label>
                        <input class="form-control" v-model="company.website">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">Industry</label>
                        <input class="form-control" v-model="company.industry">
                    </div>

                    <div class="col-12 mb-3">
                        <label class="form-label">Overview</label>
                        <textarea rows="5" class="form-control" v-model="company.overview"></textarea>
                    </div>

                </div>

                <div class="mt-4 d-flex justify-content-between">
                    <button class="btn btn-warning" @click="$router.back()">
                        Back
                    </button>

                    <button class="btn btn-success me-2" @click="updateProfile">
                        Save Changes
                    </button>                    
                </div>

            </div>
        </div>
    </div>
    `
}