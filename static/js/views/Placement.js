const Placement = {
    data(){
        return{
            placement:{
                application_id:null,
                student_id:null,
                company_id:null,
                position:"",
                salary:null,
                joining_date:"",
            },
            offer:{
                placement_id:null
            },
            offerFile: null,
            application:{},
            drive:{},
            loading: false,
            errorMessage: "",
            showError: false
        }
    },

    async mounted(){
        await this.loadApplication();
        await this.loadDrive();
    },

    methods:{
        async loadApplication(){
            try{
                const id = this.$route.params.id;
                this.loading = true;                
                this.application = await API.getApplication(id);

                this.placement.application_id = id;
                this.placement.student_id = this.application.student_id;
                this.placement.position = this.application.job_title;
            }
            catch (error) {
                this.loading = false;
                this.errorMessage = error.message || "Unable to load application.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async loadDrive(){
            try{
                this.loading = true; 
                this.drive = await API.getDrive(this.application.drive_id);

                this.placement.company_id = this.drive.company_id;
                this.placement.salary = this.drive.salary;
            }
            catch (error) {
                this.loading = false;
                this.errorMessage = error.message || "Unable to load drive.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },   

        selectOfferLetter(event){
            this.offerFile = event.target.files[0];
        },  

        async createPlacement(){
            try{
                const placement = await API.createPlacement(this.placement);            
                const formData = new FormData();

                formData.append("placement_id", placement.placement_id);        
                formData.append("offer_letter",this.offerFile);  

                await API.createOfferLetter(formData);
                alert("Placement added Successfully");
                this.$router.back();
            }
            catch (error) {
                this.errorMessage = error.message || "Unable to create placement.";
                this.showError = true;
            }
        }
    },

    template:`
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Placement Form...">
        </loader> 

        <h2 class="mb-4">
            Add Placement & Create Offer-Letter
        </h2>

        <div class="card shadow">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Joining Date
                        </label>
                        <input type="date" class="form-control" v-model="placement.joining_date">
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">
                            Upload Offer-Letter
                        </label>
                        <input class="form-control" type="file" accept=".pdf" @change="selectOfferLetter">
                    </div>
                </div>    
                <div class="row">
                    <div class="col-8 d-flex justify-content-start">
                        <button class="btn btn-secondary" @click="$router.back()">
                            Back
                        </button>
                    </div>
                    <div class="col-4 d-flex justify-content-end">
                        <button class="btn btn-primary me-2" @click="createPlacement">
                            Add Placement
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
}