<script>
let lx         = require('luxon');
let alqwuutils = require('./utils.js');
let $          = require('jquery');
let _          = require('lodash');

export default {
  
  props: {
    SamplePointId: Number,
  },
  
  data: function() {
    return {
      metas: []
    }
  },
  
  methods: {
    getLatestMetas(spID) {
      let query = {
        spID: spID,
      };
      return $.ajax({
        url:     `http://localhost:3000/api/v1/metadataBySamplePt`,
        method:  'GET',
        timeout: 3000,
        data: query,
        dataType: 'json',
        contentType: 'application/json'
      });
      console.log('getLatestMetas');
    },
  },
  
  watch: {
    SamplePointId: function(val) {
      this.getLatestMetas(val).done((metas) => {
        metas.forEach((d) => {
          d.dtstarts = d.DataStarts == null  ? "No Start Date"     : new Date(d.DataStarts).toLocaleDateString();
          d.dtends   = d.DataEnds == null    ? "No End Date"       : new Date(d.DataEnds).toLocaleDateString();
          d.dtloaded = d.CreatedOn == null   ? "No Loaded On Date" : new Date(d.CreatedOn).toLocaleDateString();
          d.User     = d.UserName == null    ? "Unknown"           : d.UserName;
        });
        this.metas = metas;
      });
    }
  }
}
</script>

<template>
  <div>
    <div class="row"
      v-for="meta in metas">
      <div class='col'>
        <h6> {{ meta.FileName }} </h6>
        <p> {{  
          `${meta.dtstarts} to 
          ${meta.dtends}; loaded on 
          ${meta.dtloaded} by 
          ${meta.User}` }}
        </p>
      </div>
    </div>
  </div>
</template>