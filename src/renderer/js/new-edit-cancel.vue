<script>
export default {
  props: {'editstate': String},
  computed: {
    editButtonText: function() {
      return this.editstate === 'edit' ? 'Save' : 'Edit';
    },
    newButtonText: function() {
      return this.editstate === 'new' ? 'Save' : 'New';
    },
    editDisabled: function() {
      return this.editstate === 'new' ? true : false;
    },
    newDisabled: function() {
      return this.editstate === 'edit' ? true : false;
    },
    cancelDisabled: function() {
      return this.editstate === 'view' ? true : false;
    }
  },
}
</script>

<template>
    <div class="form-row">
    
      <div class="col-md-2">
        <button type="button" class="btn btn-primary"
          @click="$emit('click-edit')" :disabled="editDisabled"> {{ editButtonText }}</button>
      </div>
      
      <div class="col-md-8">
        <button type="button" class="btn btn-secondary"
          @click="$emit('click-new')" :disabled="newDisabled"> {{ newButtonText }}</button>
      </div>
      
      <div class="col-md-2">
        <button type="button" class="btn btn-secondary float-right"
          @click="$emit('click-cancel')" :disabled="cancelDisabled">Cancel</button>
      </div>
      
    </div>
</template>
