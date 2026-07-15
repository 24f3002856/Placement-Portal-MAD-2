const ViewOffer = {
    data(){
        return{
            placement:{},
            offer:{},
            loading:false,
            showError:false,
            errorMessage:""
        }
    },

    async mounted(){
        await this.loadPlacement();
        await this.loadOffer();
    },

    methods:{
        async loadPlacement(){
            try{
                this.loading = true;
                const id = this.$route.params.id;
                this.placement = await API.getPlacement(id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load placement.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        async loadOffer(){
            try{
                this.loading = true;
                this.offer = await API.getOfferLetter(this.placement.placement_id);
            }
            catch(error){
                this.loading = false;
                this.errorMessage = error.error_message || "Unable to load offer.";
                this.showError = true;
            }
            finally{
                this.loading = false;
            }
        },

        viewOfferLetter(){
            window.open("/" + this.offer.pdf_path, "_blank");
        },

        async acceptOffer(){
            try{
                await API.updateOfferStatus(
                    this.placement.placement_id,
                    {
                        offer_status: "Accepted"
                    }
                );
                alert("Offer Accepted Successfully");
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to Accept Offer";
                this.showError = true;
            }
        },

        async rejectOffer(){
            try{
                await API.updateOfferStatus(
                    this.placement.placement_id,
                    {
                        offer_status: "Rejected"
                    }
                );
                alert("Offer Rejected Successfully");
                this.$router.back();
            }
            catch(error){
                this.errorMessage = error.error_message || "Unable to Reject Offer";
                this.showError = true;
            }
        }
    },

    template:`
    <div class="container py-4">
        <notification-toast v-if="showError" type="danger" :message="errorMessage" @close="showError=false">
        </notification-toast>

        <loader v-if="loading" message="Loading Offer...">
        </loader>

        <h2 class="mb-4">
            Offer Details
        </h2>

        <div class="card shadow">
            <div class="card-body">

                <p>
                    <strong>Company:</strong>
                    {{placement.company_name}}
                </p>

                <p>
                    <strong>Position:</strong>
                    {{placement.position}}
                </p>

                <p>
                    <strong>Salary:</strong>
                    {{placement.salary}}
                </p>

                <p>
                    <strong>Joining Date:</strong>
                    {{placement.joining_date}}
                </p>

                <p>
                    <strong>Offer Status:</strong>
                    <status-badge :status="placement.offer_status">
                    </status-badge>
                </p>

                <div class="mt-4 mb-4">
                    <button class="btn btn-outline-primary" @click="viewOfferLetter">
                        View Offer Letter
                    </button>
                </div>
                
                <div class="row">
                    <div class="col-8 d-flex justify-content-start">
                        <button class="btn btn-secondary" @click="$router.back()">
                            Back
                        </button>
                    </div>
                    <div class="col-4 d-flex justify-content-between">
                        <button v-if="placement.offer_status=='Pending'" class="btn btn-success me-2" @click="acceptOffer">
                            Accept Offer
                        </button>

                        <button v-if="placement.offer_status=='Pending'" class="btn btn-danger" @click="rejectOffer">
                            Reject Offer
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `
}